export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  businessSlots?: number; // Allowed business locations (default: 1)
  createdAt: string;
};

export type BusinessTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
  coverImage: string;
  businessName: string;
  category: string;
  tagline: string;
  menuEnabled: boolean;
  servicesEnabled?: boolean;
  productsEnabled?: boolean;
  fontStyle?: string;
  overlayType?: 'dark' | 'light' | 'blur' | 'blurred' | 'gradient' | 'ambient';
  overlayOpacity?: number;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  postCompletionCTA?: string;
};

export type Business = {
  id?: string;
  businessId: string;
  ownerId?: string;
  userId?: string;
  slug: string;
  name: string;
  category: string;
  categoryConfidence?: 'high' | 'medium' | 'low';
  city: string;
  address?: string;
  website?: string;
  description?: string;
  logo: string;
  coverImage: string;
  customCoverImage?: string;
  visualThemeId?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  googleMapsUrl?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  planStatus?: 'trial' | 'active' | 'expired';
  trialExpiresAt?: string;
  qrScans?: number;
  reviewsCount?: number;
  rating?: number;
  menuEnabled?: boolean;
  servicesEnabled?: boolean;
  productsEnabled?: boolean;
  theme: BusinessTheme;
  createdAt: string;
};

export type Trial = {
  id: string;
  userId: string;
  businessId?: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'cancelled';
};

export type Funnel = {
  id: string;
  businessId: string;
  slug: string;
  qrUrl: string;
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
};

export type BusinessModel = {
  id: string;
  ownerId?: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  language?: string;
  menuEnabled?: boolean;
  servicesEnabled?: boolean;
  productsEnabled?: boolean;
  status: 'active' | 'trial' | 'inactive';
  createdAt: string;
  updatedAt?: string;
};

export type OnboardingModel = {
  userId: string;
  businessId?: string;
  status: 'draft' | 'in_progress' | 'completed';
  missingFields: string[];
  lastCompletedSection: string;
  completed: boolean;
  updatedAt: string;
};

export type Review = {
  reviewId: string;
  businessId: string;
  reviewerName: string;
  reviewerImage?: string;
  rating: number;
  text: string;
  date: string;
  source: 'google' | 'direct' | 'qr' | 'nfc';
  status: 'published' | 'pending';
  sentiment: 'positive' | 'neutral' | 'negative';
  replyStatus: 'replied' | 'auto_replied' | 'pending' | 'draft';
  replyText?: string;
  tags: string[];
};

export type MenuItem = {
  itemId: string;
  businessId?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isBestseller: boolean;
  isVegetarian?: boolean;
  isLive: boolean;
};

export type MenuCategory = {
  categoryId: string;
  businessId: string;
  name: string;
  order: number;
};

export type Customer = {
  customerId: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  visits?: number;
  totalVisits?: number;
  lastVisit?: string;
  totalSpend?: number;
  avgRating?: number;
  lastRating?: number;
  source?: 'google' | 'qr' | 'direct' | 'nfc';
  status?: 'regular' | 'new' | 'vip';
  tags?: string[];
  notes?: string;
};

export type QRCode = {
  qrId: string;
  businessId: string;
  name: string;
  location: string;
  shortLink?: string;
  shortCode?: string;
  scans: number;
  createdOn: string;
  status: 'active' | 'inactive';
};

export type QRCodeItem = QRCode;
export type AnalyticsData = Analytics;

export type Analytics = {
  googleReviews: number;
  googleReviewsGrowth: number;
  menuViews: number;
  menuViewsGrowth: number;
  qrScans: number;
  qrScansGrowth: number;
  reviewSubmissions: number;
  reviewSubmissionsGrowth: number;
  customers: number;
  customersGrowth: number;
  automatedReplies: number;
  automatedRepliesGrowth: number;
};
