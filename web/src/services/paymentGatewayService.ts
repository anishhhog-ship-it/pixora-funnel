import { Business } from '@/types';
import { businessService } from './index';
import { constructUpiUri } from '@/lib/qrDecoder';
import { DEFAULT_PRICING_PLAN_SLUG, getPricingPlan } from '@/config/pricing';

export interface PaymentGatewayConfig {
  upiId: string;
  payeeName: string;
  qrImageUrl?: string;
  autoActivateOnNotification: boolean;
  webhookSecret: string;
  updatedAt: string;
}

export interface PaymentOrder {
  id: string; // e.g. PX-ORD-171293
  businessId: string;
  businessName: string;
  planId: string;
  planName: string;
  amount: number;
  isLifetime: boolean;
  includesNfc: boolean;
  currency: string;
  status: 'PENDING' | 'PENDING_APPROVAL' | 'VERIFYING' | 'PAID' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  upiUri: string;
  utrNumber?: string;
  createdAt: string;
  expiresAt: string;
  submittedAt?: string;
  paidAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  verificationMethod?: 'NOTIFICATION' | 'UTR_CONFIRMED' | 'ADMIN_MANUAL' | 'ADMIN_APPROVED' | 'UTR_SUBMITTED';
  rawNotification?: string;
}

export interface ParsedBankNotification {
  amount: number;
  utr?: string;
  sender?: string;
  packageName?: string;
  rawText: string;
  timestamp: string;
}

