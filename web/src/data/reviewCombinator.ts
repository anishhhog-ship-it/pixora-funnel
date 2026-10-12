export const REVIEW_FRAGMENTS = {
  openings: [
    "I had an absolutely wonderful experience at {biz}.",
    "Visiting {biz} was a complete delight from start to finish.",
    "I can't say enough good things about my time at {biz}.",
    "If you're looking for excellence, {biz} is the place to go.",
    "My visit to {biz} completely exceeded all my expectations.",
    "I am so glad I decided to give {biz} a try.",
    "What a fantastic discovery {biz} turned out to be!",
    "I’ve visited many places, but {biz} truly stands out.",
    "From the moment I arrived at {biz}, I was impressed.",
    "I had heard great things about {biz}, and they were all true.",
    "There is no better place in town than {biz}.",
    "My experience with {biz} was nothing short of spectacular.",
    "I’m genuinely blown away by the standards at {biz}.",
    "Such a flawless and refreshing experience at {biz}.",
    "I rarely leave reviews, but {biz} absolutely deserves one.",
    "A massive shoutout to the amazing team at {biz}.",
    "I was thoroughly impressed by everything at {biz}.",
    "Just wrapped up an incredible visit to {biz}.",
    "If you haven't been to {biz} yet, you are missing out.",
    "Everything about {biz} screams high quality and care.",
    "What a remarkably pleasant experience at {biz}!",
    "I am completely satisfied with my visit to {biz}.",
    "Top-notch experience across the board at {biz}.",
    "I can confidently say that {biz} is my new favorite spot.",
    "Absolutely stellar service and atmosphere at {biz}.",
    "It’s rare to find a place as consistently great as {biz}.",
    "My expectations were high, but {biz} still managed to surpass them.",
    "A truly memorable and wonderful visit to {biz}.",
    "I always leave {biz} feeling incredibly happy and satisfied.",
    "There’s a reason {biz} is so highly rated!",
    "I am absolutely thrilled with my experience at {biz}.",
    "No one does it quite like the folks at {biz}.",
    "Such a welcoming and professional environment at {biz}.",
    "I was treated like absolute royalty at {biz}.",
    "Perfection is hard to achieve, but {biz} comes incredibly close.",
    "I’m always amazed by the level of dedication at {biz}.",
    "An effortlessly perfect experience today at {biz}.",
    "I couldn’t have asked for a better time at {biz}.",
    "Wow! {biz} really knows how to deliver a premium experience.",
    "I highly respect the consistency and quality of {biz}."
  ],
  bodies: [
    "The service was impeccable and the staff went above and beyond.",
    "Everything was handled with so much care and attention to detail.",
    "The quality of what they offer is truly unmatched in the area.",
    "The team is incredibly knowledgeable, polite, and welcoming.",
    "You can really tell that customer satisfaction is their top priority.",
    "The atmosphere was clean, inviting, and wonderfully arranged.",
    "Every little detail was thoughtfully executed.",
    "I was particularly impressed by how fast and efficient the service was.",
    "The overall vibe was fantastic and made me feel right at home.",
    "They really took the time to ensure everything was perfect.",
    "The staff greeted me with warm smiles and were so helpful.",
    "I appreciate the high hygiene standards and immaculate presentation.",
    "The entire process was smooth, hassle-free, and enjoyable.",
    "Their professionalism and expertise really shine through.",
    "It's clear that the management cares deeply about their patrons.",
    "I felt valued and appreciated throughout my entire visit.",
    "The attention to customer needs here is simply extraordinary.",
    "Everything was delivered exactly as promised, if not better.",
    "I love how beautifully everything is maintained and managed.",
    "The promptness and courtesy of the team were outstanding.",
    "They answered all my questions and made great recommendations.",
    "The pricing is totally justified by the incredible quality provided.",
    "It was a breath of fresh air to see such dedicated service.",
    "They made sure I was comfortable and well taken care of at all times.",
    "The positive energy and enthusiasm of the staff are contagious.",
    "I was amazed by the variety and the premium feel of everything.",
    "They truly understand how to create a memorable customer journey.",
    "There was absolutely no compromise on quality or service.",
    "The environment is so relaxing and perfectly suited for a great time.",
    "Their commitment to excellence is obvious in every interaction.",
    "I loved the modern touch and the flawless execution.",
    "They went out of their way to accommodate my specific requests.",
    "The standard of excellence here is something others should learn from.",
    "I felt completely at ease thanks to their wonderful hospitality.",
    "The authenticity and charm of this place are hard to beat.",
    "They deliver a five-star experience without any pretentiousness.",
    "I was deeply impressed by the passion they put into their work.",
    "Every moment spent here felt premium and worthwhile.",
    "They strike the perfect balance between professional and friendly.",
    "The care they put into their craft is incredibly apparent."
  ],
  closings: [
    "I will definitely be returning very soon!",
    "Highly recommended to all my friends and family.",
    "A solid 5-star rating from me without any hesitation.",
    "I can’t wait for my next visit.",
    "Do yourself a favor and check this place out.",
    "I will definitely be making this a regular spot for me.",
    "Kudos to the entire team for a job well done.",
    "You’ve just earned yourself a loyal customer for life.",
    "I will be recommending this to everyone I know.",
    "Thank you for such a beautiful and seamless experience.",
    "I am already looking forward to coming back.",
    "They have won me over completely.",
    "If I could give more than 5 stars, I absolutely would.",
    "Keep up the fantastic work!",
    "This was easily one of the best experiences I’ve had all year.",
    "I leave completely satisfied and happy.",
    "A truly flawless visit that made my day.",
    "I wouldn't hesitate to recommend them to anyone.",
    "Absolutely worth every penny and minute spent.",
    "I’m so grateful to have found this gem.",
    "Thank you to the wonderful staff for making it special.",
    "I'll be bringing my colleagues here next time.",
    "A big thumbs up from a very happy customer.",
    "They deserve all the success and positive reviews coming their way.",
    "This place is an absolute must-visit.",
    "I couldn’t be happier with the outcome.",
    "It’s an easy 10/10 from my side.",
    "I am leaving with a big smile on my face.",
    "Thank you for consistently maintaining such high standards.",
    "I'll definitely spread the word about this amazing place.",
    "It just doesn’t get any better than this.",
    "Looking forward to experiencing this all over again.",
    "They really know how to win a customer's heart.",
    "It was an absolute pleasure from beginning to end.",
    "I highly urge anyone reading this to give them a try.",
    "Bravo to the management and the frontline staff!",
    "This experience exceeded all my hopes.",
    "I'll be counting the days until I can visit again.",
    "Easily the best decision I made today.",
    "Thank you for providing such a stellar service!"
  ]
};

