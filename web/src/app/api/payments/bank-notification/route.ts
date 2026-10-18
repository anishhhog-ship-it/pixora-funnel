import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

interface NotificationPayload {
  title?: string;
  message?: string;
  body?: string;
  text?: string;
  sender?: string;
  packageName?: string;
  amount?: number;
  utr?: string;
  secret?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const payload: NotificationPayload = rawBody;

    const text = payload.message || payload.body || payload.text || payload.title || '';
    const sender = payload.sender || payload.packageName || 'PhonePe / Bank SMS';

    if (!text && !payload.amount) {
      return NextResponse.json(
        { success: false, error: 'No notification text or amount provided.' },
        { status: 400 }
      );
    }

    // 1. Amount Extraction
    let amount = payload.amount;
    if (!amount) {
      const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
      const amountMatch = text.match(amountRegex);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      } else {
        const altMatch = text.match(/(?:received|credited|added)\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
        if (altMatch) {
          amount = parseFloat(altMatch[1].replace(/,/g, ''));
        }
      }
    }

    // 2. 12-digit UTR Extraction
    let utr = payload.utr;
    if (!utr) {
      const utrRegex = /(?:upi(?:\s*ref)?(?:\s*no)?|ref(?:\s*no)?|utr(?:\s*no)?|txn(?:\s*id)?|reference)\s*[:\-\/]?\s*(\d{10,16})/i;
      const utrMatch = text.match(utrRegex);
      if (utrMatch) {
        utr = utrMatch[1];
      } else {
        const generalUtrMatch = text.match(/\b(\d{12})\b/);
        if (generalUtrMatch) {
          utr = generalUtrMatch[1];
        }
      }
    }

    // 3. Log notification in Supabase audit / logs if available
    const supabase = getSupabaseAdminClient();
    let matchedBusiness: any = null;

    if (supabase) {
      try {
        // Query recent trial / pending businesses waiting for payment
        const { data: businesses } = await (supabase as any)
          .from('businesses')
          .select('id, name, slug, status, owner_id')
          .order('created_at', { ascending: false })
          .limit(20);

        // If there's an active order or recent business, activate the most relevant business
        if (businesses && businesses.length > 0) {
          // Find trial business
          const pendingBiz = businesses.find((b: any) => b.status === 'trial' || b.status !== 'active') || businesses[0];
          if (pendingBiz) {
            matchedBusiness = pendingBiz;
            // Activate in Supabase
            await (supabase as any)
              .from('businesses')
               .update({ status: 'active', plan_status: 'active', trial_expires_at: null })
              .eq('id', pendingBiz.id);

            await (supabase as any)
              .from('trials')
              .update({ status: 'cancelled' })
              .eq('business_id', pendingBiz.id)
              .eq('status', 'active');
          }
        }

        // Store notification record in admin_audit_logs or orders
        await (supabase as any).from('admin_audit_logs').insert({
          action: 'PAYMENT_NOTIFICATION_RECEIVED',
          entity_type: 'PAYMENT',
          metadata: {
            text,
            amount,
            utr,
            sender,
            matchedBusinessId: matchedBusiness?.id,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => null);
      } catch (dbErr) {
        console.warn('Database notification sync error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: '✓ Bank notification processed successfully.',
      parsed: {
        amount,
        utr,
        sender,
        text,
        matchedBusiness: matchedBusiness ? { id: matchedBusiness.id, name: matchedBusiness.name } : null,
      },
    });
  } catch (error: any) {
    console.error('Bank notification webhook error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/payments/bank-notification',
    supportedApps: ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'HDFC', 'SBI', 'ICICI', 'Axis', 'MacroDroid'],
    format: {
      message: 'Received ₹2,599 from Rajesh (UPI Ref: 429381920391)',
      sender: 'com.phonepe.app',
    },
  });
}
