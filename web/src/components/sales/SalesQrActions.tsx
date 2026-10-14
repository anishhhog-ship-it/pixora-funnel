'use client';

import { useRef, useState } from 'react';
import { Download, Link2, Share2, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { getPublicFunnelUrl, isWebNfcAvailable, writeFunnelToNfc } from '@/lib/salesClient';

export default function SalesQrActions({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [nfcState, setNfcState] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState('');
  const url = getPublicFunnelUrl(slug);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.download = `${slug}-funnel-qr.png`;
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
  };

  const shareUrl = async () => {
    if (navigator.share) await navigator.share({ title: 'Customer funnel', url });
    else await copyUrl();
  };

  const writeNfc = async () => {
    setNfcState('writing');
    setNfcMessage('Hold an unlocked NFC tag near this device.');
    try {
      await writeFunnelToNfc(url);
      setNfcState('success');
      setNfcMessage('URL written. Tap or scan the tag with a separate phone to test it.');
    } catch (error) {
      setNfcState('error');
      setNfcMessage(error instanceof Error ? error.message : 'NFC writing failed.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto flex w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <QRCodeCanvas ref={canvasRef} value={url} size={compact ? 156 : 208} level="H" includeMargin />
      </div>
      <p className="break-all rounded-xl bg-slate-50 px-3 py-2 text-center font-mono text-[11px] text-slate-600">{url}</p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={downloadQr} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"><Download className="h-4 w-4" /> Download QR</button>
        <button type="button" onClick={shareUrl} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Share2 className="h-4 w-4" /> Share</button>
        <button type="button" onClick={copyUrl} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Link2 className="h-4 w-4" /> {copied ? 'Copied' : 'Copy URL'}</button>
        {isWebNfcAvailable() ? <button type="button" onClick={writeNfc} disabled={nfcState === 'writing'} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"><Smartphone className="h-4 w-4" /> {nfcState === 'writing' ? 'Writing tag…' : 'Write NFC tag'}</button> : null}
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">This QR opens the web funnel URL. It is not a UPI payment QR. For NFC, writing is confirmed only when the browser write resolves; test the tag separately on another phone. {isWebNfcAvailable() ? 'Web NFC is available on this secure Android browser.' : 'On iOS or unsupported browsers, copy the URL and use NFC Tools.'}</p>
      {nfcState === 'success' && <p className="flex items-start gap-1.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{nfcMessage}</p>}
      {nfcState === 'error' && <p className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{nfcMessage}</p>}
    </div>
  );
}