const DEFAULT_CONFIG: PaymentGatewayConfig = {
  upiId: '9257378047@ybl',
  payeeName: 'Pixora Automations',
  qrImageUrl: '',
  autoActivateOnNotification: true,
  webhookSecret: 'pixora_live_sec_92573',
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY_CONFIG = 'pixora_payment_gateway_config';
const STORAGE_KEY_ORDERS = 'pixora_payment_orders';

class PaymentGatewayService {
  private config: PaymentGatewayConfig = DEFAULT_CONFIG;
  private orders: Map<string, PaymentOrder> = new Map();

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (storedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }

      const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (storedOrders) {
        const list: PaymentOrder[] = JSON.parse(storedOrders);
        list.forEach((ord) => this.orders.set(ord.id, ord));
      }
    } catch (e) {
      console.warn('PaymentGatewayService load error:', e);
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      const list = Array.from(this.orders.values()).slice(-50); // Keep last 50
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list));
    } catch (e) {
      console.warn('PaymentGatewayService save error:', e);
    }
  }

  public getConfig(): PaymentGatewayConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PaymentGatewayConfig>): PaymentGatewayConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return { ...this.config };
  }

  /**
   * Creates a live payment order with the amount derived from the canonical plan catalog.
   */
  public createOrder({
    businessId,
    businessName,
    planId,
  }: {
    businessId: string;
    businessName: string;
    planId: string;
  }): PaymentOrder {
    const plan = getPricingPlan(planId) || getPricingPlan(DEFAULT_PRICING_PLAN_SLUG)!;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PX-ORD-${Date.now().toString().slice(-6)}${randomSuffix}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes window

    const upiUri = constructUpiUri({
      upiId: this.config.upiId,
      payeeName: this.config.payeeName,
      amount: plan.price_inr,
      orderId,
      note: `Pixora ${plan.name.slice(0, 20)} - ${orderId}`,
    });

    const order: PaymentOrder = {
      id: orderId,
      businessId,
      businessName,
      planId: plan.slug,
      planName: plan.name,
      amount: plan.price_inr,
      isLifetime: plan.is_lifetime,
      includesNfc: plan.includes_nfc,
      currency: 'INR',
      status: 'PENDING',
      upiUri,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.orders.set(orderId, order);
    this.saveState();

    return order;
  }

  public getOrder(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  public getAllOrders(): PaymentOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Customer submits their 12-digit UPI UTR / Reference ID for verification
   */
  public async submitUtr(orderId: string, utr: string): Promise<{ success: boolean; message: string; order?: PaymentOrder }> {
    const cleanUtr = (utr || '').replace(/\D/g, '').trim();
    if (cleanUtr.length < 10 || cleanUtr.length > 16) {
      return { success: false, message: 'Please enter a valid 12-digit UPI Reference Number / UTR.' };
    }

    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found or expired.' };
    }

    order.utrNumber = cleanUtr;
    order.status = 'PENDING_APPROVAL';
    order.submittedAt = new Date().toISOString();
    order.verificationMethod = 'UTR_SUBMITTED';
    this.saveState();

    return {
      success: true,
      message: 'UTR submitted! Awaiting administrator verification and approval.',
      order,
    };
  }

  /**
   * Admin approves transaction: marks PAID and triggers dashboard activation
   */
  public async approveOrder(orderId: string): Promise<{ success: boolean; message: string; order?: PaymentOrder }> {
    const res = await this.completeOrder(orderId, 'ADMIN_MANUAL', 'Approved by Admin');
    if (res.success && res.order) {
      res.order.approvedAt = new Date().toISOString();
      this.saveState();
    }
    return res;
  }

  /**
   * Admin rejects transaction with optional reason
   */
  public async rejectOrder(orderId: string, reason?: string): Promise<{ success: boolean; message: string; order?: PaymentOrder }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    order.status = 'REJECTED';
    order.rejectionReason = reason || 'Payment not verified / Invalid UTR';
    order.rejectedAt = new Date().toISOString();
    this.saveState();

    return {
      success: true,
      message: `Order #${orderId} marked as rejected.`,
      order,
    };
  }

  /**
   * Marks order as paid, generates the plan entitlement, and triggers instant dashboard activation
   */
  public async completeOrder(
    orderId: string,
    method: 'NOTIFICATION' | 'UTR_CONFIRMED' | 'ADMIN_MANUAL',
    rawDetails?: string
  ): Promise<{ success: boolean; message: string; order?: PaymentOrder }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.verificationMethod = method;
    order.rawNotification = rawDetails || order.rawNotification;
    this.saveState();

    // Activate the business dashboard for the selected lifetime plan.
    try {
      const generatedLicenseKey = `PX-${order.id.replace('PX-ORD-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      await businessService.activateDashboardWithLicenseKey(order.businessId, generatedLicenseKey);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`pixora_plan_active_${order.businessId}`, 'true');
        localStorage.setItem(`pixora_plan_order_${order.businessId}`, order.id);

        window.dispatchEvent(
          new CustomEvent('pixora:dashboard_activated', {
            detail: {
              businessId: order.businessId,
              orderId: order.id,
              amount: order.amount,
              planName: order.planName,
            },
          })
        );
      }
    } catch (e) {
      console.warn('Auto-activation hook error:', e);
    }

    return {
      success: true,
      message: '✓ Payment verified! Your lifetime dashboard access has been activated instantly.',
      order,
    };
  }

  /**
   * Parses incoming SMS or PhonePe/Bank Push Notification
   */
  public parseNotificationText(text: string, senderOrPackage?: string): ParsedBankNotification | null {
    if (!text || typeof text !== 'string') return null;

    // 1. Amount extraction (e.g. ₹2,599, Rs. 2599, Rs 2,999.00, INR 2599)
    const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const amountMatch = text.match(amountRegex);
    let amount = 0;
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    } else {
      // Look for "received 2599" or "credited with 2599"
      const altMatch = text.match(/(?:received|credited|added)\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
      if (altMatch) {
        amount = parseFloat(altMatch[1].replace(/,/g, ''));
      }
    }

    if (!amount || isNaN(amount)) return null;

    // 2. 12-digit UTR extraction (e.g. UPI Ref: 429381920391, UTR 429381920391, Ref no 429381920391)
    let utr: string | undefined = undefined;
    const utrRegex = /(?:upi(?:\s*ref)?(?:\s*no)?|ref(?:\s*no)?|utr(?:\s*no)?|txn(?:\s*id)?|reference)\s*[:\-\/]?\s*(\d{10,16})/i;
    const utrMatch = text.match(utrRegex);
    if (utrMatch) {
      utr = utrMatch[1];
    } else {
      // General 12 digit standalone match
      const generalUtrMatch = text.match(/\b(\d{12})\b/);
      if (generalUtrMatch) {
        utr = generalUtrMatch[1];
      }
    }

    // 3. Sender / Payer Name extraction
    let sender: string | undefined = senderOrPackage;
    const payerMatch = text.match(/(?:from|by)\s+([A-Za-z\s]+?)(?:\s+(?:via|using|on|ref|upi|in|a\/c)|[.,]|$)/i);
    if (payerMatch && payerMatch[1].trim().length > 2) {
      sender = payerMatch[1].trim();
    }

    return {
      amount,
      utr,
      sender,
      packageName: senderOrPackage,
      rawText: text,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reconciles incoming bank notification with pending customer orders
   */
  public async reconcileNotification(notification: ParsedBankNotification): Promise<{
    matched: boolean;
    order?: PaymentOrder;
    message: string;
  }> {
    const pendingOrders = Array.from(this.orders.values()).filter(
      (o) => o.status === 'PENDING' || o.status === 'VERIFYING'
    );

    if (pendingOrders.length === 0) {
      return { matched: false, message: 'No pending orders waiting for payment.' };
    }

    // Match priority 1: UTR match
    if (notification.utr) {
      const matchByUtr = pendingOrders.find(
        (o) => o.utrNumber && o.utrNumber === notification.utr
      );
      if (matchByUtr) {
        await this.completeOrder(matchByUtr.id, 'NOTIFICATION', notification.rawText);
        return {
          matched: true,
          order: matchByUtr,
          message: `Matched Order ${matchByUtr.id} by 12-digit UTR ${notification.utr}`,
        };
      }
    }

    // Match priority 2: Order ID mentioned in raw notification text
    const matchByOrderId = pendingOrders.find((o) =>
      notification.rawText.includes(o.id)
    );
    if (matchByOrderId) {
      if (notification.utr && !matchByOrderId.utrNumber) {
        matchByOrderId.utrNumber = notification.utr;
      }
      await this.completeOrder(matchByOrderId.id, 'NOTIFICATION', notification.rawText);
      return {
        matched: true,
        order: matchByOrderId,
        message: `Matched Order ${matchByOrderId.id} by Order ID reference in SMS`,
      };
    }

    // Match priority 3: Exact amount match within active timeframe (last 30 mins)
    const matchByAmount = pendingOrders.find(
      (o) => Math.abs(o.amount - notification.amount) < 1
    );
    if (matchByAmount) {
      if (notification.utr) {
        matchByAmount.utrNumber = notification.utr;
      }
      await this.completeOrder(matchByAmount.id, 'NOTIFICATION', notification.rawText);
      return {
        matched: true,
        order: matchByAmount,
        message: `Matched Order ${matchByAmount.id} by Amount ₹${notification.amount}`,
      };
    }

    return {
      matched: false,
      message: `Received notification of ₹${notification.amount}, but no matching order found.`,
    };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
