'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CreditCard } from 'lucide-react';
import PaymentGatewayModal from '@/components/payment/PaymentGatewayModal';

interface UnlockFunnelClientProps {
  businessId?: string;
  businessName?: string;
}

export default function UnlockFunnelClient({ businessId, businessName }: UnlockFunnelClientProps) {
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayPlan, setGatewayPlan] = useState({
    planId: 'lifetime_software',
    planName: 'Lifetime Software',
    amount: 2599,
  });

  return (
    <>
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setGatewayPlan({
               planId: 'lifetime_software_nfc',
               planName: 'Lifetime Software + NFC doorstep delivery',
              amount: 2999,
            });
            setShowGatewayModal(true);
          }}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Unlock Lifetime + NFC Online (₹2,999)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setGatewayPlan({
               planId: 'lifetime_software',
               planName: 'Lifetime Software',
              amount: 2599,
            });
            setShowGatewayModal(true);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
           <span>Unlock Lifetime Software Online (₹2,599)</span>
        </button>
      </div>

      <PaymentGatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        planId={gatewayPlan.planId}
        planName={gatewayPlan.planName}
        amount={gatewayPlan.amount}
        businessId={businessId}
        businessName={businessName}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
