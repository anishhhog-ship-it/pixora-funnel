import jsQR from 'jsqr';

export interface DecodedUpiData {
  raw: string;
  isUpi: boolean;
  upiId?: string;
  payeeName?: string;
  amount?: number;
  currency?: string;
  transactionNote?: string;
}

/**
 * Parses a standard Indian UPI URI (upi://pay?pa=...&pn=...)
 */
export function parseUpiUri(uri: string): DecodedUpiData {
  if (!uri || !uri.toLowerCase().startsWith('upi://pay')) {
    // Might be a raw UPI ID (e.g. name@okhdfcbank or 9257378047@ybl)
    const isRawUpi = /^[\w.\-_]+@[\w.\-_]+$/.test(uri.trim());
    return {
      raw: uri,
      isUpi: isRawUpi,
      upiId: isRawUpi ? uri.trim() : undefined,
    };
  }

  try {
    const url = new URL(uri.replace(/^upi:\/\/pay\?/i, 'https://upi.dummy/?'));
    const params = url.searchParams;

    const upiId = params.get('pa') || undefined;
    const payeeName = params.get('pn') ? decodeURIComponent(params.get('pn')!) : undefined;
    const amountStr = params.get('am');
    const amount = amountStr ? parseFloat(amountStr) : undefined;
    const currency = params.get('cu') || 'INR';
    const transactionNote = params.get('tn') ? decodeURIComponent(params.get('tn')!) : undefined;

    return {
      raw: uri,
      isUpi: !!upiId,
      upiId,
      payeeName,
      amount: isNaN(amount as number) ? undefined : amount,
      currency,
      transactionNote,
    };
  } catch {
    // Fallback regex parsing
    const paMatch = uri.match(/[?&]pa=([^&]+)/i);
    const pnMatch = uri.match(/[?&]pn=([^&]+)/i);
    const amMatch = uri.match(/[?&]am=([^&]+)/i);

    return {
      raw: uri,
      isUpi: !!paMatch,
      upiId: paMatch ? decodeURIComponent(paMatch[1]) : undefined,
      payeeName: pnMatch ? decodeURIComponent(pnMatch[1]) : undefined,
      amount: amMatch ? parseFloat(amMatch[1]) : undefined,
    };
  }
}

/**
 * Decodes a QR code from an image File or HTMLImageElement or ImageData in the browser
 */
export async function decodeQrFromImageFile(file: File): Promise<DecodedUpiData | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            resolve(parseUpiUri(code.data));
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for QR decoding'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Constructs a dynamic UPI URI given receiver details and order information
 */
export function constructUpiUri({
  upiId,
  payeeName,
  amount,
  orderId,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  orderId: string;
  note?: string;
}): string {
  const cleanUpi = (upiId || '').trim();
  const cleanName = (payeeName || 'Pixora Automations').trim();
  const cleanAmount = amount.toFixed(2);
  const cleanNote = (note || `Pixora Plan ${orderId}`).trim();

  const params = new URLSearchParams();
  params.set('pa', cleanUpi);
  params.set('pn', cleanName);
  params.set('am', cleanAmount);
  params.set('cu', 'INR');
  params.set('tn', cleanNote);
  params.set('tr', orderId);

  return `upi://pay?${params.toString()}`;
}
