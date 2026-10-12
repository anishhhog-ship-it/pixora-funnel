export interface HardwareProduct {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  formattedPrice: string;
  formattedOriginalPrice: string;
  badge: string;
  badgeColor: string;
  description: string;
  longDescription: string;
  image: string;
  highlights: string[];
  specs: {
    material: string;
    dimensions: string;
    nfcSupport: string;
    durability: string;
    setup: string;
  };
  recommendedFor: string;
}

export const HARDWARE_PRODUCTS: HardwareProduct[] = [
  {
    id: 'nfc-tap-card',
    name: 'NFC Smart Tap Card',
    tagline: 'Staff pocket tap card for direct customer review collection',
    price: 499,
    originalPrice: 899,
    formattedPrice: '₹499',
    formattedOriginalPrice: '₹899',
    badge: 'Popular',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    description: 'Pocket acrylic or metal tap card for staff to present directly to customers.',
    longDescription: 'Sleek, high-durability contactless card with embedded NTAG213/215 chip and laser-printed gold QR code. Ideal for waitstaff, billing cashiers, salon stylists, and mobile service professionals to collect 5-star reviews on the go.',
    image: '/products/nfc-tap-card.jpg',
    highlights: [
      'Instant 1-tap review opening on any modern smartphone',
      'Matte scratch-resistant finish with gold metallic trim',
      'Zero battery or charging required · Lifespan 10+ years',
      'Dual mode: NFC tap on top + backup high-contrast QR code',
    ],
    specs: {
      material: 'Reinforced Matte PVC & Metallic Accent',
      dimensions: '85.6 mm × 54 mm (Standard Card Size)',
      nfcSupport: 'Universal iOS & Android Compatible (NTAG215)',
      durability: '100% Waterproof, Scratch-Resistant',
      setup: 'Pre-programmed to your Pixora live review funnel',
    },
    recommendedFor: 'Waitstaff, Salon Stylists, Cash Counters & Field Reps',
  },
  {
    id: 'acrylic-table-stand',
    name: 'Premium Acrylic Table Stand',
    tagline: 'High-contrast QR tabletop stand for café and dining tables',
    price: 799,
    originalPrice: 1299,
    formattedPrice: '₹799',
    formattedOriginalPrice: '₹1,299',
    badge: 'Durable',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    description: 'Durable clear acrylic stand with high-contrast printed QR code for dining tables.',
    longDescription: 'Heavy-duty crystal-clear acrylic vertical display stand. Features prominent 5-star Google review graphics, your custom brand logo, and an ultra-sharp scan QR code that triggers customer reviews before the bill is paid.',
    image: '/products/acrylic-table-stand.jpg',
    highlights: [
      'Crystal-clear 4mm cast acrylic with rounded bevel safety edges',
      'UV-resistant direct print that never fades, peels, or yellows',
      'Dual-angle visibility for guests sitting around the dining table',
      'Wipe-clean surface resistant to oil, coffee spills, and sanitizer',
    ],
    specs: {
      material: '4mm Optical-Grade Cast Acrylic',
      dimensions: 'A6 Vertical (105 mm × 148 mm)',
      nfcSupport: 'Visual High-Contrast QR Code',
      durability: 'Shatter-Resistant, Spill-Proof & Wipeable',
      setup: 'Direct tabletop placement with non-slip weighted base',
    },
    recommendedFor: 'Cafés, Dining Tables, Reception Counters & Clinics',
  },
  {
    id: 'nfc-stand-combo',
    name: 'NFC + Stand Combo Pack',
    tagline: 'Dual-action acrylic stand with integrated metal NFC badge and QR',
    price: 1199,
    originalPrice: 1899,
    formattedPrice: '₹1,199',
    formattedOriginalPrice: '₹1,899',
    badge: 'Best Value',
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    description: 'Acrylic tabletop stand with integrated dual-sided NFC chip and QR code.',
    longDescription: 'The ultimate physical review magnet. Combines an embedded metallic NFC tap zone at the top for iPhone and Android users with a high-contrast printed QR code below. Ensures 100% of customers can review regardless of device age.',
    image: '/products/nfc-stand-combo.jpg',
    highlights: [
      'Integrated metallic NFC tap coin on top + high-density QR below',
      'Dual action: Tap for fast reviews or scan with any camera',
      'Premium weighted acrylic frame for luxury tabletops',
      'Delivered pre-linked to your Google Business review funnel',
    ],
    specs: {
      material: '5mm Beveled Crystal Acrylic + Brushed Metal NFC Coin',
      dimensions: '110 mm × 170 mm Vertical Display',
      nfcSupport: 'Integrated High-Range NTAG216 Chip',
      durability: 'Industrial Grade Waterproof & Spill-Proof',
      setup: 'Ready to place · Zero configuration needed',
    },
    recommendedFor: 'Fine Dining, Luxury Spas, Boutique Hotels & High-End Retail',
  },
  {
    id: 'multi-table-pack',
    name: 'Multi-Table Pack (10 Stands)',
    tagline: 'Complete 10-stand turnkey kit for larger dining areas and hotels',
    price: 3499,
    originalPrice: 5999,
    formattedPrice: '₹3,499',
    formattedOriginalPrice: '₹5,999',
    badge: 'Pro Kit',
    badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
    description: 'Complete kit for larger restaurants and multi-floor outlets with unique table URLs.',
    longDescription: 'Equip your entire establishment in one package. Includes 10 custom-manufactured acrylic QR review stands with options for unique table numbering (Table 1 to 10) and branded gift packaging box. Maximizes review volume across all seats.',
    image: '/products/multi-table-pack.jpg',
    highlights: [
      'Set of 10 matching premium acrylic stands in protective box',
      'Supports unique table number tagging (Table 01 to 10)',
      'Bulk discount saving ₹2,500 over individual units',
      'Free express courier shipping anywhere in India',
    ],
    specs: {
      material: '10× Cast Acrylic Stands + Branded Storage Box',
      dimensions: '10 Units of A6 Tabletop Displays',
      nfcSupport: 'QR Matrix (NFC upgrade available on request)',
      durability: 'Commercial Hospitality Standard',
      setup: 'Individually labeled per table for instant deployment',
    },
    recommendedFor: 'Multi-Room Restaurants, Food Courts, Resorts & Chains',
  },
];

export interface OrderDetails {
  product: HardwareProduct;
  quantity: number;
  fullName: string;
  phone: string;
  businessName: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  customizationNotes?: string;
}

export const PIXORA_WHATSAPP_NUMBER = '9257378047';

export function buildWhatsAppOrderUrl(order: OrderDetails): string {
  const totalAmount = order.product.price * order.quantity;
  const formattedTotal = `₹${totalAmount.toLocaleString('en-IN')}`;

  const message = `🛍️ *NEW PIXORA HARDWARE ORDER*

📦 *Product:* ${order.product.name}
🔢 *Quantity:* ${order.quantity} unit${order.quantity > 1 ? 's' : ''}
💰 *Total Amount:* ${formattedTotal} (${order.product.formattedPrice} each)

----------------------------------------
👤 *Customer Name:* ${order.fullName.trim()}
📱 *Phone / WhatsApp:* ${order.phone.trim()}
🏢 *Business Name:* ${order.businessName.trim()}
📍 *Delivery Address:* 
${order.address.trim()}
${order.city.trim()}, ${order.state.trim()} - ${order.pincode.trim()}

📝 *Customization / Notes:* ${order.customizationNotes?.trim() || 'Standard Branded Print'}
----------------------------------------
_Order submitted via Pixora Funnel Store (funnel.pixoraautomations.com)_`;

  return `https://wa.me/91${PIXORA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
