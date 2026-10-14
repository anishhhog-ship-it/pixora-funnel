import { MenuItem, MenuCategory } from '@/types';

export interface CategoryPreset {
  category: string;
  coverImage: string;
  logo: string;
  tagline: string;
  keywords: string[];
  sampleCategories: string[];
  sampleItems: {
    name: string;
    description: string;
    price: number;
    image: string;
    isBestseller: boolean;
    isVegetarian: boolean;
  }[];
  reviewKeywords: string[];
  aiReviewTemplates: {
    base1: string;
    base2: string;
    base3: string;
  };
}

export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  'Restaurant & Fine Dining': {
    category: 'Restaurant & Fine Dining',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
    logo: '/placeholder.png',
    tagline: 'Experience authentic royal cuisine crafted with the finest ingredients.',
    keywords: ['Food Quality', 'Ambience', 'Staff Courteous', 'Fast Service', 'Thali'],
    sampleCategories: ['Starters', 'Main Course', 'Breads & Rice', 'Desserts', 'Beverages'],
    sampleItems: [
      {
        name: 'Royal Paneer Tikka Masala',
        description: 'Smoky cottage cheese cubes simmered in creamy tomato silk gravy.',
        price: 320,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Slow-Cooked Dal Makhani',
        description: 'Overnight slow-cooked black lentils finished with fresh cream & white butter.',
        price: 280,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Chef’s Imperial Grand Thali',
        description: 'Complete multi-course royal experience with delicacies, breads, and sweet.',
        price: 490,
        image: 'https://images.unsplash.com/photo-1544070002-3c1303cb5d88?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Garlic Butter Chur Chur Naan',
        description: 'Flaky layered clay-oven flatbread topped with toasted garlic and melted butter.',
        price: 110,
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Dal Makhani & Ambience', 'Paneer Tikka & Service', 'Royal Thali & Hospitality'],
    aiReviewTemplates: {
      base1: 'Outstanding dining experience at {biz}! The food was absolutely exquisite, ambience was serene and luxurious, and the hospitality made us feel like royalty. A must-visit 5-star gem!',
      base2: 'Had one of the best meals recently at {biz}. Every single dish was bursting with authentic flavors and prepared with incredible care. Staff was very attentive and courteous. 5 stars all the way!',
      base3: 'Exceptional food quality, impeccably clean atmosphere, and lightning-fast service at {biz}. Highly recommend to anyone looking for fine dining excellence!'
    }
  },

  'Artisanal Cafe & Bakery': {
    category: 'Artisanal Cafe & Bakery',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop',
    tagline: 'Single-origin espresso, freshly baked sourdough, and artisanal patisserie.',
    keywords: ['Espresso & Brews', 'Cozy Vibe', 'Fresh Pastries', 'Avocado Toast', 'Work Friendly'],
    sampleCategories: ['Specialty Coffee', 'Artisan Bakery', 'All-Day Brunch', 'Iced Drinks'],
    sampleItems: [
      {
        name: 'Signature Flat White',
        description: 'Double ristretto with micro-foamed velvety whole milk from local dairy.',
        price: 240,
        image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Sourdough Avocado Tartine',
        description: 'Hass avocado mash, cherry tomatoes, feta crumble, and chili flakes on fresh sourdough.',
        price: 360,
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'French Butter Croissant',
        description: 'Freshly baked flaky Parisian pastry with French Isigny Ste Mère butter.',
        price: 190,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Cascara Cold Brew & Tonic',
        description: '18-hour slow cold brew steeped coffee infused with aromatic botanicals and tonic.',
        price: 260,
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Specialty Coffee & Flat White', 'Avocado Toast & Sourdough', 'Cozy Ambience & Wi-Fi'],
    aiReviewTemplates: {
      base1: 'The perfect coffee haven at {biz}! Incredible single-origin brews, heavenly fresh croissants, and a wonderfully relaxed vibe. Can’t wait to come back regularly!',
      base2: 'Best artisanal cafe in town! The coffee was smooth and fragrant, brunch was fresh and delicious, and the staff are super friendly. 5/5 stars without question.',
      base3: 'Loved everything about {biz}. Aesthetic interiors, cozy seating, fast Wi-Fi, and phenomenal coffee. Hands down my favorite spot!'
    }
  },

  'Beauty Salon & Spa': {
    category: 'Beauty Salon & Spa',
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop',
    tagline: 'Transformative hair rituals, glowing skincare, and relaxing holistic spa therapies.',
    keywords: ['Expert Stylist', 'Hydra Facial', 'Hair Spa', 'Clean & Sanitized', 'Relaxing Vibe'],
    sampleCategories: ['Hair Rituals', 'Skin & Facials', 'Nail Lounge', 'Body Wellness & Spa'],
    sampleItems: [
      {
        name: 'Keratin Smoothing Infusion',
        description: 'Intense anti-frizz smoothing treatment giving mirror shine and softness for 4+ months.',
        price: 3499,
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'O3+ Hydra Glow Facial',
        description: 'Deep pore vacuum suction, botanical enzyme peel, and cryo-infusion glow mask.',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Aroma De-Stress Back Massage',
        description: '45-minute hot stone and lavender essential oil relaxation therapy.',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      },
      {
        name: 'Luxury Gel Manicure & Nail Art',
        description: 'Cuticle restoration, soothing hand soak, and custom hand-painted nail artistry.',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Hydra Facial & Skin Glow', 'Hair Styling & Keratin', 'Relaxing Ambience & Staff Care'],
    aiReviewTemplates: {
      base1: 'Left {biz} feeling completely renewed and pampered! The therapist took incredible care, hygiene standards were immaculate, and results were spectacular.',
      base2: 'Hands down the best salon & spa experience! Staff were warm and professional, the styling was flawless, and the ambience was so serene. Highly recommend to everyone.',
      base3: '5-star service from beginning to end at {biz}. My hair has never looked shinier and healthier. You’ve gained a loyal customer for life!'
    }
  },

  'Dental & Healthcare Clinic': {
    category: 'Dental & Healthcare Clinic',
    coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=200&h=200&fit=crop',
    tagline: 'Advanced painless dentistry, cosmetic smile design, and gentle family dental care.',
    keywords: ['Painless Treatment', 'Friendly Doctors', 'Zero Waiting Time', 'Modern Clinic', 'Invisalign'],
    sampleCategories: ['Smile Aesthetics', 'Preventive Care', 'Aligners & Braces', 'Implants'],
    sampleItems: [
      {
        name: 'Laser Teeth Whitening',
        description: 'Instant 4-shade smile brightening with gentle sensitivity protection.',
        price: 4500,
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Comprehensive Dental Health Checkup',
        description: 'Digital intra-oral scanning, 3D imaging, ultrasonic scaling, and personalized consult.',
        price: 800,
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Clear Aligner Scan & Consultation',
        description: '3D virtual smile simulation showing planned tooth movement and aligner timeline.',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Painless Cleaning & Scaling', 'Gentle Doctor & Clean Clinic', 'Smile Design & Whitening'],
    aiReviewTemplates: {
      base1: 'Outstanding experience at {biz}! I was nervous before my appointment, but the doctor was so gentle, patient, and completely painless. State-of-the-art clinic and wonderful staff.',
      base2: 'Truly 5-star healthcare at {biz}. Ultra-clean, modern equipment, transparent consultation, and zero wait time. Best dental clinic in the city!',
      base3: 'Highly professional and courteous team at {biz}. Explained every step clearly and delivered wonderful results for my smile. Would recommend to all friends and family!'
    }
  },

  'Hotel, Resort & Homestay': {
    category: 'Hotel, Resort & Homestay',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&h=200&fit=crop',
    tagline: 'Boutique hospitality, tranquil luxury suites, and unforgettable getaway experiences.',
    keywords: ['Luxury Rooms', 'Stunning Pool', 'Courteous Staff', 'Scenic Views', 'Breakfast Spread'],
    sampleCategories: ['Stay & Suites', 'Dining & Rooftop', 'Wellness & Spa', 'Experiences'],
    sampleItems: [
      {
        name: 'Royal Heritage Suite',
        description: 'Spacious 650 sq ft sanctuary with private balcony, king plush bed, and soaking tub.',
        price: 7999,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Sunset Rooftop Dinner for Two',
        description: '4-course candlelit dinner with panoramic skyline views and private butler service.',
        price: 3500,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Poolside Cabana Day Pass',
        description: 'All-day access to infinity pool, sunbed cabana, fresh mocktails, and finger bites.',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Suite Comfort & Cleanliness', 'Scenic Views & Pool', 'Exemplary Hospitality & Butler Service'],
    aiReviewTemplates: {
      base1: 'A truly memorable stay at {biz}! The rooms were impeccably appointed, staff were exceptionally courteous, and the atmosphere was pure serenity. Can’t wait to visit again!',
      base2: '5-star hospitality at its finest! From seamless check-in to delectable dining and scenic views, {biz} exceeded all our expectations. Highly recommended!',
      base3: 'The perfect luxury getaway. Beautiful property, pristine rooms, delicious breakfast, and warmest staff. Thank you {biz} for a wonderful experience!'
    }
  },

  'Retail Store & Luxury Boutique': {
    category: 'Retail Store & Luxury Boutique',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop',
    tagline: 'Curated artisanal collections, bespoke tailoring, and timeless luxury wardrobe.',
    keywords: ['Unique Collection', 'Helpful Staff', 'Fabric Quality', 'Bespoke Fit', 'Packaging'],
    sampleCategories: ['New Arrivals', 'Signature Ensembles', 'Accessories & Leather', 'Gift Sets'],
    sampleItems: [
      {
        name: 'Handcrafted Silk Festive Kurta',
        description: 'Pure Chanderi silk with subtle hand embroidery and mother-of-pearl buttons.',
        price: 4800,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Artisanal Italian Leather Wallet',
        description: 'Full-grain vegetable-tanned leather with 8 card slots and currency sleeve.',
        price: 1850,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=400&fit=crop',
        isBestseller: false,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Fabric Quality & Fitting', 'Curated Collection & Variety', 'Polite Staff & Assistance'],
    aiReviewTemplates: {
      base1: 'Such a delightful shopping experience at {biz}! Exquisite designs, premium fabric quality, and staff who genuinely understand fashion and styling.',
      base2: 'One of the finest boutiques I have visited! Unique collections, gorgeous packaging, and very helpful team. Found exactly what I was looking for. 5 stars!',
      base3: 'Top-tier retail experience at {biz}. From the moment you walk in, the store aesthetic and curated pieces speak for themselves. Highly recommended!'
    }
  },

  'Fitness Studio & Gym': {
    category: 'Fitness Studio & Gym',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop',
    logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&h=200&fit=crop',
    tagline: 'High-intensity coaching, premier functional equipment, and results-driven training.',
    keywords: ['Certified Trainers', 'Clean & Spacious', 'Modern Equipment', 'Motivating Energy'],
    sampleCategories: ['Memberships', 'Personal Coaching', 'Recovery & Spa', 'Nutrition'],
    sampleItems: [
      {
        name: 'Monthly Unlimited Elite Pass',
        description: 'Full gym floor access, steam room, group HIIT, and bi-weekly body composition scans.',
        price: 3000,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: '1-on-1 Transformation Training',
        description: '12 personalized strength & conditioning sessions with dedicated coach.',
        price: 8500,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Trainer Energy & Motivation', 'Clean Gym & Modern Machines', 'Transformation Results'],
    aiReviewTemplates: {
      base1: 'The best fitness studio hands down! {biz} has motivating coaches, top-tier equipment, and spotless hygiene. You will see results here!',
      base2: 'Incredible energy and community at {biz}. The personal trainers are knowledgeable, supportive, and push you to reach your goals. 5 stars!',
      base3: 'State-of-the-art gym with great music, pristine locker rooms, and fantastic trainers. Proud to train at {biz}!'
    }
  },

  'Bar, Pub & Brewery': {
    category: 'Bar, Pub & Brewery',
    coverImage: '/default-funnel-bg.jpg',
    logo: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&h=200&fit=crop',
    tagline: 'Artisanal craft brews, mixology cocktails, and electric weekend live music.',
    keywords: ['Craft Brews', 'Cocktail Mixology', 'Electric Vibe', 'DJ & Music', 'Great Starters'],
    sampleCategories: ['Craft Beer on Tap', 'Signature Cocktails', 'Bar Bites & Grills', 'Woodfired Pizza'],
    sampleItems: [
      {
        name: 'Hazy Mango IPA (Pint)',
        description: 'Brewed in-house with Citra and Mosaic hops, smooth tropical finish.',
        price: 360,
        image: 'https://images.unsplash.com/photo-1608270191763-71825cb51195?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Smoked Bourbon Old Fashioned',
        description: 'Bourbon, house bitters, demerara syrup, smoked with charred oak chips.',
        price: 490,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Craft Beer & Hops', 'Cocktail Mixology & Vibe', 'Music & Fast Service'],
    aiReviewTemplates: {
      base1: 'Phenomenal vibe and incredible craft beers at {biz}! Cocktails were masterfully mixed and food was super flavorful. Definitely our go-to spot!',
      base2: 'Best night out in town! Great music, friendly bartenders, and top-tier brews. 5 stars all the way for {biz}!',
      base3: 'Loved the energy, decor, and delicious bar bites at {biz}. Great crowd and prompt service. Highly recommend!'
    }
  },

  'Hardware & Power Tools': {
    category: 'Hardware & Power Tools',
    coverImage: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&h=800&fit=crop',
    logo: '/placeholder.png',
    tagline: 'Heavy duty construction hardware, genuine power tools & contractor fasteners.',
    keywords: ['Genuine Power Tools', 'Heavy Duty Stock', 'Contractor Rates', 'Fasteners & Screws', 'Helpful Advice'],
    sampleCategories: ['Power Tools', 'Hand Tools & Sets', 'Fasteners & Screws', 'Safety & PPE'],
    sampleItems: [
      {
        name: 'Bosch 13mm Impact Hammer Drill (650W)',
        description: 'Variable speed rotary hammer drill for masonry, metal & heavy concrete.',
        price: 3650,
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Stainless Steel 304 Anchor Bolts & Screws Set',
        description: 'Corrosion resistant high-tensile structural fasteners in standard metric sizes.',
        price: 450,
        image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Genuine Tools & Drill', 'Contractor Pricing & Bulk Stock', 'Fast Service & Advice'],
    aiReviewTemplates: {
      base1: 'Outstanding hardware store at {biz}! Got original branded tools at the best contractor rates in town. Staff knows technical details inside out.',
      base2: 'Found every single structural fastener and power tool I needed for our site. Excellent inventory and very honest pricing at {biz}!',
      base3: 'The best hardware store in the region. Smooth billing, quick loading, and genuine brand warranties. 5/5 stars!'
    }
  },

  'PVC Pipes & Sanitary': {
    category: 'PVC Pipes & Sanitary',
    coverImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&h=800&fit=crop',
    logo: '/placeholder.png',
    tagline: 'Leading distributor of PVC, CPVC & uPVC pipes, sanitary fittings & water storage tanks.',
    keywords: ['Leak-Proof Quality', 'All Pipe Sizes', 'Wholesale Rates', 'Fast Loading', 'Plumbing Expertise'],
    sampleCategories: ['CPVC Hot & Cold', 'uPVC Heavy Duty', 'Drainage & SWR', 'Water Storage Tanks'],
    sampleItems: [
      {
        name: 'CPVC Pro High Pressure Pipe (1-inch, 3m)',
        description: 'Chlorinated polyvinyl chloride pipe tested up to 28 bar pressure for hot/cold water.',
        price: 480,
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: 'Triple Layer Antibacterial Water Tank (1000L)',
        description: 'UV stabilized food-grade virgin plastic water storage tank with brass threaded outlet.',
        price: 5200,
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Durable PVC Pipes & Tanks', 'Wholesale Rates & Stock', 'Prompt Delivery & Loading'],
    aiReviewTemplates: {
      base1: 'Highest quality PVC and CPVC pipes available at {biz}! Supplied all plumbing fittings for our 3-story building without a single leak.',
      base2: 'Best wholesale rates for Astral & Finolex pipes. The team at {biz} accurately calculated the fitting count and saved us money!',
      base3: 'Excellent customer service, genuine heavy-duty pipe stock, and prompt delivery. Highly recommend {biz} to all plumbers and builders!'
    }
  },

  'Electronics & Home Appliances': {
    category: 'Electronics & Home Appliances',
    coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&h=800&fit=crop',
    logo: '/placeholder.png',
    tagline: 'Next-gen 4K Smart TVs, smartphones, laptops & energy-efficient home appliances.',
    keywords: ['Brand Warranty', 'Live Demos', 'Honest Advice', 'Exciting Offers', 'Fast Installation'],
    sampleCategories: ['Smart TVs & Audio', 'Smartphones & Laptops', 'Air Conditioners & Cooling', 'Kitchen Appliances'],
    sampleItems: [
      {
        name: '55" Ultra HD 4K Dolby Atmos Smart TV',
        description: 'Quantum Dot display with HDR10+ and 120Hz refresh rate.',
        price: 42990,
        image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      },
      {
        name: '1.5 Ton 5-Star Dual Inverter Split AC',
        description: 'Copper coil with fast cooling mode and stabilizer-free operation.',
        price: 37490,
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Live Product Demo & Advice', 'Best Price & Brand Warranty', 'Fast Delivery & Setup'],
    aiReviewTemplates: {
      base1: 'Incredible electronics showroom at {biz}! Staff patiently demonstrated all features and beat online prices with genuine warranty.',
      base2: 'Purchased our home appliances package from {biz}. Delivery and technician installation were done on the same day flawlessly!',
      base3: 'Trustworthy dealer for genuine tech and appliances. Transparent billing and great after-sales support. 5/5 stars!'
    }
  },

  'Healthcare Clinic & Diagnostics': {
    category: 'Healthcare Clinic & Diagnostics',
    coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
    logo: '/placeholder.png',
    tagline: 'Compassionate family healthcare, accurate diagnosis & state-of-the-art medical care.',
    keywords: ['Caring Doctor', 'Clean & Sanitized', 'Accurate Diagnosis', 'Minimal Wait Time', 'Quick Relief'],
    sampleCategories: ['Doctor Consultation', 'Pathology & Blood Tests', 'Pharmacy & Medicines', 'Health Checkups'],
    sampleItems: [
      {
        name: 'Comprehensive Health Screening Panel',
        description: 'CBC, Lipid Profile, Liver Function, Kidney Function & HbA1c screening with doctor review.',
        price: 1499,
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
        isBestseller: true,
        isVegetarian: true,
      }
    ],
    reviewKeywords: ['Doctor Consultation & Care', 'Hygiene & Clean Clinic', 'Quick Relief & Accurate Diagnosis'],
    aiReviewTemplates: {
      base1: 'Extremely caring and experienced doctor at {biz}. Took time to listen, explained everything calmly, and treatment provided quick relief.',
      base2: 'Immaculately clean clinic with polite staff and minimal waiting time. Grateful for the compassionate care at {biz}!',
      base3: 'The best family clinic in our locality. Accurate diagnosis, affordable consultation, and genuine care for patient wellbeing.'
    }
  }
};

export function getPresetForCategory(category?: string): CategoryPreset {
  if (!category) return CATEGORY_PRESETS['Restaurant & Fine Dining'];
  // Fuzzy match
  const match = Object.keys(CATEGORY_PRESETS).find(
    k => k.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(k.toLowerCase())
  );
  return match ? CATEGORY_PRESETS[match] : CATEGORY_PRESETS['Restaurant & Fine Dining'];
}
