import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  if (!global.__pixoraPaymentConfig) {
    global.__pixoraPaymentConfig = {
      upiId: '9257378047@ybl',
      payeeName: 'Pixora Automations',
      qrImageUrl: '',
      autoActivateOnNotification: true,
      webhookSecret: 'pixora_live_sec_92573',
    };
  }

  return NextResponse.json({
    success: true,
    config: global.__pixoraPaymentConfig,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Payment Gateway settings updated successfully.',
      config: global.__pixoraPaymentConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
