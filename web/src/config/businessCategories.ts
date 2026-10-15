/**
 * PIXORA FUNNEL - Centralized Category & Visual Theming Engine
 * 
 * Automatically detects, normalizes, and assigns high-fidelity visual themes,
 * background images, dynamic overlays, CTAs, and feature configurations for businesses.
 */

export type OverlayType = 'dark' | 'light' | 'gradient' | 'blur' | 'ambient';
export type FontStyle = 'elegant' | 'modern' | 'minimal' | 'bold';
export type CategoryConfidence = 'high' | 'medium' | 'low';

export interface CategoryOverlayConfig {
  type: OverlayType;
  opacity: number;
  gradient?: string;
  blurPx?: number;
}

export interface CategoryImageOption {
  id: string;
  url: string;
  mobileUrl?: string;
  label: string;
  title?: string;
  qualityScore: number; // 1-10
  isDefault: boolean;
}

export interface BusinessCategoryConfig {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  theme: string;
  backgroundImage: string;
  mobileBackgroundImage: string;
  imageOptions: CategoryImageOption[];
  overlay: CategoryOverlayConfig;
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  defaultAccentColor?: string;
  defaultFontStyle: FontStyle;
  menuEnabled: boolean;
  servicesEnabled: boolean;
  productsEnabled: boolean;
  suggestedCTA: string;
  postCompletionCTA: string;
  headline: string;
  subheadline: string;
  footerFeatures: { label: string; icon: string }[];
  icon: string;
}

/**
 * The uploaded restaurant background image is the ultimate system fallback.
 * Guaranteed never to be broken or empty.
 */
export const DEFAULT_FUNNEL_BACKGROUND = '/default-funnel-bg.jpg';
export const DEFAULT_FUNNEL_MOBILE_BACKGROUND = '/default-funnel-bg.jpg';

/**
 * 25 Comprehensive Visual Categories
 */