/**
 * Generates dynamic, combinatorially unique reviews.
 * 40 openings * 40 bodies * 40 closings = 64,000 unique combinations per business!
 */
export function generateCombinatorialReviews(count: number, businessName: string, category?: string, highlight?: string): string[] {
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Pick random fragments
    const opening = REVIEW_FRAGMENTS.openings[Math.floor(Math.random() * REVIEW_FRAGMENTS.openings.length)];
    const body = REVIEW_FRAGMENTS.bodies[Math.floor(Math.random() * REVIEW_FRAGMENTS.bodies.length)];
    const closing = REVIEW_FRAGMENTS.closings[Math.floor(Math.random() * REVIEW_FRAGMENTS.closings.length)];
    
    // Inject the highlight / keyword if provided
    let specificDetail = '';
    if (highlight && highlight.trim().length > 0 && i === 0) {
      specificDetail = ` Especially loved: ${highlight.trim()}.`;
    } else if (category && Math.random() > 0.5) {
      // 50% chance to mention the category specifically to make it feel tailored
      specificDetail = ` One of the best ${category.toLowerCase()} spots around.`;
    }
    
    // Replace {biz} tag
    let reviewText = `${opening} ${body}${specificDetail} ${closing}`.replace(/{biz}/g, businessName);
    
    result.push(reviewText);
  }
  
  return result;
}
