export interface GoogleBusinessDetails {
  placeId: string;
  name: string;
  category: string;
  categorySlug: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  openingHours?: string;
  photoUrl?: string;
  googleMapsUri?: string;
  reviewUrl?: string;
  source?: 'google_live_api' | 'smart_resolver_fallback';
  menuEnabled: boolean;
  servicesEnabled: boolean;
  productsEnabled: boolean;
}

// Preset samples across different local business verticals
const DIVERSE_MOCK_BUSINESSES: Record<string, GoogleBusinessDetails> = {
  restaurant: {
    placeId: 'place_your_business_01',
    name: 'Your Business',
    category: 'Pure Veg Restaurant & Fine Dining',
    categorySlug: 'Restaurant & Fine Dining',
    address: '12, Hawa Mahal Road, Badi Choupad',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    phone: '',
    website: 'https://yourbusiness.in',
    rating: 4.8,
    reviewCount: 1248,
    openingHours: 'Open now · 11:00 AM – 11:00 PM',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    menuEnabled: true,
    servicesEnabled: false,
    productsEnabled: false,
  },
  cafe: {
    placeId: 'place_cafe_royale_02',
    name: 'Cafe Royale Roastery',
    category: 'Artisanal Cafe & Bakery',
    categorySlug: 'Artisanal Cafe & Roastery',
    address: 'Plot 45, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    phone: '+91 98201 54321',
    website: 'https://caferoyale.in',
    rating: 4.7,
    reviewCount: 890,
    openingHours: 'Open now · 8:00 AM – 10:30 PM',
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
    menuEnabled: true,
    servicesEnabled: false,
    productsEnabled: false,
  },
  salon: {
    placeId: 'place_luxe_salon_03',
    name: 'Luxe Hair & Wellness Spa',
    category: 'Luxury Hair Salon & Spa',
    categorySlug: 'Salon & Luxury Spa',
    address: '100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    phone: '+91 99800 12345',
    website: 'https://luxespa.com',
    rating: 4.9,
    reviewCount: 640,
    openingHours: 'Open now · 9:30 AM – 8:30 PM',
    photoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
  },
  clinic: {
    placeId: 'place_apex_dental_04',
    name: 'Apex Dental Care & Implant Clinic',
    category: 'Dental Clinic & Care Centre',
    categorySlug: 'Clinic & Wellness Centre',
    address: '2nd Floor, Sunshine Complex, Model Town',
    city: 'Delhi',
    state: 'Delhi NCR',
    country: 'India',
    phone: '+91 98111 22334',
    website: 'https://apexdentalcare.in',
    rating: 4.9,
    reviewCount: 520,
    openingHours: 'Open now · 10:00 AM – 7:00 PM',
    photoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
  },
  gym: {
    placeId: 'place_ironpulse_gym_05',
    name: 'IronPulse Fitness & Strength Club',
    category: 'Fitness & Sports Club',
    categorySlug: 'Fitness & Sports Club',
    address: '80 Feet Main Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    phone: '+91 98450 67890',
    website: 'https://ironpulse.fitness',
    rating: 4.8,
    reviewCount: 430,
    openingHours: 'Open now · 6:00 AM – 10:00 PM',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    menuEnabled: false,
    servicesEnabled: true,
    productsEnabled: false,
  },
  retail: {
    placeId: 'place_aurelia_retail_06',
    name: 'Aurelia Lifestyle & Designer Boutique',
    category: 'Retail Boutique & Fashion',
    categorySlug: 'Retail Boutique & Lifestyle',
    address: 'Inner Circle, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    phone: '+91 98102 34567',
    website: 'https://aureliaboutique.in',
    rating: 4.6,
    reviewCount: 710,
    openingHours: 'Open now · 11:00 AM – 9:00 PM',
    photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    menuEnabled: false,
    servicesEnabled: false,
    productsEnabled: true,
  },
  hotel: {
    placeId: 'place_heritage_hotel_07',
    name: 'Heritage Palace Boutique Resort',
    category: 'Boutique Hotel & Stay',
    categorySlug: 'Boutique Hotel & Stay',
    address: 'Lake Pichola Road, Chandpole',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    phone: '+91 98290 11223',
    website: 'https://heritagepalaceresort.com',
    rating: 4.9,
    reviewCount: 1580,
    openingHours: 'Open 24 hours · Concierge available',
    photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    menuEnabled: true,
    servicesEnabled: true,
    productsEnabled: false,
  }
};

