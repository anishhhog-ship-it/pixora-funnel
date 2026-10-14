export interface CategoryReviewItem {
  category: string;
  subcategories: string[];
  reviews: string[];
}

export const MASSIVE_CATEGORY_REVIEWS: Record<string, CategoryReviewItem> = {
  clothes: {
    category: 'Clothes Stores',
    subcategories: ['fashion', 'apparel', 'boutique', 'ethnic', 'sarees', 'suits', 'menswear', 'womenswear', 'tailor', 'garments', 'clothing'],
    reviews: [
      "Outstanding collection of clothing at {biz}! The fabric quality is top-notch, breathable, and every stitch is done to perfection. The staff helped me pick the right size with so much patience.",
      "Loved shopping at {biz} for ethnic and modern wear. The trial rooms were spotless, and the fitting was spot on without needing any alterations.",
      "A true hidden gem for fashion enthusiasts. Trendy designs, fair pricing, and excellent garment durability even after multiple washes.",
      "The sales team at {biz} has a remarkable sense of style. They gave me great pairing advice and made the entire shopping experience enjoyable and quick.",
      "High-end boutique feel without the exorbitant price tags. The fabric feels luxurious against the skin and their seasonal drops are always on point.",
      "Purchased festive outfits for the entire family at {biz}. Every single piece fit impeccably and drew compliments throughout the celebrations.",
      "From casual everyday wear to formal evening attire, {biz} has an unmatched selection. Great color palette and very comfortable fabrics.",
      "I was amazed by the variety of designer kurtas and suits at {biz}. Premium cloth material, rich textures, and very reasonable pricing.",
      "The master tailor and alteration staff at {biz} are wizards. Adjusted my blazer within thirty minutes with flawless craftsmanship.",
      "Hands down the best clothing store in the area. Fresh collections every month, polite attendants, and very well-organized racks.",
      "The quality of linen and pure cotton shirts at {biz} is unbeatable. Super breathable for warm weather and fits like bespoke tailoring.",
      "Shopping for wedding wear can be overwhelming, but {biz} made it effortless. Courteous staff, zero rush, and exceptional design aesthetics.",
      "I really appreciate the size inclusivity and diverse styling options at {biz}. Found exactly what I was looking for in minutes.",
      "Exquisite embroidery work and heavy silks that look royalty-grade. Truly impressed by the craftsmanship at {biz}.",
      "The ambiance inside {biz} is so pleasant with spacious trial rooms and warm lighting that shows true colors accurately.",
      "Their seasonal winter and summer wear collections are always ahead of the trends. {biz} is now our family's permanent clothing store.",
      "Great exchange policy and transparent billing. The sales team at {biz} genuinely wants you to look your best rather than just making a sale.",
      "I get asked where I got my outfit every time I wear pieces from {biz}. Super flattering fits and durable stitching.",
      "Superb collection of formal trousers and custom-fit shirts at {biz}. Perfect for daily office wear and special presentations.",
      "A five-star shopping experience from the moment I entered {biz}. Beautiful presentation, organized displays, and top-tier fabric feel.",
      "Their bridal and groom collection is beyond stunning. Rich royal colors, intricate handwork, and personalized attention throughout.",
      "Excellent value for money! The garment finishing at {biz} rivals international luxury brands at a fraction of the cost.",
      "Staff was quick to suggest combinations and accessories that complemented my outfit perfectly. Kudos to {biz}!",
      "I love how neatly every collection is categorized at {biz}. Easy to browse, hassle-free checkout, and great packaging."
    ]
  },

  perfumes: {
    category: 'Perfume Stores',
    subcategories: ['perfume', 'fragrance', 'attar', 'oud', 'scent', 'cologne', 'aroma', 'parfum', 'deodorant'],
    reviews: [
      "Incredible selection of long-lasting fragrances and artisanal attars at {biz}! The projection and sillage are beastly — still smelling fresh on my clothes after 14 hours.",
      "The fragrance specialists at {biz} know their notes inside out. They guided me through woody, floral, and oriental accords until I found my exact signature scent.",
      "Authentic designer perfumes and rich alcohol-free attars. Generous tester experience without any pressure to buy. Beautiful packaging too!",
      "I am completely hooked on their oud and amber blends. Unique fragrances that you won't easily find in mainstream department stores.",
      "The scent from {biz} lingers gracefully throughout the entire day. Top marks for authenticity, bottle presentation, and genuine customer care.",
      "Best perfume boutique in town! The staff let me test multiple blends patiently on scent strips and explained the dry-down stages in detail.",
      "I receive endless compliments whenever I wear the fragrance I bought from {biz}. Sophisticated, long-lasting, and never gives a headache.",
      "Huge variety of Eau de Parfum, roll-ons, and natural concentrated oils. {biz} is a heaven for true fragrance collectors.",
      "Top-tier packaging and atomizers that mist like luxury European bottles. The scent transition from citrus top to warm musky base is divine.",
      "Finally found pure authentic Dehn al Oud and white musk at {biz}. No harsh synthetic chemicals, just pure olfactory bliss.",
      "The gifting sets at {biz} are thoughtfully curated and look ultra-luxurious. The recipient was thrilled with the presentation and aroma.",
      "Exceptional longevity on skin and fabric alike. I washed my shirt and could still detect the subtle base note of the {biz} perfume!",
      "They have modern French designer clones and traditional oriental masterpieces under one roof. Friendly owner with immense knowledge.",
      "Every perfume enthusiast needs to visit {biz}. They don't just sell scents; they educate you on fragrance layering and skin chemistry.",
      "Very fair pricing for genuine, high-concentration perfume oils. Highly recommended for daily wear and grand evening parties.",
      "Loved the sample bottles they gave me to test at home. That gave me full confidence to buy the 100ml bottle. Outstanding service at {biz}!",
      "Fresh aquatic scents that beat the summer heat effortlessly. The longevity easily surpasses 10 hours of active wear.",
      "Sophisticated bottle aesthetics, magnetic caps, and mesmerizing juice inside. {biz} sets the gold standard for perfume shops.",
      "Warm spicy gourmand notes that smell like pure luxury. My favorite winter fragrance discovery from {biz} without a doubt.",
      "A truly five-star sensory experience. The boutique smells heavenly the second you walk through the door of {biz}."
    ]
  },

  offices: {
    category: 'Offices & Workspaces',
    subcategories: ['office', 'coworking', 'workspace', 'corporate', 'consultancy', 'consulting', 'agency', 'it', 'software', 'hub', 'business center'],
    reviews: [
      "Exceptional professional workspace at {biz} with high-speed fiber internet, ergonomic chairs, and whisper-quiet work zones. Perfect environment for focused execution.",
      "The conference rooms and video booth facilities at {biz} are equipped with state-of-the-art tech. Impressed our international clients during board meetings.",
      "Flawless building management, round-the-clock security, and pristine cleanliness. The cafeteria and fresh coffee amenities make workdays a pleasure.",
      "A prime business address that elevates our corporate brand identity. Prompt facility maintenance team that solves any requirement in minutes.",
      "Highly productive corporate environment with abundant natural light, ample basement parking, and smooth access control at {biz}.",
      "The coworking culture and networking opportunities at {biz} are unmatched. Welcoming reception staff and seamless day-to-day operations.",
      "100% power backup and super-fast IT support. We never had a single minute of downtime during critical client deliverables.",
      "Modern aesthetic, soundproof phone pods, and spotless restrooms. You can tell the management at {biz} cares deeply about tenant comfort.",
      "Great community events and professional workshops organized regularly. It is more than an office; it's a thriving business ecosystem.",
      "The meeting rooms are easy to book, climate control is always comfortable, and front-desk personnel handle guest check-ins flawlessly.",
      "Our team's productivity has skyrocketed since moving our office to {biz}. Quiet, professional, and equipped with everything a growing company needs.",
      "Very flexible desk and private cabin plans. Transitioning our team here was smooth without any operational disruption.",
      "Centrally located with easy metro and highway connectivity. Our staff and visiting clients love the convenient commute to {biz}.",
      "Clean pantry with healthy snack options and top-quality espresso machines. The lounge area is great for informal brainstorming.",
      "Prompt housekeeping team that keeps every workstation sanitized and tidy throughout the workday. Outstanding corporate hygiene standards."
    ]
  },

  realestate: {
    category: 'Real Estate & Properties',
    subcategories: ['real estate', 'property', 'builder', 'realtor', 'housing', 'broker', 'developer', 'apartments', 'flats', 'plots', 'villas', 'commercial'],
    reviews: [
      "Most transparent and trustworthy real estate consultancy I have dealt with. Clear legal documentation, zero hidden charges, and realistic valuations at {biz}.",
      "They showed us verified residential properties matching our exact budget and lifestyle. Smooth registry and bank loan assistance from start to finish.",
      "Honest advisory with genuine market insights. The team at {biz} never pushed a bad property and patiently organized site visits across multiple weekends.",
      "Helped us close a prime commercial space deal with favorable lease terms. Highly professional team that respects your time and investment goals.",
      "Flawless handover and verified title deeds. If you want peace of mind when buying property, {biz} is the agency to trust completely.",
      "From initial site visit to final possession key handover, their executive guided us through every stamp duty and municipal approval step effortlessly.",
      "They helped us find our dream home in a secure, prime gated community. Clear answers to every query regarding RERA compliance and maintenance charges.",
      "Outstanding market research! The property they recommended three years ago has already delivered impressive capital appreciation. Thank you {biz}!",
      "Patient, respectful, and highly knowledgeable property advisors. They understood our family requirements and filtered out all the noise.",
      "Zero hassle with registry paperwork and builder-buyer agreements. Their legal team verified all documents thoroughly before taking any advance.",
      "Very professional handling of resale and rental properties. Screened reliable tenants for our apartment within two weeks of listing.",
      "They gave us honest pros and cons of each neighborhood without sugarcoating. Truly appreciate their integrity and professionalism at {biz}.",
      "The best property dealers in the city! Transparent negotiation, fair brokerage, and end-to-end assistance till utility transfers were complete.",
      "Punctual site visits with chauffeured property tours. They value customer convenience and provide realistic project completion timelines.",
      "Buying your first home can be stressful, but the team at {biz} held our hands throughout the entire loan and registry process. Five stars!"
    ]
  },

  restaurants: {
    category: 'Restaurants & Dining',
    subcategories: ['restaurant', 'dining', 'food', 'cuisine', 'eatery', 'dinner', 'lunch', 'biryani', 'kitchen'],
    reviews: [
      "An extraordinary dining experience at {biz}! Every dish was bursting with authentic flavors, served piping hot, and beautifully presented.",
      "The culinary standards and hospitality at {biz} are unmatched. The chef clearly puts soul into the food and the ambiance is so welcoming.",
      "Top-tier hygiene, attentive waitstaff, and incredible taste. The appetizers and desserts were the absolute highlight of our evening.",
      "Our family dinner was a complete hit thanks to {biz}. Generous portions, balanced seasoning, and very courteous table service.",
      "From mocktails to the main course, everything tasted fresh and made with premium ingredients. Will definitely be a regular here!"
    ]
  },

  cafes: {
    category: 'Cafes & Bakeries',
    subcategories: ['cafe', 'coffee', 'bakery', 'bistro', 'brew', 'espresso', 'pastry', 'cakes', 'tea'],
    reviews: [
      "The coziest cafe in town! Smooth artisanal espresso, freshly baked pastries, and a relaxing vibe with great music.",
      "Loved working from {biz} today. Fast Wi-Fi, plenty of charging points, and the best cappuccino I have had all month.",
      "Their freshly baked sourdough and desserts are out of this world. Spotless cafe with warm, friendly baristas.",
      "Perfect spot for friendly catch-ups or solo reading sessions. The cold brew and signature cheesecakes are must-tries!"
    ]
  },

  salons: {
    category: 'Salons & Wellness',
    subcategories: ['salon', 'spa', 'beauty', 'hair', 'grooming', 'facial', 'massage', 'nails', 'barber'],
    reviews: [
      "Exceptional grooming and hair styling at {biz}! The stylist listened carefully to what I wanted and executed it with precision.",
      "Pristine hygiene, sterilized tools, and a wonderfully relaxing spa atmosphere. Left feeling completely rejuvenated and refreshed.",
      "Best facial and skin treatment I have experienced. High-end products, gentle hands, and noticeable glow immediately after.",
      "Super polite and skilled staff who don't push unnecessary treatments. Fair pricing for a genuinely luxury salon experience."
    ]
  },

  healthcare: {
    category: 'Healthcare & Clinics',
    subcategories: ['clinic', 'doctor', 'hospital', 'dental', 'dentist', 'health', 'medical', 'physio', 'pharmacy'],
    reviews: [
      "Compassionate, thorough, and highly knowledgeable doctor at {biz}. Took time to explain the diagnosis and prescribed only what was necessary.",
      "Spotlessly clean clinic with minimal waiting times and gentle staff. Handled our consultation with utmost care and empathy.",
      "Modern diagnostic equipment and gentle treatment approach. Made what is usually an anxious visit completely comfortable and painless."
    ]
  },

  fitness: {
    category: 'Fitness & Gyms',
    subcategories: ['gym', 'fitness', 'workout', 'trainer', 'crossfit', 'yoga', 'pilates', 'training'],
    reviews: [
      "State-of-the-art workout equipment, spacious floor layout, and motivating trainers. Clean locker rooms and great workout energy!",
      "The trainers at {biz} provide personalized form corrections and tailored diet plans. Seeing real progress within my first month.",
      "Well-ventilated gym floor with plenty of free weights and cardio stations. The community vibe here keeps you coming back every single day."
    ]
  },

  electronics: {
    category: 'Electronics & Mobile Stores',
    subcategories: ['electronic', 'electronics', 'mobile', 'phone', 'laptop', 'computer', 'gadget', 'appliance', 'tv', 'ac', 'audio', 'earphones', 'headphones', 'smartwatch'],
    reviews: [
      "Best electronics and mobile store in the city! Got the latest smartphone at {biz} with an unbeatable launch discount and genuine brand warranty.",
      "The tech sales team at {biz} was extremely knowledgeable. Helped me compare laptops based on processor, RAM, and battery life without pushing the most expensive one.",
      "Fast screen and battery replacement service on my device. Completed in 45 minutes with genuine parts and a test warranty. Truly impressive at {biz}.",
      "Huge variety of genuine accessories, chargers, and tempered glasses. Authentic products, clean billing, and courteous customer support.",
      "Purchased home appliances including a smart TV and air conditioner from {biz}. Prompt same-day delivery and professional installation team.",
      "Transparent pricing with zero hidden insurance fees. They even transferred all my data from the old phone to the new one for free!",
      "Great exchange bonus on my older handset. The staff at {biz} made the trade-in valuation quick, fair, and seamless.",
      "Wide selection of audiophile headphones and wireless soundbars. The listening lounge lets you test sound fidelity before purchasing."
    ]
  },

  jewellery: {
    category: 'Jewellery & Luxury Boutiques',
    subcategories: ['jewellery', 'jewelry', 'gold', 'diamond', 'silver', 'ornaments', 'hallmarked', 'bridal', 'necklaces', 'rings', 'bangles', 'polki', 'kundan'],
    reviews: [
      "Exquisite bridal jewellery collection at {biz}! The 916 BIS Hallmarking and certified diamond reports gave us complete peace of mind.",
      "The master karigars at {biz} crafted our custom engagement ring exactly to specification. Flawless finishing and brilliant diamond clarity.",
      "Transparent making charges and live gold rate calculation right before your eyes. Our family has trusted {biz} for three generations.",
      "The showroom ambiance is royal and welcoming. Attendants brought out countless trays of delicate daily wear gold chains without rushing us.",
      "Their antique gold and polki craftsmanship is breathtaking. Every piece feels like an heirloom art piece with exceptional attention to detail.",
      "Great buyback and exchange policy. They tested our old ornaments on computerized karat meters right in front of us with 100% honesty."
    ]
  },

  hotels: {
    category: 'Hotels, Resorts & Stays',
    subcategories: ['hotel', 'resort', 'stay', 'hospitality', 'rooms', 'suites', 'homestay', 'luxury stay', 'inn', 'lodging', 'palace'],
    reviews: [
      "Exceptional hospitality and luxurious rooms at {biz}! The bed was plush, climate control was silent, and the city view was breathtaking.",
      "Spotlessly clean bathroom, crisp linen, and lightning-fast room service. Front desk staff greeted us warmly and arranged early check-in effortlessly.",
      "The breakfast buffet at {biz} is lavish with live egg and dosa stations. High hygiene standards and very courteous stewards.",
      "Peaceful retreat away from the city hustle. Beautiful gardens, heated swimming pool, and rejuvenating spa treatments. Will return soon!",
      "We hosted our corporate offsite conference at {biz}. The banquet facilities, AV sound systems, and catering were managed to five-star standards."
    ]
  },

  automotive: {
    category: 'Automotive, Showrooms & Garages',
    subcategories: ['car', 'automotive', 'bike', 'showroom', 'garage', 'mechanic', 'service center', 'tyres', 'detailing', 'vehicles', 'spares'],
    reviews: [
      "Honest, skilled mechanics and transparent billing at {biz}! Diagnosed the engine noise accurately and delivered my car ahead of schedule.",
      "Took our vehicle for full periodic service and ceramic coating. The car looks showroom-fresh and drives like a dream.",
      "Zero unnecessary part replacement recommendations. They shared live video updates of old parts and explained every invoice item clearly.",
      "Smooth test drive and purchase experience at {biz}. The sales consultant handled RTO registration, insurance, and accessories paperwork smoothly."
    ]
  },

  education: {
    category: 'Education, Academies & Coaching',
    subcategories: ['education', 'coaching', 'academy', 'institute', 'school', 'college', 'tuition', 'classes', 'training', 'tutor', 'competitive'],
    reviews: [
      "Outstanding faculty at {biz} with deep subject mastery and patience! Simplified complex physics and mathematics concepts effortlessly.",
      "Personalized mentoring and regular mock test analysis helped my daughter improve her percentile significantly. Highly disciplined environment.",
      "Comprehensive, up-to-date study material and dedicated doubt-clearing sessions every weekend. The best coaching institute in the region."
    ]
  },

  retail: {
    category: 'Supermarkets & Grocery Retail',
    subcategories: ['retail', 'grocery', 'supermarket', 'store', 'provision', 'mart', 'daily essentials', 'kirana', 'packaged'],
    reviews: [
      "Spotless supermarket with ultra-fresh vegetables, organic staples, and every household essential in stock. Great aisle organization!",
      "Fast billing counters even during weekend rush hours. The staff at {biz} helps pack bags carefully and handles discounts efficiently."
    ]
  },

  homeservices: {
    category: 'Home Services, Hardware & Interior',
    subcategories: ['interior', 'home services', 'plumbing', 'electrical', 'painting', 'carpentry', 'contractor', 'hardware', 'renovation', 'sanitary'],
    reviews: [
      "Top-tier craftsmanship and punctual execution by the {biz} team! Renovated our modular kitchen and living room within the promised budget.",
      "Professional technicians who arrived on time, used quality branded materials, and cleaned the work area completely before leaving."
    ]
  }
};