export const BUSINESS_CATEGORIES: Record<string, BusinessCategoryConfig> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Fine Dining',
    aliases: [
      'restaurant', 'dining', 'fine dining', 'family restaurant', 'vegetarian restaurant',
      'pure veg', 'dhaba', 'bistro', 'eatery', 'food court', 'thali', 'indian restaurant',
      'chinese restaurant', 'italian restaurant', 'pizzeria', 'bar & restaurant', 'buffet',
      'meal_takeaway', 'meal_delivery', 'food'
    ],
    description: 'Fine dining, multi-cuisine, family eateries & casual restaurants',
    theme: 'Warm & Premium',
    backgroundImage: '/default-funnel-bg.jpg',
    mobileBackgroundImage: '/default-funnel-bg.jpg',
    imageOptions: [
      { id: 'rest_01', url: '/default-funnel-bg.jpg', mobileUrl: '/default-funnel-bg.jpg', label: 'Warm Fine Dining', qualityScore: 10, isDefault: true },
      { id: 'rest_02', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&h=1920&fit=crop&q=80', label: 'Boutique Candlelight', qualityScore: 9, isDefault: false },
      { id: 'rest_03', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&h=1920&fit=crop&q=80', label: 'Atmospheric Dining', qualityScore: 9, isDefault: false },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(11,61,46,0.35) 0%, rgba(5,20,15,0.75) 100%)',
      blurPx: 0,
    },
    defaultPrimaryColor: '#0B3D2E',
    defaultSecondaryColor: '#D4AF37',
    defaultAccentColor: '#FAF7F2',
    defaultFontStyle: 'elegant',
    menuEnabled: true,
    servicesEnabled: false,
    productsEnabled: false,
    suggestedCTA: 'Share Your Experience',
    postCompletionCTA: 'View Our Menu',
    headline: 'How was your dining experience with us?',
    subheadline: 'Your feedback means the world to our chefs & staff. Help others discover our flavours!',
    footerFeatures: [
      { label: 'Authentic Taste', icon: 'Utensils' },
      { label: 'Warm Ambience', icon: 'Heart' },
      { label: 'Attentive Service', icon: 'Sparkles' },
    ],
    icon: 'Utensils',
  },

  cafe: {
    id: 'cafe',
    name: 'Café & Coffee Roastery',
    aliases: [
      'cafe', 'café', 'coffee shop', 'coffee house', 'roastery', 'espresso bar',
      'tea house', 'boba', 'chai', 'chai point', 'coffee'
    ],
    description: 'Artisanal coffee shops, specialty roasters, dessert bistros & tea salons',
    theme: 'Modern, Cozy & Social',
    backgroundImage: '/categories/cafe.webp',
    mobileBackgroundImage: '/categories/cafe-mobile.webp',
    imageOptions: [
      { id: 'cafe_01', url: '/categories/cafe.webp', mobileUrl: '/categories/cafe-mobile.webp', label: 'Natural Light Espresso Bar', qualityScore: 10, isDefault: true },
      { id: 'cafe_02', url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1080&h=1920&fit=crop&q=80', label: 'Artisan Barista Lounge', qualityScore: 9, isDefault: false },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.60,
      gradient: 'linear-gradient(180deg, rgba(61,35,20,0.3) 0%, rgba(25,14,8,0.78) 100%)',
    },
    defaultPrimaryColor: '#3D2314',
    defaultSecondaryColor: '#D4AF37',
    defaultAccentColor: '#FDFBF7',
    defaultFontStyle: 'modern',
    menuEnabled: true,
    servicesEnabled: false,
    productsEnabled: false,
    suggestedCTA: 'Rate Your Visit',
    postCompletionCTA: 'View Our Coffee & Menu',
    headline: 'How was your coffee & visit today?',
    subheadline: 'Loved your brew? Tell other coffee enthusiasts about your time here!',
    footerFeatures: [
      { label: 'Single-Origin Coffee', icon: 'Coffee' },
      { label: 'Fresh Bakes', icon: 'Sparkles' },
      { label: 'Cozy Atmosphere', icon: 'Heart' },
    ],
    icon: 'Coffee',
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel, Resort & Hospitality',
    aliases: [
      'hotel', 'resort', 'motel', 'stay', 'homestay', 'villa', 'guest house',
      'lodging', 'boutique hotel', 'palace hotel', 'inn', 'bed and breakfast'
    ],
    description: 'Boutique stays, heritage havelis, luxury resorts & business hotels',
    theme: 'Aspirational & Serene Luxury',
    backgroundImage: '/categories/hotel.webp',
    mobileBackgroundImage: '/categories/hotel-mobile.webp',
    imageOptions: [
      { id: 'hotel_01', url: '/categories/hotel.webp', mobileUrl: '/categories/hotel-mobile.webp', label: 'Grand Resort Suite', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(20,30,45,0.35) 0%, rgba(10,15,25,0.8) 100%)',
    },
    defaultPrimaryColor: '#1A2942',
    defaultSecondaryColor: '#E2C992',
    defaultFontStyle: 'elegant',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Stay Experience',
    postCompletionCTA: 'Explore Hotel Amenities',
    headline: 'How was your stay with us?',
    subheadline: 'We strive to make every moment memorable. Share your thoughts on your stay!',
    footerFeatures: [
      { label: '5-Star Comfort', icon: 'Bed' },
      { label: 'Exquisite Views', icon: 'Sparkles' },
      { label: 'Impeccable Hospitality', icon: 'Heart' },
    ],
    icon: 'Hotel',
  },

  salon: {
    id: 'salon',
    name: 'Hair Salon, Spa & Grooming',
    aliases: [
      'salon', 'hair salon', 'beauty salon', 'spa', 'barber', 'barbershop',
      'haircut', 'styling', 'makeover', 'parlour', 'beauty parlour', 'nail salon', 'lashes'
    ],
    description: 'Luxury styling studios, barber shops, nail lounges & wellness spas',
    theme: 'Modern Beauty & Indulgence',
    backgroundImage: '/categories/salon.webp',
    mobileBackgroundImage: '/categories/salon-mobile.webp',
    imageOptions: [
      { id: 'salon_01', url: '/categories/salon.webp', mobileUrl: '/categories/salon-mobile.webp', label: 'Contemporary Salon Interior', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.62,
      gradient: 'linear-gradient(180deg, rgba(30,27,24,0.35) 0%, rgba(12,11,10,0.8) 100%)',
    },
    defaultPrimaryColor: '#1E1B18',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Styling Experience',
    postCompletionCTA: 'Explore Salon Services',
    headline: 'How do you love your new look?',
    subheadline: 'Your transformation inspires us. Help others discover our master stylists!',
    footerFeatures: [
      { label: 'Expert Stylists', icon: 'Scissors' },
      { label: 'Premium Products', icon: 'Sparkles' },
      { label: 'Relaxing Ambience', icon: 'Heart' },
    ],
    icon: 'Scissors',
  },

  clinic: {
    id: 'clinic',
    name: 'Clinic, Healthcare & Wellness',
    aliases: [
      'clinic', 'health', 'healthcare', 'medical', 'doctor', 'physician',
      'hospital', 'wellness centre', 'physiotherapy', 'pediatrician', 'dermatologist',
      'consultant', 'skin clinic', 'ayurveda', 'homeopathy'
    ],
    description: 'Medical practices, wellness consultancies & specialist clinics',
    theme: 'Trustworthy, Clean & Caring',
    backgroundImage: '/categories/clinic.webp',
    mobileBackgroundImage: '/categories/clinic-mobile.webp',
    imageOptions: [
      { id: 'clinic_01', url: '/categories/clinic.webp', mobileUrl: '/categories/clinic-mobile.webp', label: 'Modern Clinical Suite', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(10,77,104,0.3) 0%, rgba(4,30,42,0.82) 100%)',
    },
    defaultPrimaryColor: '#0A4D68',
    defaultSecondaryColor: '#05BFDB',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Consultation Feedback',
    postCompletionCTA: 'View Clinic Specialities',
    headline: 'How was your consultation experience?',
    subheadline: 'Patient care is our top priority. Your review helps other patients find trusted care.',
    footerFeatures: [
      { label: 'Certified Doctors', icon: 'ShieldCheck' },
      { label: 'Patient-First Care', icon: 'Heart' },
      { label: 'Hygienic Environment', icon: 'Sparkles' },
    ],
    icon: 'Stethoscope',
  },

  dentist: {
    id: 'dentist',
    name: 'Dental Care & Orthodontics',
    aliases: [
      'dentist', 'dental clinic', 'dental', 'orthodontist', 'teeth whitening',
      'dental care', 'implant', 'smiles', 'oral care'
    ],
    description: 'Dental clinics, smile makeover specialists & orthodontic centres',
    theme: 'Clean, Reassuring & Advanced',
    backgroundImage: '/categories/dentist.webp',
    mobileBackgroundImage: '/categories/dentist-mobile.webp',
    imageOptions: [
      { id: 'dentist_01', url: '/categories/dentist.webp', mobileUrl: '/categories/dentist-mobile.webp', label: 'High-Tech Dental Suite', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(8,131,149,0.3) 0%, rgba(3,50,60,0.8) 100%)',
    },
    defaultPrimaryColor: '#088395',
    defaultSecondaryColor: '#46C2CB',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Dental Care Experience',
    postCompletionCTA: 'View Dental Services',
    headline: 'How was your dental visit with us?',
    subheadline: 'Helping you smile with confidence! Share your experience with our dental team.',
    footerFeatures: [
      { label: 'Gentle Care', icon: 'Heart' },
      { label: 'Modern Equipment', icon: 'Sparkles' },
      { label: 'Smile Specialists', icon: 'CheckCircle' },
    ],
    icon: 'Smile',
  },

  retail: {
    id: 'retail',
    name: 'Retail Store & Lifestyle Boutique',
    aliases: [
      'retail', 'store', 'shop', 'boutique', 'showroom', 'gift shop',
      'lifestyle', 'home decor', 'furniture', 'general store', 'outlet'
    ],
    description: 'Curated retail stores, home design showrooms & lifestyle outlets',
    theme: 'Curated Elegance & Showcase',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'retail_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Boutique Store Interior', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(44,51,51,0.35) 0%, rgba(18,22,22,0.8) 100%)',
    },
    defaultPrimaryColor: '#2C3333',
    defaultSecondaryColor: '#CBE4DE',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: false,
    productsEnabled: true,
    suggestedCTA: 'Review Your Shopping Experience',
    postCompletionCTA: 'Explore Featured Collection',
    headline: 'How was your shopping experience?',
    subheadline: 'Thank you for choosing us! Let fellow shoppers know what you loved about our collection.',
    footerFeatures: [
      { label: 'Curated Quality', icon: 'Sparkles' },
      { label: 'Friendly Staff', icon: 'Heart' },
      { label: 'Unique Finds', icon: 'ShoppingBag' },
    ],
    icon: 'ShoppingBag',
  },

  fashion: {
    id: 'fashion',
    name: 'Fashion, Apparel & Designer Studio',
    aliases: [
      'fashion', 'clothing', 'apparel', 'designer', 'tailor', 'couture',
      'ethnic wear', 'saree', 'menswear', 'womenswear', 'kids clothing'
    ],
    description: 'Designer fashion, luxury apparel, bespoke couture & boutique tailors',
    theme: 'High Fashion & Refined Aesthetic',
    backgroundImage: '/categories/fashion.webp',
    mobileBackgroundImage: '/categories/fashion-mobile.webp',
    imageOptions: [
      { id: 'fashion_01', url: '/categories/fashion.webp', mobileUrl: '/categories/fashion-mobile.webp', label: 'Designer Runway Studio', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(26,26,36,0.4) 0%, rgba(10,10,15,0.82) 100%)',
    },
    defaultPrimaryColor: '#1A1A24',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'elegant',
    menuEnabled: false,
    servicesEnabled: false,
    productsEnabled: true,
    suggestedCTA: 'Review Your Fashion Experience',
    postCompletionCTA: 'Explore New Arrivals',
    headline: 'How do you love your outfit & fit?',
    subheadline: 'We love dressing you up! Tell others about our fabrics, style & design.',
    footerFeatures: [
      { label: 'Master Craftsmanship', icon: 'Scissors' },
      { label: 'Perfect Fit', icon: 'CheckCircle' },
      { label: 'Timeless Style', icon: 'Sparkles' },
    ],
    icon: 'Shirt',
  },

  gym: {
    id: 'gym',
    name: 'Gym, Fitness & Athletic Club',
    aliases: [
      'gym', 'fitness', 'crossfit', 'workout', 'yoga', 'pilates',
      'martial arts', 'boxing', 'athletic club', 'health club', 'personal trainer'
    ],
    description: 'Gymnasiums, CrossFit boxes, yoga sanctuaries & fitness studios',
    theme: 'High Energy & Athletic Strength',
    backgroundImage: '/categories/gym.webp',
    mobileBackgroundImage: '/categories/gym-mobile.webp',
    imageOptions: [
      { id: 'gym_01', url: '/categories/gym.webp', mobileUrl: '/categories/gym-mobile.webp', label: 'State-of-the-Art Fitness Floor', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(2,6,23,0.85) 100%)',
    },
    defaultPrimaryColor: '#0F172A',
    defaultSecondaryColor: '#38BDF8',
    defaultFontStyle: 'bold',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Rate Your Workout Experience',
    postCompletionCTA: 'Explore Training Programs',
    headline: 'How was your workout session?',
    subheadline: 'Every rep counts! Share your fitness journey and inspire other members.',
    footerFeatures: [
      { label: 'Top Equipment', icon: 'Dumbbell' },
      { label: 'Motivating Coaches', icon: 'Zap' },
      { label: 'Clean Environment', icon: 'ShieldCheck' },
    ],
    icon: 'Dumbbell',
  },

  beauty: {
    id: 'beauty',
    name: 'Beauty, Wellness & Aesthetics',
    aliases: [
      'beauty', 'wellness', 'aesthetic clinic', 'cosmetology', 'skincare',
      'laser clinic', 'body spa', 'massage therapy', 'ayurvedic spa'
    ],
    description: 'Aesthetic clinics, cosmetology centres, holistic spas & skincare sanctuaries',
    theme: 'Radiant, Calming & Rejuvenating',
    backgroundImage: '/categories/salon.webp',
    mobileBackgroundImage: '/categories/salon-mobile.webp',
    imageOptions: [
      { id: 'beauty_01', url: '/categories/salon.webp', mobileUrl: '/categories/salon-mobile.webp', label: 'Spa Wellness Lounge', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(60,26,46,0.35) 0%, rgba(25,10,20,0.8) 100%)',
    },
    defaultPrimaryColor: '#3C1A2E',
    defaultSecondaryColor: '#F472B6',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Wellness Experience',
    postCompletionCTA: 'Explore Beauty Treatments',
    headline: 'How was your rejuvenation session?',
    subheadline: 'Feel radiant inside & out! Share your experience with our aesthetic experts.',
    footerFeatures: [
      { label: 'Gentle Therapy', icon: 'Heart' },
      { label: 'Visible Results', icon: 'Sparkles' },
      { label: 'Pure Relaxation', icon: 'Smile' },
    ],
    icon: 'Sparkles',
  },

  automotive: {
    id: 'automotive',
    name: 'Automotive, Detailing & Service',
    aliases: [
      'automotive', 'car', 'auto', 'car service', 'mechanic', 'car wash',
      'detailing', 'car dealer', 'bike service', 'tyres', 'garage', 'bodyshop'
    ],
    description: 'Car service centers, ceramic coating studios & automotive dealerships',
    theme: 'Precision, Performance & Trust',
    backgroundImage: '/categories/automotive.webp',
    mobileBackgroundImage: '/categories/automotive-mobile.webp',
    imageOptions: [
      { id: 'auto_01', url: '/categories/automotive.webp', mobileUrl: '/categories/automotive-mobile.webp', label: 'Luxury Vehicle Detailing Studio', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.72,
      gradient: 'linear-gradient(180deg, rgba(17,24,39,0.45) 0%, rgba(3,7,18,0.85) 100%)',
    },
    defaultPrimaryColor: '#111827',
    defaultSecondaryColor: '#60A5FA',
    defaultFontStyle: 'bold',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Review Your Vehicle Service',
    postCompletionCTA: 'View Service Packages',
    headline: 'How was your vehicle service experience?',
    subheadline: 'We treat your machine like our own. Tell others about our precision and care!',
    footerFeatures: [
      { label: 'Certified Mechanics', icon: 'Wrench' },
      { label: 'Genuine Spares', icon: 'ShieldCheck' },
      { label: 'Prompt Delivery', icon: 'Clock' },
    ],
    icon: 'Car',
  },

  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate, Builders & Architecture',
    aliases: [
      'real estate', 'property', 'builder', 'developer', 'realtor', 'architect',
      'interior designer', 'construction', 'housing', 'apartments', 'broker'
    ],
    description: 'Property advisors, developers, architectural studios & interior firms',
    theme: 'Architectural, Aspirational & Grand',
    backgroundImage: '/categories/real-estate.webp',
    mobileBackgroundImage: '/categories/real-estate-mobile.webp',
    imageOptions: [
      { id: 're_01', url: '/categories/real-estate.webp', mobileUrl: '/categories/real-estate-mobile.webp', label: 'Architectural Modern Villa', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(30,41,59,0.35) 0%, rgba(15,23,42,0.8) 100%)',
    },
    defaultPrimaryColor: '#1E293B',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Property Experience',
    postCompletionCTA: 'Explore Current Projects',
    headline: 'How was your property experience with us?',
    subheadline: 'Helping you find or build your dream space. Your review guides future homeowners!',
    footerFeatures: [
      { label: 'Verified Properties', icon: 'ShieldCheck' },
      { label: 'Transparent Dealings', icon: 'CheckCircle' },
      { label: 'Design Excellence', icon: 'Sparkles' },
    ],
    icon: 'Home',
  },

  education: {
    id: 'education',
    name: 'Education, Academy & Coaching',
    aliases: [
      'education', 'school', 'college', 'academy', 'coaching', 'institute',
      'training', 'tutor', 'learning centre', 'classes', 'music school', 'dance school'
    ],
    description: 'Schools, coaching academies, creative studios & skills institutes',
    theme: 'Inspiring, Focused & Credible',
    backgroundImage: '/categories/education.webp',
    mobileBackgroundImage: '/categories/education-mobile.webp',
    imageOptions: [
      { id: 'edu_01', url: '/categories/education.webp', mobileUrl: '/categories/education-mobile.webp', label: 'Contemporary Learning Hall', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(30,58,138,0.35) 0%, rgba(15,23,42,0.82) 100%)',
    },
    defaultPrimaryColor: '#1E3A8A',
    defaultSecondaryColor: '#F59E0B',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Learning Journey',
    postCompletionCTA: 'Explore Courses & Batches',
    headline: 'How was your learning experience?',
    subheadline: 'Empowering minds every day! Share how our mentors & curriculum made an impact.',
    footerFeatures: [
      { label: 'Expert Faculty', icon: 'BookOpen' },
      { label: 'Proven Results', icon: 'Award' },
      { label: 'Supportive Mentorship', icon: 'Heart' },
    ],
    icon: 'GraduationCap',
  },

  professional: {
    id: 'professional',
    name: 'Professional & Legal Services',
    aliases: [
      'professional', 'lawyer', 'advocate', 'chartered accountant', 'ca',
      'consultant', 'tax', 'financial advisor', 'insurance', 'agency', 'it company'
    ],
    description: 'Chartered accountants, legal counsels, tax advisors & digital agencies',
    theme: 'Corporate, Prestigious & Dependable',
    backgroundImage: '/categories/other.webp',
    mobileBackgroundImage: '/categories/other-mobile.webp',
    imageOptions: [
      { id: 'prof_01', url: '/categories/other.webp', mobileUrl: '/categories/other-mobile.webp', label: 'Executive Boardroom', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(24,39,71,0.4) 0%, rgba(10,16,30,0.85) 100%)',
    },
    defaultPrimaryColor: '#182747',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Experience',
    postCompletionCTA: 'Explore Professional Services',
    headline: 'How was your consultation with us?',
    subheadline: 'Your success is our mission. Help other businesses connect with trusted expertise!',
    footerFeatures: [
      { label: 'Certified Experts', icon: 'ShieldCheck' },
      { label: 'Timely Delivery', icon: 'Clock' },
      { label: 'Strategic Clarity', icon: 'Sparkles' },
    ],
    icon: 'Briefcase',
  },

  travel: {
    id: 'travel',
    name: 'Travel, Tour & Tourism Agency',
    aliases: [
      'travel', 'tour', 'tourism', 'travel agency', 'holiday', 'trip planner',
      'safari', 'car rental', 'destination', 'tours'
    ],
    description: 'Tour operators, adventure organizers, luxury travel planners & agencies',
    theme: 'Expedition, Wonder & Freedom',
    backgroundImage: '/categories/hotel.webp',
    mobileBackgroundImage: '/categories/hotel-mobile.webp',
    imageOptions: [
      { id: 'trv_01', url: '/categories/hotel.webp', mobileUrl: '/categories/hotel-mobile.webp', label: 'Panoramic Travel Vista', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(12,74,110,0.35) 0%, rgba(5,30,45,0.8) 100%)',
    },
    defaultPrimaryColor: '#0C4A6E',
    defaultSecondaryColor: '#38BDF8',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Review Your Trip Experience',
    postCompletionCTA: 'Explore Holiday Packages',
    headline: 'How was your journey with us?',
    subheadline: 'Memories that last a lifetime! Share your travel story to inspire fellow explorers.',
    footerFeatures: [
      { label: 'Seamless Planning', icon: 'Compass' },
      { label: 'Local Guides', icon: 'MapPin' },
      { label: 'Unforgettable Stays', icon: 'Heart' },
    ],
    icon: 'Plane',
  },

  events: {
    id: 'events',
    name: 'Event, Wedding & Banquet Services',
    aliases: [
      'event', 'wedding', 'banquet', 'catering', 'wedding planner', 'party planner',
      'banquet hall', 'marriage hall', 'decor', 'florist', 'dj', 'entertainment'
    ],
    description: 'Wedding planners, banquet spaces, bespoke caterers & event managers',
    theme: 'Celebratory, Opulent & Enchanting',
    backgroundImage: '/categories/restaurant.webp',
    mobileBackgroundImage: '/categories/restaurant-mobile.webp',
    imageOptions: [
      { id: 'evt_01', url: '/categories/restaurant.webp', mobileUrl: '/categories/restaurant-mobile.webp', label: 'Opulent Banquet Hall', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(74,21,75,0.35) 0%, rgba(30,10,30,0.82) 100%)',
    },
    defaultPrimaryColor: '#4A154B',
    defaultSecondaryColor: '#E2C992',
    defaultFontStyle: 'elegant',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Celebration Feedback',
    postCompletionCTA: 'View Event Portfolio',
    headline: 'How was your celebration with us?',
    subheadline: 'Honoured to be part of your milestone! Share how we helped make your day special.',
    footerFeatures: [
      { label: 'Grand Execution', icon: 'Sparkles' },
      { label: 'Tailored Decor', icon: 'Heart' },
      { label: 'Flawless Service', icon: 'Award' },
    ],
    icon: 'PartyPopper',
  },

  'home-services': {
    id: 'home-services',
    name: 'Home Services, Cleaning & Maintenance',
    aliases: [
      'home service', 'electrician', 'plumber', 'carpenter', 'cleaning',
      'pest control', 'ac repair', 'painter', 'handyman', 'solar', 'renovation'
    ],
    description: 'Home repairs, deep cleaning, AC technicians, solar installers & renovators',
    theme: 'Reliable, Prompt & Spotless',
    backgroundImage: '/categories/other.webp',
    mobileBackgroundImage: '/categories/other-mobile.webp',
    imageOptions: [
      { id: 'home_01', url: '/categories/other.webp', mobileUrl: '/categories/other-mobile.webp', label: 'Clean Modern Home Space', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(30,58,95,0.35) 0%, rgba(10,25,45,0.82) 100%)',
    },
    defaultPrimaryColor: '#1E3A5F',
    defaultSecondaryColor: '#38BDF8',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Review Your Service Experience',
    postCompletionCTA: 'View Home Services',
    headline: 'How was your home service visit?',
    subheadline: 'Your home deserves the best care. Share your honest review of our technician & work!',
    footerFeatures: [
      { label: 'Punctual & Polite', icon: 'Clock' },
      { label: 'Quality Guarantee', icon: 'ShieldCheck' },
      { label: 'Transparent Pricing', icon: 'CheckCircle' },
    ],
    icon: 'Wrench',
  },

  electronics: {
    id: 'electronics',
    name: 'Electronics, Mobile & Tech Store',
    aliases: [
      'electronics', 'gadgets', 'mobile shop', 'computer', 'laptop repair',
      'appliances', 'audio', 'phone repair', 'apple store', 'tech accessories'
    ],
    description: 'Smartphone stores, consumer electronics, computer repairs & smart appliances',
    theme: 'Futuristic, High-Tech & Crisp',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'elec_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Modern Electronics Showroom', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(2,6,23,0.85) 100%)',
    },
    defaultPrimaryColor: '#0F172A',
    defaultSecondaryColor: '#06B6D4',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Rate Your Device or Service',
    postCompletionCTA: 'Explore Trending Gadgets',
    headline: 'How is your new device performing?',
    subheadline: 'Powered by the latest technology! Tell other tech lovers about your buying experience.',
    footerFeatures: [
      { label: '100% Genuine', icon: 'ShieldCheck' },
      { label: 'Expert Advice', icon: 'Cpu' },
      { label: 'Warranty Backed', icon: 'Award' },
    ],
    icon: 'Smartphone',
  },

  jewellery: {
    id: 'jewellery',
    name: 'Jewellery, Gold & Luxury Gems',
    aliases: [
      'jewellery', 'jewelry', 'gold', 'diamond', 'jeweller', 'gems',
      'silversmith', 'ornaments', 'polki', 'kundan', 'luxury watch'
    ],
    description: 'Gold & diamond boutiques, bridal jewellery showrooms & luxury jewel houses',
    theme: 'Opulent, Royal & Exquisite',
    backgroundImage: '/categories/jewellery.webp',
    mobileBackgroundImage: '/categories/jewellery-mobile.webp',
    imageOptions: [
      { id: 'jwl_01', url: '/categories/jewellery.webp', mobileUrl: '/categories/jewellery-mobile.webp', label: 'Luxury Velvet Showcase', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(26,22,21,0.45) 0%, rgba(10,8,7,0.85) 100%)',
    },
    defaultPrimaryColor: '#1A1615',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'elegant',
    menuEnabled: false,
    servicesEnabled: false,
    productsEnabled: true,
    suggestedCTA: 'Review Your Jewellery Experience',
    postCompletionCTA: 'View Masterpiece Collection',
    headline: 'How was your jewellery purchase with us?',
    subheadline: 'Crafted to be cherished forever. Share your impression of our hallmark artistry!',
    footerFeatures: [
      { label: 'Hallmarked Gold', icon: 'Award' },
      { label: 'Heritage Craft', icon: 'Sparkles' },
      { label: 'Certified Diamonds', icon: 'ShieldCheck' },
    ],
    icon: 'Gem',
  },

  grocery: {
    id: 'grocery',
    name: 'Grocery, Gourmet & Supermarket',
    aliases: [
      'grocery', 'supermarket', 'mart', 'kirana', 'provisions', 'organic store',
      'gourmet food', 'fresh produce', 'vegetable store', 'fruits'
    ],
    description: 'Gourmet grocers, organic supermarkets & neighborhood daily essentials',
    theme: 'Fresh, Organic & Welcoming',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'groc_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Fresh Market Aisles', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(20,83,45,0.35) 0%, rgba(8,35,20,0.8) 100%)',
    },
    defaultPrimaryColor: '#14532D',
    defaultSecondaryColor: '#86EFAC',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: false,
    productsEnabled: true,
    suggestedCTA: 'Review Your Shopping Experience',
    postCompletionCTA: 'View Weekly Deals',
    headline: 'How was your grocery shopping today?',
    subheadline: 'Freshness delivered daily! Let neighbors know about our quality & variety.',
    footerFeatures: [
      { label: 'Farm Fresh', icon: 'Leaf' },
      { label: 'Fair Pricing', icon: 'CheckCircle' },
      { label: 'Quick Checkout', icon: 'Clock' },
    ],
    icon: 'Apple',
  },

  bakery: {
    id: 'bakery',
    name: 'Bakery, Patisserie & Confectionery',
    aliases: [
      'bakery', 'patisserie', 'cake shop', 'cakes', 'pastry', 'bakes',
      'confectionery', 'cookies', 'croissant', 'sourdough', 'chocolatier'
    ],
    description: 'French patisseries, artisanal sourdough bakeshops & celebratory cake studios',
    theme: 'Warm, Fragrant & Delicious',
    backgroundImage: '/categories/bakery.webp',
    mobileBackgroundImage: '/categories/bakery-mobile.webp',
    imageOptions: [
      { id: 'bake_01', url: '/categories/bakery.webp', mobileUrl: '/categories/bakery-mobile.webp', label: 'Artisan Patisserie Showcase', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.62,
      gradient: 'linear-gradient(180deg, rgba(69,26,3,0.35) 0%, rgba(30,12,2,0.8) 100%)',
    },
    defaultPrimaryColor: '#451A03',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'elegant',
    menuEnabled: true,
    servicesEnabled: false,
    productsEnabled: true,
    suggestedCTA: 'Share Your Sweet Experience',
    postCompletionCTA: 'View Bakery Menu & Treats',
    headline: 'How was your cake & bakery treat?',
    subheadline: 'Baked with love each morning! Share which sweet indulgence made your day.',
    footerFeatures: [
      { label: 'Fresh Daily', icon: 'Flame' },
      { label: 'Pure Butter & Ingredients', icon: 'Sparkles' },
      { label: 'Custom Creations', icon: 'Heart' },
    ],
    icon: 'Cake',
  },

  pharmacy: {
    id: 'pharmacy',
    name: 'Healthcare, Pharmacy & Wellness',
    aliases: [
      'pharmacy', 'chemist', 'drugstore', 'meds', 'medicines', 'ayurvedic pharmacy',
      'wellness store', 'medical store', 'homeopathic pharmacy'
    ],
    description: 'Community pharmacies, prescription centers & wellness dispensaries',
    theme: 'Precise, Caring & Life-Centered',
    backgroundImage: '/categories/clinic.webp',
    mobileBackgroundImage: '/categories/clinic-mobile.webp',
    imageOptions: [
      { id: 'pharm_01', url: '/categories/clinic.webp', mobileUrl: '/categories/clinic-mobile.webp', label: 'Clean Healthcare Dispensary', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(6,95,70,0.35) 0%, rgba(2,40,30,0.82) 100%)',
    },
    defaultPrimaryColor: '#065F46',
    defaultSecondaryColor: '#34D399',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Share Your Pharmacy Experience',
    postCompletionCTA: 'View Health Products',
    headline: 'How was your pharmacy service?',
    subheadline: 'Your health is essential. Share how our pharmacist helped with your medicines.',
    footerFeatures: [
      { label: '100% Genuine Medicines', icon: 'ShieldCheck' },
      { label: 'Prompt Availability', icon: 'Clock' },
      { label: 'Expert Guidance', icon: 'Heart' },
    ],
    icon: 'Pill',
  },

  creative: {
    id: 'creative',
    name: 'Photography, Studio & Creative Media',
    aliases: [
      'photography', 'photographer', 'photo studio', 'videography', 'studio',
      'creative agency', 'designer studio', 'portrait studio', 'production'
    ],
    description: 'Portrait studios, wedding photographers, video creators & art spaces',
    theme: 'Cinematic, Evocative & Visionary',
    backgroundImage: '/categories/fashion.webp',
    mobileBackgroundImage: '/categories/fashion-mobile.webp',
    imageOptions: [
      { id: 'crt_01', url: '/categories/fashion.webp', mobileUrl: '/categories/fashion-mobile.webp', label: 'Studio Production Floor', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(24,24,27,0.4) 0%, rgba(9,9,11,0.85) 100%)',
    },
    defaultPrimaryColor: '#18181B',
    defaultSecondaryColor: '#E4E4E7',
    defaultFontStyle: 'minimal',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Review Your Shoot Experience',
    postCompletionCTA: 'View Creative Portfolio',
    headline: 'How was your photoshoot experience?',
    subheadline: 'Capturing moments that tell a story. Share your thoughts on our visual craft!',
    footerFeatures: [
      { label: 'Cinematic Vision', icon: 'Camera' },
      { label: 'Creative Direction', icon: 'Sparkles' },
      { label: 'High-Res Delivery', icon: 'Award' },
    ],
    icon: 'Camera',
  },

  'pet-care': {
    id: 'pet-care',
    name: 'Pet Care, Grooming & Veterinary',
    aliases: [
      'pet', 'pet care', 'vet', 'veterinary', 'pet clinic', 'pet grooming',
      'dog', 'cat', 'pet shop', 'pet boarding', 'dog training'
    ],
    description: 'Veterinary clinics, pet grooming spas, dog training & boarding retreats',
    theme: 'Friendly, Caring & Joyful',
    backgroundImage: '/categories/pet-care.webp',
    mobileBackgroundImage: '/categories/pet-care-mobile.webp',
    imageOptions: [
      { id: 'pet_01', url: '/categories/pet-care.webp', mobileUrl: '/categories/pet-care-mobile.webp', label: 'Pet Spa & Wellness', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.62,
      gradient: 'linear-gradient(180deg, rgba(17,94,89,0.35) 0%, rgba(8,45,42,0.8) 100%)',
    },
    defaultPrimaryColor: '#115E59',
    defaultSecondaryColor: '#5EEAD4',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Share Your Pet Care Feedback',
    postCompletionCTA: 'Explore Pet Services',
    headline: 'How was your furry friend’s visit?',
    subheadline: 'We treat your pets like family. Tell other pet parents how your companion felt!',
    footerFeatures: [
      { label: 'Gentle Handling', icon: 'Heart' },
      { label: 'Certified Vets', icon: 'ShieldCheck' },
      { label: 'Happy Tails', icon: 'Sparkles' },
    ],
    icon: 'PawPrint',
  },

  hardware: {
    id: 'hardware',
    name: 'Hardware, Tools & Building Materials',
    aliases: [
      'hardware', 'hardware store', 'building material', 'power tools', 'tools',
      'fasteners', 'iron store', 'drill', 'screws', 'hinges', 'construction materials',
      'steel', 'cement', 'wire mesh', 'locks'
    ],
    description: 'Construction hardware, power tools, fasteners, locks & contractor supplies',
    theme: 'Sturdy, Industrial & Dependable',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'hard_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Hardware Depot', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.70,
      gradient: 'linear-gradient(180deg, rgba(69,26,3,0.4) 0%, rgba(20,8,3,0.85) 100%)',
    },
    defaultPrimaryColor: '#78350F',
    defaultSecondaryColor: '#F59E0B',
    defaultFontStyle: 'bold',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Review Your Hardware Purchase',
    postCompletionCTA: 'View Supplies & Catalog',
    headline: 'How was your visit to our hardware store?',
    subheadline: 'We value your feedback on our genuine tools, building materials, and contractor rates.',
    footerFeatures: [
      { label: 'Heavy Duty Stock', icon: 'CheckCircle' },
      { label: 'Contractor Rates', icon: 'Award' },
      { label: 'Genuine Brands', icon: 'ShieldCheck' },
    ],
    icon: 'Wrench',
  },

  'pvc-plumbing': {
    id: 'pvc-plumbing',
    name: 'PVC Pipes, Sanitary & Plumbing Store',
    aliases: [
      'pvc', 'pvc shop', 'pvc pipes', 'plumbing', 'pipe store', 'sanitary',
      'cpvc', 'upvc', 'water tank', 'plumbing supplies', 'pipe fittings',
      'astral', 'finolex', 'ashirvad', 'supreme', 'taps', 'valves', 'drainage'
    ],
    description: 'PVC, CPVC & uPVC pipes, sanitary fittings, water tanks & plumbing solutions',
    theme: 'Clean Water, Durable & Professional',
    backgroundImage: '/categories/other.webp',
    mobileBackgroundImage: '/categories/other-mobile.webp',
    imageOptions: [
      { id: 'pvc_01', url: '/categories/other.webp', mobileUrl: '/categories/other-mobile.webp', label: 'Pipes & Fittings Depot', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.68,
      gradient: 'linear-gradient(180deg, rgba(3,105,161,0.35) 0%, rgba(8,47,73,0.85) 100%)',
    },
    defaultPrimaryColor: '#0369A1',
    defaultSecondaryColor: '#38BDF8',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Rate Our Pipes & Fittings',
    postCompletionCTA: 'View Plumbing Products',
    headline: 'How was your experience with our pipes & fittings?',
    subheadline: 'Help local builders, plumbers, and homeowners discover our top-grade PVC fittings and wholesale rates!',
    footerFeatures: [
      { label: 'Leak-Proof Quality', icon: 'ShieldCheck' },
      { label: 'Wholesale Pricing', icon: 'Award' },
      { label: 'All Fittings in Stock', icon: 'CheckCircle' },
    ],
    icon: 'Package',
  },

  electrical: {
    id: 'electrical',
    name: 'Electrical, Lighting & Inverter Store',
    aliases: [
      'electrical', 'electric store', 'electrician shop', 'wires', 'switches',
      'mcb', 'led lights', 'inverter', 'fans', 'lighting', 'cables', 'havells', 'anchor'
    ],
    description: 'Branded electrical wiring, switches, modular plates, LED lighting & backup power',
    theme: 'Vibrant, Electric & Reliable',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'elec_shop_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Electrical Showroom', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(30,58,138,0.35) 0%, rgba(15,23,42,0.85) 100%)',
    },
    defaultPrimaryColor: '#1E3A8A',
    defaultSecondaryColor: '#FBBF24',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Review Your Electrical Purchase',
    postCompletionCTA: 'Explore Electrical Catalog',
    headline: 'How was your electrical shopping experience?',
    subheadline: 'Tell us how you found our electrical supplies, branded wires, and in-store guidance!',
    footerFeatures: [
      { label: 'ISI Certified', icon: 'ShieldCheck' },
      { label: 'Energy Efficient', icon: 'Sparkles' },
      { label: 'Bulk Electrician Rates', icon: 'Award' },
    ],
    icon: 'Zap',
  },

  paint: {
    id: 'paint',
    name: 'Paints, Wall Texture & Coatings',
    aliases: [
      'paint', 'paint store', 'asian paints', 'wall paint', 'berger', 'nerolac',
      'waterproofing', 'colors', 'paint shop', 'primer', 'putty', 'texture'
    ],
    description: 'Interior and exterior wall paints, waterproofing, primer, putty & wood polish',
    theme: 'Colorful, Vibrant & Artistic',
    backgroundImage: '/categories/retail.webp',
    mobileBackgroundImage: '/categories/retail-mobile.webp',
    imageOptions: [
      { id: 'pnt_01', url: '/categories/retail.webp', mobileUrl: '/categories/retail-mobile.webp', label: 'Paint & Color Lounge', qualityScore: 10, isDefault: true },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(131,24,67,0.35) 0%, rgba(55,10,29,0.85) 100%)',
    },
    defaultPrimaryColor: '#831843',
    defaultSecondaryColor: '#F472B6',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: true,
    suggestedCTA: 'Review Your Paint & Colors',
    postCompletionCTA: 'View Color Swatches',
    headline: 'How was your paint shopping experience?',
    subheadline: 'Share your thoughts on our color matching accuracy, brand options, and finish quality!',
    footerFeatures: [
      { label: 'Exact Color Tinting', icon: 'Sparkles' },
      { label: 'All Top Brands', icon: 'CheckCircle' },
      { label: 'Waterproofing Experts', icon: 'ShieldCheck' },
    ],
    icon: 'Palette',
  },

  other: {
    id: 'other',
    name: 'Local Business & Services',
    aliases: [
      'other', 'local business', 'general', 'service', 'company', 'office',
      'consultancy', 'establishment', 'point of interest'
    ],
    description: 'Independent local businesses, community venues & versatile commercial hubs',
    theme: 'Clean, Modern & Professional',
    backgroundImage: '/categories/other.webp',
    mobileBackgroundImage: '/categories/other-mobile.webp',
    imageOptions: [
      { id: 'other_01', url: '/categories/other.webp', mobileUrl: '/categories/other-mobile.webp', label: 'Contemporary Business Lobby', qualityScore: 10, isDefault: true },
      { id: 'other_02', url: '/categories/restaurant.webp', mobileUrl: '/categories/restaurant-mobile.webp', label: 'Classic Warm Venue', qualityScore: 9, isDefault: false },
    ],
    overlay: {
      type: 'gradient',
      opacity: 0.65,
      gradient: 'linear-gradient(180deg, rgba(30,41,59,0.35) 0%, rgba(15,23,42,0.82) 100%)',
    },
    defaultPrimaryColor: '#1E293B',
    defaultSecondaryColor: '#D4AF37',
    defaultFontStyle: 'modern',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
    suggestedCTA: 'Share Your Experience',
    postCompletionCTA: 'View Our Services',
    headline: 'How was your experience with us?',
    subheadline: 'Your feedback means a lot! Share your experience and help others discover us.',
    footerFeatures: [
      { label: 'Quality Service', icon: 'CheckCircle' },
      { label: 'Customer First', icon: 'Heart' },
      { label: 'Trusted Local', icon: 'ShieldCheck' },
    ],
    icon: 'Building2',
  },
};