export interface GooglePlacesSearchResult {
  place: GoogleBusinessDetails;
  candidates: GoogleBusinessDetails[];
  isGoogleLive?: boolean;
  googleApiError?: { message: string; reason?: string; status?: string } | null;
  googleConsoleUrl?: string;
}

/**
 * Service to resolve a Google Business Profile / Google Maps URL into structured business details.
 * In production, this proxies to Google Places API (New) via server endpoints.
 * In development / mock mode, it uses deterministic URL parsing & realistic presets.
 */
export const googlePlacesService = {
  /**
   * Search and returns both primary place and candidate locations (for disambiguation)
   */
  searchBusiness: async (input: string): Promise<GooglePlacesSearchResult> => {
    const cleanInput = input.trim();

    if (!cleanInput) {
      throw new Error('Please enter a Google Maps profile link or search by business name.');
    }

    // Attempt server-side resolution with the official Google Places API (New)
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/places/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanInput, query: cleanInput }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.place) {
            const candidates =
              data.candidates && data.candidates.length > 0
                ? (data.candidates as GoogleBusinessDetails[])
                : [data.place as GoogleBusinessDetails];

            return {
              place: data.place as GoogleBusinessDetails,
              candidates,
              isGoogleLive: !!data.isGoogleLive,
              googleApiError: data.googleApiError,
              googleConsoleUrl: data.googleConsoleUrl,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Backend places resolution endpoint error, using smart resolver fallback:', e);
    }

    const single = await googlePlacesService.resolveBusinessLink(cleanInput);
    return {
      place: single,
      candidates: [single],
    };
  },

  /**
   * Resolves a public Google Maps / Business Profile link or business search term (returns first place)
   */
  resolveBusinessLink: async (input: string): Promise<GoogleBusinessDetails> => {
    const cleanInput = input.trim();

    if (!cleanInput) {
      throw new Error('Please enter a Google Maps profile link or search by business name.');
    }

    // Attempt server-side resolution with the official Google Places API (New)
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/places/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanInput, query: cleanInput }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.place) {
            return data.place as GoogleBusinessDetails;
          }
        }
      }
    } catch (e) {
      console.warn('Backend places resolution endpoint error, using smart resolver fallback:', e);
    }

    // Simulate network lookup delay (200ms) for realistic UX fallback
    await new Promise((res) => setTimeout(res, 200));

    return generateDynamicClientDetails(cleanInput);
  },

  /**
   * Retrieves place details by ID
   */
  getBusinessDetails: async (placeId: string): Promise<GoogleBusinessDetails | null> => {
    return generateDynamicClientDetails(placeId.replace(/^place_/, ''));
  }
};

