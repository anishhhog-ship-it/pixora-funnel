import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export interface UpiAccount {
  id: string;
  upiId: string;
  payeeName: string;
  label: string;
  isActive: boolean;
  isPrimary: boolean;
  qrImageUrl?: string;
  dailyLimitInr?: number;
  createdAt: string;
  updatedAt: string;
}

declare global {
  var __pixoraPaymentConfig: any | undefined;
  var __pixoraUpiAccounts: UpiAccount[] | undefined;
}

function initializeMemoryStore() {
  if (!global.__pixoraPaymentConfig) {
    global.__pixoraPaymentConfig = {
      upiId: '9257378047@ybl',
      payeeName: 'Pixora Automations',
      qrImageUrl: '',
      autoActivateOnNotification: true,
      webhookSecret: 'pixora_live_sec_92573',
      updatedAt: new Date().toISOString(),
    };
  }

  if (!global.__pixoraUpiAccounts || global.__pixoraUpiAccounts.length === 0) {
    global.__pixoraUpiAccounts = [
      {
        id: 'upi_primary_default',
        upiId: '9257378047@ybl',
        payeeName: 'Pixora Automations',
        label: 'Primary PhonePe / YBL',
        isActive: true,
        isPrimary: true,
        qrImageUrl: '',
        dailyLimitInr: 100000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'upi_backup_icici',
        upiId: 'pixora@icici',
        payeeName: 'Pixora Automations Pvt Ltd',
        label: 'ICICI Corporate VPA',
        isActive: true,
        isPrimary: false,
        qrImageUrl: '',
        dailyLimitInr: 200000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'upi_backup_paytm',
        upiId: '9257378047@paytm',
        payeeName: 'Pixora Automations',
        label: 'Paytm Merchant VPA',
        isActive: false,
        isPrimary: false,
        qrImageUrl: '',
        dailyLimitInr: 50000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

// Sync global.__pixoraPaymentConfig with the current primary UPI account
function syncPrimaryConfig() {
  initializeMemoryStore();
  const primary = global.__pixoraUpiAccounts!.find(a => a.isPrimary && a.isActive) ||
                  global.__pixoraUpiAccounts!.find(a => a.isPrimary) ||
                  global.__pixoraUpiAccounts!.find(a => a.isActive);

  if (primary) {
    global.__pixoraPaymentConfig.upiId = primary.upiId;
    global.__pixoraPaymentConfig.payeeName = primary.payeeName;
    if (primary.qrImageUrl) {
      global.__pixoraPaymentConfig.qrImageUrl = primary.qrImageUrl;
    }
  }
}

export async function GET() {
  initializeMemoryStore();

  // Best-effort check with Supabase platform_upi_accounts table
  try {
    const supabase = getSupabaseAdminClient();
    const { data: dbAccounts } = await (supabase as any)
      .from('platform_upi_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (dbAccounts && dbAccounts.length > 0) {
      global.__pixoraUpiAccounts = dbAccounts.map((a: any) => ({
        id: a.id,
        upiId: a.upi_id,
        payeeName: a.payee_name || 'Pixora Automations',
        label: a.label || 'UPI VPA',
        isActive: a.is_active ?? true,
        isPrimary: a.is_primary ?? false,
        qrImageUrl: a.qr_image_url || '',
        dailyLimitInr: Number(a.daily_limit_inr) || 100000,
        createdAt: a.created_at || new Date().toISOString(),
        updatedAt: a.updated_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    // Graceful fallback to memory store
  }

  syncPrimaryConfig();

  return NextResponse.json({
    success: true,
    config: global.__pixoraPaymentConfig,
    accounts: global.__pixoraUpiAccounts,
  });
}

export async function POST(req: NextRequest) {
  initializeMemoryStore();

  try {
    const body = await req.json();
    const { action } = body;
    const now = new Date().toISOString();
    const supabase = getSupabaseAdminClient();

    // ── ACTION 1: Switch active / primary UPI ID ──
    if (action === 'switch') {
      const { id, upiId } = body;
      const target = global.__pixoraUpiAccounts!.find(a => a.id === id || a.upiId === upiId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Target UPI account not found' }, { status: 404 });
      }

      // Mark target as primary and ensure it is active
      target.isPrimary = true;
      target.isActive = true;
      target.updatedAt = now;

      // Mark all others as non-primary
      global.__pixoraUpiAccounts!.forEach(a => {
        if (a.id !== target.id) {
          a.isPrimary = false;
          a.updatedAt = now;
        }
      });

      // Update in Supabase if table exists
      try {
        await (supabase as any).from('platform_upi_accounts').update({ is_primary: false, updated_at: now }).neq('id', target.id);
        await (supabase as any).from('platform_upi_accounts').update({ is_primary: true, is_active: true, updated_at: now }).eq('id', target.id);
      } catch (e) {}

      syncPrimaryConfig();

      return NextResponse.json({
        success: true,
        message: `Switched active UPI Gateway ID to ${target.upiId} (${target.label})`,
        switchedAccount: target,
        config: global.__pixoraPaymentConfig,
        accounts: global.__pixoraUpiAccounts,
      });
    }

    // ── ACTION 2: Toggle Active / Disable ──
    if (action === 'toggle_active') {
      const { id } = body;
      const target = global.__pixoraUpiAccounts!.find(a => a.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Target UPI account not found' }, { status: 404 });
      }

      // If disabling the current primary, switch primary to another active account if one exists
      if (target.isPrimary && target.isActive) {
        const nextActive = global.__pixoraUpiAccounts!.find(a => a.id !== target.id && a.isActive);
        if (nextActive) {
          nextActive.isPrimary = true;
          target.isPrimary = false;
        }
      }

      target.isActive = !target.isActive;
      target.updatedAt = now;

      try {
        await (supabase as any).from('platform_upi_accounts').update({
          is_active: target.isActive,
          is_primary: target.isPrimary,
          updated_at: now,
        }).eq('id', target.id);
      } catch (e) {}

      syncPrimaryConfig();

      return NextResponse.json({
        success: true,
        message: `UPI ID ${target.upiId} is now ${target.isActive ? 'Active' : 'Disabled'}`,
        account: target,
        config: global.__pixoraPaymentConfig,
        accounts: global.__pixoraUpiAccounts,
      });
    }

    // ── ACTION 3: Add new UPI ID ──
    if (action === 'add') {
      const { upiId, payeeName, label, qrImageUrl, setPrimary = false, dailyLimitInr = 100000 } = body;

      if (!upiId || !upiId.includes('@')) {
        return NextResponse.json({ success: false, error: 'Please enter a valid UPI VPA address (e.g. name@bank)' }, { status: 400 });
      }

      const cleanUpi = upiId.trim().toLowerCase();
      const existing = global.__pixoraUpiAccounts!.find(a => a.upiId.toLowerCase() === cleanUpi);
      if (existing) {
        return NextResponse.json({ success: false, error: 'This UPI ID already exists in your managed accounts list' }, { status: 409 });
      }

      const newId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const shouldBePrimary = Boolean(setPrimary) || global.__pixoraUpiAccounts!.length === 0;

      if (shouldBePrimary) {
        global.__pixoraUpiAccounts!.forEach(a => {
          a.isPrimary = false;
        });
      }

      const newAccount: UpiAccount = {
        id: newId,
        upiId: cleanUpi,
        payeeName: (payeeName || 'Pixora Automations').trim(),
        label: (label || 'UPI VPA').trim(),
        isActive: true,
        isPrimary: shouldBePrimary,
        qrImageUrl: qrImageUrl || '',
        dailyLimitInr: Number(dailyLimitInr) || 100000,
        createdAt: now,
        updatedAt: now,
      };

      global.__pixoraUpiAccounts!.push(newAccount);

      try {
        await (supabase as any).from('platform_upi_accounts').insert({
          id: newId,
          upi_id: newAccount.upiId,
          payee_name: newAccount.payeeName,
          label: newAccount.label,
          is_active: newAccount.isActive,
          is_primary: newAccount.isPrimary,
          qr_image_url: newAccount.qrImageUrl,
          daily_limit_inr: newAccount.dailyLimitInr,
          created_at: now,
          updated_at: now,
        });
      } catch (e) {}

      syncPrimaryConfig();

      return NextResponse.json({
        success: true,
        message: `Added new UPI ID ${newAccount.upiId}`,
        account: newAccount,
        config: global.__pixoraPaymentConfig,
        accounts: global.__pixoraUpiAccounts,
      });
    }

    // ── ACTION 4: Delete UPI ID ──
    if (action === 'delete') {
      const { id } = body;
      const index = global.__pixoraUpiAccounts!.findIndex(a => a.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'UPI account not found' }, { status: 404 });
      }

      const wasPrimary = global.__pixoraUpiAccounts![index].isPrimary;
      global.__pixoraUpiAccounts!.splice(index, 1);

      // If deleted account was primary, set the first active account as primary
      if (wasPrimary && global.__pixoraUpiAccounts!.length > 0) {
        const nextActive = global.__pixoraUpiAccounts!.find(a => a.isActive) || global.__pixoraUpiAccounts![0];
        nextActive.isPrimary = true;
      }

      try {
        await (supabase as any).from('platform_upi_accounts').delete().eq('id', id);
      } catch (e) {}

      syncPrimaryConfig();

      return NextResponse.json({
        success: true,
        message: 'UPI account removed successfully',
        config: global.__pixoraPaymentConfig,
        accounts: global.__pixoraUpiAccounts,
      });
    }

    // ── FALLBACK / LEGACY: Update overall gateway config ──
    const { upiId, payeeName, qrImageUrl, autoActivateOnNotification, webhookSecret } = body;
    global.__pixoraPaymentConfig = {
      ...global.__pixoraPaymentConfig,
      upiId: upiId || global.__pixoraPaymentConfig?.upiId || '9257378047@ybl',
      payeeName: payeeName || global.__pixoraPaymentConfig?.payeeName || 'Pixora Automations',
      qrImageUrl: qrImageUrl !== undefined ? qrImageUrl : global.__pixoraPaymentConfig?.qrImageUrl,
      autoActivateOnNotification:
        autoActivateOnNotification !== undefined
          ? autoActivateOnNotification
          : global.__pixoraPaymentConfig?.autoActivateOnNotification ?? true,
      webhookSecret: webhookSecret || global.__pixoraPaymentConfig?.webhookSecret || 'pixora_live_sec_92573',
      updatedAt: now,
    };

    // Update primary account upiId if changed
    const primary = global.__pixoraUpiAccounts!.find(a => a.isPrimary);
    if (primary && upiId) {
      primary.upiId = upiId;
      primary.payeeName = payeeName || primary.payeeName;
      primary.updatedAt = now;
    }

    return NextResponse.json({
      success: true,
      message: 'Payment Gateway settings updated successfully.',
      config: global.__pixoraPaymentConfig,
      accounts: global.__pixoraUpiAccounts,
    });
  } catch (error: any) {
    console.error('api/payments/config error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