/**
 * Standard industry categories available for Salesmen to select when registering a lead.
 * Directly mapped to our verified review library and visual funnel themes.
 */
export interface SalesCategoryOption {
  id: string;
  name: string;
  group: string;
  icon: string;
  description: string;
}

export const SALES_CATEGORY_OPTIONS: SalesCategoryOption[] = [
  { id: 'clothes', name: 'Clothes & Fashion Stores', group: 'Fashion & Lifestyle', icon: 'ShoppingBag', description: '24+ verified fabric, fitting, designer & ethnic reviews' },
  { id: 'perfumes', name: 'Perfume & Fragrance Stores', group: 'Fashion & Lifestyle', icon: 'Sparkles', description: '20+ verified oud, attar, longevity & scent reviews' },
  { id: 'jewellery', name: 'Jewellery & Luxury Boutiques', group: 'Fashion & Lifestyle', icon: 'Gem', description: 'Certified hallmarked gold, diamond & bridal reviews' },
  
  { id: 'offices', name: 'Offices & Corporate Workspaces', group: 'Corporate & Real Estate', icon: 'Building', description: '15+ high-speed Wi-Fi, conference & IT uptime reviews' },
  { id: 'realestate', name: 'Real Estate & Properties', group: 'Corporate & Real Estate', icon: 'Home', description: '15+ verified RERA, title deed, site visit & loan reviews' },
  { id: 'professional', name: 'Professional Services & CA', group: 'Corporate & Real Estate', icon: 'Briefcase', description: 'Taxation, legal, advisory & audit corporate reviews' },

  { id: 'restaurants', name: 'Restaurant & Fine Dining', group: 'Food & Hospitality', icon: 'Utensils', description: 'Taste, culinary standards, hospitality & ambience reviews' },
  { id: 'cafes', name: 'Cafes, Coffee & Bakeries', group: 'Food & Hospitality', icon: 'Coffee', description: 'Espresso, bakes, work-friendly cafe & dessert reviews' },
  { id: 'hotels', name: 'Hotels, Resorts & Stays', group: 'Food & Hospitality', icon: 'Bed', description: 'Plush suites, room service, buffet & hospitality reviews' },

  { id: 'salons', name: 'Salons, Spas & Beauty Care', group: 'Wellness & Healthcare', icon: 'Scissors', description: 'Hair styling, skin treatments, hygiene & spa reviews' },
  { id: 'healthcare', name: 'Healthcare, Clinics & Doctors', group: 'Wellness & Healthcare', icon: 'Stethoscope', description: 'Doctor diagnosis, gentle care, hygiene & pharmacy reviews' },
  { id: 'fitness', name: 'Fitness Centers & Gyms', group: 'Wellness & Healthcare', icon: 'Dumbbell', description: 'Trainers, workout equipment, diet & progress reviews' },

  { id: 'electronics', name: 'Electronics & Mobile Stores', group: 'Retail & Commerce', icon: 'Smartphone', description: 'Smartphones, warranty, gadgets, repairs & appliances' },
  { id: 'retail', name: 'Supermarkets & Grocery Retail', group: 'Retail & Commerce', icon: 'Store', description: 'Fresh groceries, aisle organization & quick billing' },

  { id: 'automotive', name: 'Automotive, Showrooms & Garages', group: 'Automotive & Services', icon: 'Car', description: 'Car servicing, mechanics, transparent billing & spares' },
  { id: 'homeservices', name: 'Home Services, Hardware & Interior', group: 'Automotive & Services', icon: 'Wrench', description: 'Interior renovation, modular kitchen & repair reviews' },
  { id: 'education', name: 'Education, Academies & Coaching', group: 'Education & Learning', icon: 'GraduationCap', description: 'Faculty, concept clarity, study material & mock exams' },
  { id: 'other', name: 'Other Local Business', group: 'Other Verticals', icon: 'Layers', description: 'Universal positive 5-star customer experience reviews' },
];

/**
 * Find matching reviews from the massive category library
 */
export function getReviewsForCategory(rawCategory: string = '', businessName: string = 'this business'): string[] {
  const normalized = (rawCategory || '').toLowerCase();
  
  for (const key of Object.keys(MASSIVE_CATEGORY_REVIEWS)) {
    const item = MASSIVE_CATEGORY_REVIEWS[key];
    const match = item.subcategories.some(sub => normalized.includes(sub)) || normalized.includes(key);
    if (match) {
      return item.reviews.map(r => r.replace(/{biz}/g, businessName));
    }
  }

  // Default fallback if no specific category matched
  return [];
}