function generateDynamicClientDetails(cleanInput: string): GoogleBusinessDetails {
  const lower = cleanInput.toLowerCase();

  // Detect City
  const cities: Record<string, { city: string; state: string; area: string }> = {
    mumbai: { city: 'Mumbai', state: 'Maharashtra', area: 'Plot 18, Commercial Avenue, Linking Road, Bandra West' },
    bombay: { city: 'Mumbai', state: 'Maharashtra', area: 'Plot 18, Commercial Avenue, Linking Road, Bandra West' },
    delhi: { city: 'New Delhi', state: 'Delhi NCR', area: 'Inner Circle, Connaught Place' },
    'new delhi': { city: 'New Delhi', state: 'Delhi NCR', area: 'Inner Circle, Connaught Place' },
    noida: { city: 'Noida', state: 'Uttar Pradesh', area: 'Sector 18 Commercial Center' },
    gurgaon: { city: 'Gurugram', state: 'Haryana', area: 'Cyber Hub, DLF Phase 2' },
    gurugram: { city: 'Gurugram', state: 'Haryana', area: 'Cyber Hub, DLF Phase 2' },
    bangalore: { city: 'Bengaluru', state: 'Karnataka', area: '100 Feet Road, Indiranagar' },
    bengaluru: { city: 'Bengaluru', state: 'Karnataka', area: '100 Feet Road, Indiranagar' },
    hyderabad: { city: 'Hyderabad', state: 'Telangana', area: 'Road No. 36, Jubilee Hills' },
    chennai: { city: 'Chennai', state: 'Tamil Nadu', area: '2nd Avenue, Anna Nagar West' },
    kolkata: { city: 'Kolkata', state: 'West Bengal', area: 'Park Street, Middleton Row' },
    pune: { city: 'Pune', state: 'Maharashtra', area: 'FC Road, Shivaji Nagar' },
    jaipur: { city: 'Jaipur', state: 'Rajasthan', area: 'MI Road, Near Panch Batti' },
    ahmedabad: { city: 'Ahmedabad', state: 'Gujarat', area: 'CG Road, Navrangpura' },
    surat: { city: 'Surat', state: 'Gujarat', area: 'Ghod Dod Road, Athwa' },
    chandigarh: { city: 'Chandigarh', state: 'Chandigarh UT', area: 'Sector 17 Commercial Plaza' },
    indore: { city: 'Indore', state: 'Madhya Pradesh', area: 'Vijay Nagar, Scheme 54' },
    bhopal: { city: 'Bhopal', state: 'Madhya Pradesh', area: 'MP Nagar, Zone II' },
    lucknow: { city: 'Lucknow', state: 'Uttar Pradesh', area: 'Hazratganj, MG Road' },
    kanpur: { city: 'Kanpur', state: 'Uttar Pradesh', area: 'Mall Road, Civil Lines' },
    nagpur: { city: 'Nagpur', state: 'Maharashtra', area: 'West High Court Road, Dharampeth' },
    patna: { city: 'Patna', state: 'Bihar', area: 'Frazer Road, Dak Bungalow Square' },
    vadodara: { city: 'Vadodara', state: 'Gujarat', area: 'RC Dutt Road, Alkapuri' },
    ludhiana: { city: 'Ludhiana', state: 'Punjab', area: 'Ferozepur Road, Sarabha Nagar' },
    agra: { city: 'Agra', state: 'Uttar Pradesh', area: 'Sanjay Place Commercial Hub' },
    varanasi: { city: 'Varanasi', state: 'Uttar Pradesh', area: 'Cantt Commercial Area, Mall Road' },
    nashik: { city: 'Nashik', state: 'Maharashtra', area: 'College Road, Gangapur Road' },
    rajkot: { city: 'Rajkot', state: 'Gujarat', area: 'Yagnik Road, Jagnath Plot' },
    amritsar: { city: 'Amritsar', state: 'Punjab', area: 'Mall Road, Lawrence Road' },
    coimbatore: { city: 'Coimbatore', state: 'Tamil Nadu', area: 'DB Road, RS Puram' },
    kochi: { city: 'Kochi', state: 'Kerala', area: 'Panampilly Nagar Main Avenue' },
    dehradun: { city: 'Dehradun', state: 'Uttarakhand', area: 'Rajpur Road Commercial Stretch' },
    goa: { city: 'Panaji', state: 'Goa', area: 'MG Road, Panjim Central' },
    udaipur: { city: 'Udaipur', state: 'Rajasthan', area: 'Lake Pichola Road, Chandpole' },
    jodhpur: { city: 'Jodhpur', state: 'Rajasthan', area: 'Residency Road, Sardarpura' },
    guwahati: { city: 'Guwahati', state: 'Assam', area: 'GS Road, Christian Basti' },
  };

  let city = 'Mumbai';
  let state = 'Maharashtra';
  let area = 'Plot 18, Commercial Avenue, Linking Road, Bandra West';

  for (const [key, info] of Object.entries(cities)) {
    if (new RegExp('\\b' + key + '\\b', 'i').test(lower)) {
      city = info.city;
      state = info.state;
      area = info.area;
      break;
    }
  }

  // Detect Category
  let category = 'Commercial Enterprise & Services';
  let categorySlug = 'Commercial Enterprise & Services';
  let photoUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop';
  let isFood = false;
  let isService = true;
  let isRetail = false;
  let openingHours = 'Open now · 9:30 AM – 7:30 PM';

  if (
    lower.includes('hotel') ||
    lower.includes('resort') ||
    lower.includes('select') ||
    lower.includes('suite') ||
    lower.includes('inn') ||
    lower.includes('stay') ||
    lower.includes('villa') ||
    lower.includes('palace')
  ) {
    category = 'Boutique Hotel, Resort & Stay';
    categorySlug = 'Boutique Hotel & Stay';
    isFood = true;
    isService = true;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop';
    openingHours = 'Open 24 hours · Concierge & front desk available';
  } else if (
    lower.includes('cafe') ||
    lower.includes('coffee') ||
    lower.includes('bakery') ||
    lower.includes('bake') ||
    lower.includes('roast') ||
    lower.includes('brew') ||
    lower.includes('tokai') ||
    lower.includes('tea') ||
    lower.includes('chai')
  ) {
    category = 'Artisanal Cafe & Bakery';
    categorySlug = 'Artisanal Cafe & Roastery';
    isFood = true;
    isService = false;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop';
    openingHours = 'Open now · 8:00 AM – 10:30 PM';
  } else if (
    lower.includes('salon') ||
    lower.includes('spa') ||
    lower.includes('hair') ||
    lower.includes('beauty') ||
    lower.includes('barber') ||
    lower.includes('parlour')
  ) {
    category = 'Luxury Hair Salon & Spa';
    categorySlug = 'Salon & Luxury Spa';
    isFood = false;
    isService = true;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop';
    openingHours = 'Open now · 9:30 AM – 8:30 PM';
  } else if (
    lower.includes('clinic') ||
    lower.includes('dental') ||
    lower.includes('dentist') ||
    lower.includes('doctor') ||
    lower.includes('hospital') ||
    lower.includes('health') ||
    lower.includes('pharma')
  ) {
    category = 'Clinic & Healthcare Centre';
    categorySlug = 'Clinic & Wellness Centre';
    isFood = false;
    isService = true;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop';
    openingHours = 'Open now · 10:00 AM – 7:30 PM';
  } else if (
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('workout') ||
    lower.includes('crossfit') ||
    lower.includes('sports')
  ) {
    category = 'Fitness & Sports Club';
    categorySlug = 'Fitness & Sports Club';
    isFood = false;
    isService = true;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop';
    openingHours = 'Open now · 6:00 AM – 10:00 PM';
  } else if (
    lower.includes('restaurant') ||
    lower.includes('dining') ||
    lower.includes('food') ||
    lower.includes('kitchen') ||
    lower.includes('dhaba') ||
    lower.includes('sweet') ||
    lower.includes('bistro')
  ) {
    category = 'Restaurant & Fine Dining';
    categorySlug = 'Restaurant & Fine Dining';
    isFood = true;
    isService = false;
    isRetail = false;
    photoUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop';
    openingHours = 'Open now · 11:00 AM – 11:00 PM';
  } else if (
    lower.includes('retail') ||
    lower.includes('store') ||
    lower.includes('shop') ||
    lower.includes('boutique') ||
    lower.includes('fashion') ||
    lower.includes('cloth') ||
    lower.includes('zara') ||
    lower.includes('jewel')
  ) {
    category = 'Retail Store & Boutique';
    categorySlug = 'Retail Boutique & Lifestyle';
    isFood = false;
    isService = false;
    isRetail = true;
    photoUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop';
    openingHours = 'Open now · 10:30 AM – 9:00 PM';
  }

  const cleanName = cleanInput.includes('http') ? 'Your Business' : cleanInput.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'your-business';

  return {
    placeId: `place_${slug}`,
    name: cleanName,
    category,
    categorySlug,
    address: `${area}, ${city}`,
    city,
    state,
    country: 'India',
    phone: '+91 98201 23456',
    website: `https://${slug}.in`,
    rating: 4.8,
    reviewCount: 1248,
    openingHours,
    photoUrl,
    googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + city)}`,
    reviewUrl: `https://search.google.com/local/writereview?placeid=place_${slug}`,
    menuEnabled: isFood,
    servicesEnabled: isService,
    productsEnabled: isRetail,
    source: 'smart_resolver_fallback',
  };
}