/**
 * Category-managed review topics for every supported funnel category.
 * The public funnel uses these prompts to keep review assistance relevant to
 * the business type without exposing a second funnel customization surface.
 */
export const CATEGORY_REVIEW_TOPICS: Record<string, string[]> = {
  restaurant: ['Food Quality', 'Taste & Freshness', 'Menu Variety', 'Ambience', 'Staff Service', 'Overall Experience'],
  cafe: ['Coffee & Brews', 'Fresh Bakes', 'Food Quality', 'Cozy Ambience', 'Staff Service', 'Overall Experience'],
  hotel: ['Room Comfort', 'Cleanliness', 'Hospitality', 'Scenic Views', 'Breakfast & Dining', 'Overall Experience'],
  salon: ['Service Quality', 'Staff Professionalism', 'Treatment Experience', 'Cleanliness', 'Ambience', 'Overall Experience'],
  clinic: ['Doctor Care', 'Treatment Quality', 'Staff Professionalism', 'Cleanliness', 'Waiting Time', 'Overall Experience'],
  dentist: ['Gentle Care', 'Treatment Quality', 'Modern Equipment', 'Cleanliness', 'Staff Professionalism', 'Overall Experience'],
  retail: ['Product Variety', 'Product Quality', 'Staff Assistance', 'Store Ambience', 'Buying Experience', 'Overall Experience'],
  fashion: ['Product Variety', 'Fabric Quality', 'Fit & Comfort', 'Design & Collection', 'Staff Assistance', 'Overall Experience'],
  gym: ['Trainer Guidance', 'Workout Experience', 'Equipment Quality', 'Cleanliness', 'Motivating Atmosphere', 'Overall Experience'],
  beauty: ['Treatment Quality', 'Staff Professionalism', 'Visible Results', 'Cleanliness', 'Relaxing Ambience', 'Overall Experience'],
  automotive: ['Service Quality', 'Workmanship', 'Parts Quality', 'Service Time', 'Pricing & Value', 'Overall Experience'],
  'real-estate': ['Property Quality', 'Design & Layout', 'Transparent Dealings', 'Staff Guidance', 'Timely Updates', 'Overall Experience'],
  education: ['Teaching Quality', 'Faculty Support', 'Learning Environment', 'Course Content', 'Progress & Results', 'Overall Experience'],
  professional: ['Expert Guidance', 'Communication', 'Service Quality', 'Timely Delivery', 'Value for Money', 'Overall Experience'],
  travel: ['Trip Planning', 'Guide Support', 'Itinerary Quality', 'Accommodation', 'Value for Money', 'Overall Experience'],
  events: ['Event Planning', 'Venue & Decor', 'Food & Catering', 'Staff Coordination', 'Service Quality', 'Overall Experience'],
  'home-services': ['Work Quality', 'Technician Professionalism', 'Punctuality', 'Clean Work', 'Pricing & Value', 'Overall Experience'],
  electronics: ['Product Selection', 'Product Quality', 'Staff Assistance', 'Product Demonstration', 'Buying Experience', 'Installation & Support'],
  jewellery: ['Design & Collection', 'Craftsmanship', 'Product Quality', 'Staff Assistance', 'Buying Experience', 'Overall Experience'],
  grocery: ['Product Freshness', 'Product Variety', 'Store Cleanliness', 'Pricing & Value', 'Checkout Speed', 'Overall Experience'],
  bakery: ['Taste & Freshness', 'Product Variety', 'Ingredient Quality', 'Custom Orders', 'Staff Service', 'Overall Experience'],
  pharmacy: ['Medicine Availability', 'Product Quality', 'Pharmacist Guidance', 'Service Speed', 'Store Cleanliness', 'Overall Experience'],
  creative: ['Creative Direction', 'Work Quality', 'Professionalism', 'Communication', 'Delivery Time', 'Overall Experience'],
  'pet-care': ['Gentle Handling', 'Veterinary Care', 'Grooming Quality', 'Cleanliness', 'Staff Kindness', 'Overall Experience'],
  hardware: ['Product Quality', 'Product Variety', 'Stock Availability', 'Pricing & Value', 'Staff Advice', 'Overall Experience'],
  'pvc-plumbing': ['Product Quality', 'Product Variety', 'Size Availability', 'Pricing & Value', 'Loading & Delivery', 'Staff Expertise'],
  electrical: ['Product Quality', 'Product Variety', 'Brand Selection', 'Staff Guidance', 'Pricing & Value', 'Buying Experience'],
  paint: ['Colour Selection', 'Finish Quality', 'Product Variety', 'Colour Advice', 'Pricing & Value', 'Overall Experience'],
  other: ['Service Quality', 'Staff Professionalism', 'Communication', 'Timely Delivery', 'Pricing & Value', 'Overall Experience'],
};

