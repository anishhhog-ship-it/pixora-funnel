export type PublicRatingRoute = 'feedback' | 'google' | 'unrated';

export function getPublicRatingRoute(rating: number): PublicRatingRoute {
  if (rating >= 1 && rating <= 3) return 'feedback';
  if (rating >= 4 && rating <= 5) return 'google';
  return 'unrated';
}

export function isPrivateFeedbackRating(rating: number): boolean {
  return getPublicRatingRoute(rating) === 'feedback';
}

export function isGoogleReviewRating(rating: number): boolean {
  return getPublicRatingRoute(rating) === 'google';
}
