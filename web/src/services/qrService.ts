/**
 * QR Code service for Pixora Funnel
 * Encodes funnel destination URLs, manages QR download/print and formatting
 */

export interface QRConfig {
  slug: string;
  businessName?: string;
  primaryColor?: string;
  size?: number;
}

export const qrService = {
  /**
   * Returns the canonical funnel URL for a given business slug
   */
  getFunnelUrl: (slug: string): string => {
    const cleanSlug = (slug || '').trim().toLowerCase();
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/f/${cleanSlug}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
    return `${baseUrl}/f/${cleanSlug}`;
  },

  /**
   * Generates QR payload details
   */
  generateQR: (slug: string, options?: Partial<QRConfig>) => {
    const url = qrService.getFunnelUrl(slug);
    return {
      slug,
      url,
      primaryColor: options?.primaryColor || '#0B3D2E',
      size: options?.size || 240,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Trigger direct PNG download of rendered QR canvas
   */
  downloadQR: (elementId: string, filename: string = 'pixora-funnel-qr.png') => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;
    if (!canvas) {
      console.warn(`QR canvas element #${elementId} not found.`);
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Print QR standee card
   */
  printQR: (elementId: string, businessName: string = 'Your Business') => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;
    if (!canvas) {
      window.print();
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${businessName} - QR Standee</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
              color: #111;
            }
            .card {
              border: 2px solid #e5e7eb;
              border-radius: 24px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
              max-width: 360px;
            }
            h1 { font-size: 22px; margin: 0 0 8px; font-weight: 700; }
            p { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
            img { width: 220px; height: 220px; border-radius: 12px; }
            .badge {
              margin-top: 20px;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.05em;
              color: #4b5563;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${businessName}</h1>
            <p>Scan to rate your experience & view details</p>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="badge">Powered by Pixora Funnel</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