export function getReviewTopics(rawCategory?: string): string[] {
  const config = normalizeBusinessCategory(rawCategory);
  return CATEGORY_REVIEW_TOPICS[config.id] || CATEGORY_REVIEW_TOPICS.other;
}

/**
 * Normalizes any category string (from Google Places API, URL, or user input)
 * into a matching Pixora BusinessCategoryConfig.
 * 
 * Never returns null. Falls back cleanly to 'restaurant' or 'other'.
 */
export function normalizeBusinessCategory(rawCategory?: string): BusinessCategoryConfig {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return BUSINESS_CATEGORIES.restaurant;
  }

  const clean = rawCategory.toLowerCase().trim();

  // 1. Direct ID match
  if (BUSINESS_CATEGORIES[clean]) {
    return BUSINESS_CATEGORIES[clean];
  }

  // 2. Direct name match
  for (const cat of Object.values(BUSINESS_CATEGORIES)) {
    if (cat.name.toLowerCase() === clean) {
      return cat;
    }
  }

  // 3. Exact alias match
  for (const cat of Object.values(BUSINESS_CATEGORIES)) {
    if (cat.aliases.includes(clean)) {
      return cat;
    }
  }

  // 4. Substring / Stem / Keyword match
  const keywordMappings: { keywords: string[]; categoryId: string }[] = [
    { keywords: ['restaurant', 'dining', 'food', 'biryani', 'pizza', 'burger', 'dhaba', 'thali', 'mess', 'diner', 'kitchen', 'eatery'], categoryId: 'restaurant' },
    { keywords: ['cafe', 'coffee', 'espresso', 'roaster', 'chai', 'tea', 'boba'], categoryId: 'cafe' },
    { keywords: ['bakery', 'baker', 'cake', 'pastry', 'croissant', 'sourdough', 'patisserie', 'confection'], categoryId: 'bakery' },
    { keywords: ['hotel', 'resort', 'stay', 'homestay', 'villa', 'motel', 'haveli', 'palace', 'inn'], categoryId: 'hotel' },
    { keywords: ['salon', 'parlour', 'barber', 'hair', 'haircut', 'styling', 'nails', 'waxing'], categoryId: 'salon' },
    { keywords: ['spa', 'wellness', 'massage', 'cosmetolog', 'skin clinic', 'dermatol', 'laser'], categoryId: 'beauty' },
    { keywords: ['dentist', 'dental', 'teeth', 'orthodont', 'tooth'], categoryId: 'dentist' },
    { keywords: ['clinic', 'doctor', 'hospital', 'health', 'physician', 'physio', 'ayurved', 'homeopath'], categoryId: 'clinic' },
    { keywords: ['gym', 'fitness', 'crossfit', 'workout', 'yoga', 'pilates', 'trainer', 'exercise'], categoryId: 'gym' },
    { keywords: ['jewel', 'gold', 'diamond', 'silver', 'gem', 'ornament'], categoryId: 'jewellery' },
    { keywords: ['fashion', 'apparel', 'cloth', 'clothes', 'garments', 'saree', 'tailor', 'boutique', 'wear', 'couture'], categoryId: 'fashion' },
    { keywords: ['perfume', 'fragrance', 'attar', 'oud', 'scent', 'cologne', 'aroma'], categoryId: 'fashion' },
    { keywords: ['retail', 'store', 'shop', 'mart', 'supermarket', 'grocery', 'produce'], categoryId: 'retail' },
    { keywords: ['auto', 'car', 'motor', 'bike', 'mechanic', 'garage', 'tyre', 'tire', 'service center'], categoryId: 'automotive' },
    { keywords: ['estate', 'property', 'builder', 'realtor', 'architect', 'interior', 'construction', 'real estate'], categoryId: 'real-estate' },
    { keywords: ['education', 'school', 'academy', 'coaching', 'college', 'tuition', 'classes', 'institute'], categoryId: 'education' },
    { keywords: ['office', 'coworking', 'workspace', 'corporate', 'agency', 'consultancy', 'law', 'advocate', 'legal', 'accountant', 'ca ', 'tax', 'consultant'], categoryId: 'professional' },
    { keywords: ['travel', 'tour', 'trip', 'holiday', 'safari'], categoryId: 'travel' },
    { keywords: ['wedding', 'banquet', 'event', 'party', 'cater'], categoryId: 'events' },
    { keywords: ['pvc', 'pipe', 'fitting', 'sanitary', 'cpvc', 'upvc', 'water tank', 'drainage', 'plumbing supply'], categoryId: 'pvc-plumbing' },
    { keywords: ['hardware', 'power tool', 'fastener', 'drill', 'screws', 'hinges', 'tools', 'iron store'], categoryId: 'hardware' },
    { keywords: ['electrical', 'wires', 'switches', 'mcb', 'lighting', 'inverter', 'cables', 'havells'], categoryId: 'electrical' },
    { keywords: ['paint', 'asian paints', 'wall paint', 'berger', 'nerolac', 'waterproof', 'primer', 'putty'], categoryId: 'paint' },
    { keywords: ['electronic', 'phone', 'mobile', 'laptop', 'computer', 'gadget', 'appliance', 'tv', 'refrigerator'], categoryId: 'electronics' },
    { keywords: ['pharmacy', 'chemist', 'drug', 'medicine'], categoryId: 'pharmacy' },
    { keywords: ['clean', 'pest', 'repair', 'ac repair'], categoryId: 'home-services' },
    { keywords: ['photo', 'studio', 'video', 'camera'], categoryId: 'creative' },
  ];

  for (const mapping of keywordMappings) {
    if (mapping.keywords.some((kw) => clean.includes(kw))) {
      return BUSINESS_CATEGORIES[mapping.categoryId];
    }
  }

  // 5. Fallback: Default to Restaurant if food-related, else other
  return BUSINESS_CATEGORIES.other;
}

/**
 * Returns confidence of category detection
 */
export function getCategoryConfidence(rawCategory?: string): CategoryConfidence {
  if (!rawCategory) return 'low';
  const clean = rawCategory.toLowerCase().trim();

  // High: direct match or exact alias
  if (BUSINESS_CATEGORIES[clean]) return 'high';
  for (const cat of Object.values(BUSINESS_CATEGORIES)) {
    if (cat.name.toLowerCase() === clean || cat.aliases.includes(clean)) {
      return 'high';
    }
  }

  // Medium: recognizable keyword
  const allKeywords = Object.values(BUSINESS_CATEGORIES).flatMap(c => c.aliases);
  if (allKeywords.some(kw => clean.includes(kw))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Category-managed Customer Funnel Background:
 * 1. Category-specific desktop/mobile image
 * 2. Default Pixora image when a category asset is unavailable
 * 
 * The public funnel intentionally does not consume client-uploaded cover images
 * or manually selected theme variants. Business profile details remain editable
 * in the portal, while the funnel presentation stays consistent per category.
 */
export function getFunnelBackground(business?: {
  customCoverImage?: string;
  coverImage?: string;
  category?: string;
  theme?: {
    coverImage?: string;
  };
}): {
  desktop: string;
  mobile: string;
  overlay: CategoryOverlayConfig;
  categoryConfig: BusinessCategoryConfig;
} {
  const categoryConfig = normalizeBusinessCategory(business?.category);

  return {
    desktop: categoryConfig.backgroundImage || DEFAULT_FUNNEL_BACKGROUND,
    mobile: categoryConfig.mobileBackgroundImage || categoryConfig.backgroundImage || DEFAULT_FUNNEL_MOBILE_BACKGROUND,
    overlay: categoryConfig.overlay,
    categoryConfig,
  };
}

/**
 * Returns a list of all selectable categories for dropdowns/pickers
 */
export function getAllCategories(): BusinessCategoryConfig[] {
  return Object.values(BUSINESS_CATEGORIES);
}

/**
 * Checks whether a business category is a food & dining establishment
 * (Restaurant, Cafe, Bakery, etc.) that uses a "Menu", or a non-food business
 * (Retail, Salon, Clinic, Gym, Services, etc.) that uses a "Catalogue".
 */
export function isFoodAndDiningBusiness(rawCategory?: string): boolean {
  if (!rawCategory) return true; // Default fallback is restaurant
  const config = normalizeBusinessCategory(rawCategory);
  const foodCategoryIds = ['restaurant', 'cafe', 'bakery'];
  if (foodCategoryIds.includes(config.id)) return true;

  const clean = rawCategory.toLowerCase().trim();
  const foodKeywords = [
    'restaurant', 'cafe', 'coffee', 'bakery', 'dining', 'food', 'biryani', 
    'pizza', 'burger', 'dhaba', 'thali', 'mess', 'diner', 'kitchen', 'eatery',
    'bistro', 'bar', 'pub', 'lounge', 'brewery', 'roaster', 'chai', 'tea',
    'boba', 'cake', 'pastry', 'croissant', 'patisserie', 'dessert', 'sweets',
    'mithai', 'ice cream', 'caterer', 'catering'
  ];
  return foodKeywords.some(kw => clean.includes(kw));
}

/**
 * Returns dynamic terminology based on the business category.
 * For restaurants/cafes: Menu, Dishes, Menu Items, Food, etc.
 * For other businesses: Catalogue, Products & Services, Catalogue Items, etc.
 */
export function getCatalogTerminology(rawCategory?: string) {
  const isFood = isFoodAndDiningBusiness(rawCategory);
  return {
    isFood,
    // Titles & Navigation
    navLabel: isFood ? 'Digital Menu' : 'Product Catalogue',
    sidebarLabel: isFood ? 'Menu Management' : 'Catalogue Management',
    mobileNavLabel: isFood ? 'Menu' : 'Catalogue',
    pageTitle: isFood ? 'Menu Management' : 'Catalogue Management',
    pageSubtitle: isFood 
      ? 'Manage your dishes, prices, and bestsellers. Changes update on your live QR menu instantly.'
      : 'Manage your products, services, offerings, and prices. Changes update on your live QR catalogue instantly.',
    
    // Nouns & Labels
    itemLabel: isFood ? 'Dish' : 'Product / Service',
    itemsLabel: isFood ? 'Dishes' : 'Products & Services',
    totalItemsLabel: isFood ? 'Total Dishes' : 'Total Items / Services',
    addItemLabel: isFood ? 'Add New Dish' : 'Add New Item / Service',
    editItemLabel: isFood ? 'Edit Dish' : 'Edit Item / Service',
    createItemButton: isFood ? 'Create Dish' : 'Create Item / Service',
    addFirstItemButton: isFood ? 'Add Your First Dish' : 'Add Your First Item',
    itemNamePlaceholder: isFood ? 'e.g. Special Butter Paneer' : 'e.g. Premium Hair Spa / Deluxe AC Service',
    itemDescPlaceholder: isFood ? 'Ingredients, preparation, flavor profile...' : 'Product details, service duration, inclusions...',
    searchPlaceholder: isFood ? 'Search dishes...' : 'Search products & services...',
    deleteConfirmText: isFood ? 'Are you sure you want to remove this dish from your menu?' : 'Are you sure you want to remove this item from your catalogue?',
    
    // Categories
    categoriesLabel: isFood ? 'Categories' : 'Catalogue Sections',
    allCategoryLabel: isFood ? 'All Dishes' : 'All Offerings',
    
    // Toggles & Flags
    liveToggleLabel: isFood ? 'Show on Live Menu' : 'Show in Live Catalogue',
    liveToggleDesc: isFood ? 'Visible to customers scanning the QR code' : 'Visible to customers browsing your QR catalogue',
    bestsellerLabel: isFood ? 'Bestseller Tag' : 'Featured Tag',
    bestsellerBadge: isFood ? 'Bestseller' : 'Featured',
    bestsellerDesc: isFood ? 'Highlight with special recommendation badge' : 'Highlight as a top recommended offering',
    
    // Empty & Helper states
    emptyTitle: isFood ? 'Create your first menu' : 'Create your digital catalogue',
    emptySubtitle: isFood 
      ? 'Your business currently has no menu items published. Add your signature dishes, starters, or drinks so customers can browse your menu when scanning your QR code.'
      : 'Your business currently has no catalogue items published. Add your products, packages, or services so customers can browse your catalogue when scanning your QR code.',
    selectToEditTitle: isFood ? 'Select a dish to edit' : 'Select an item to edit',
    selectToEditSubtitle: isFood ? 'Or click "Add New Dish" to add to your live menu.' : 'Or click "Add New Item" to add to your live catalogue.',
    
    // Metrics
    viewsMetricLabel: isFood ? 'Menu Views' : 'Catalogue Views',
    saveButtonLabel: isFood ? 'Save Menu' : 'Save Catalogue',
    savedButtonLabel: 'Saved',
    publicPageHeading: isFood ? 'Menu' : 'Catalogue',
  };
}
