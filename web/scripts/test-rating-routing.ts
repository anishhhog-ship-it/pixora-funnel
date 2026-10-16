import assert from 'node:assert/strict';
import { getPublicRatingRoute, isGoogleReviewRating, isPrivateFeedbackRating } from '../src/services/ratingRouting.ts';

assert.equal(getPublicRatingRoute(1), 'feedback');
assert.equal(getPublicRatingRoute(2), 'feedback');
assert.equal(getPublicRatingRoute(3), 'feedback');
assert.equal(getPublicRatingRoute(4), 'google');
assert.equal(getPublicRatingRoute(5), 'google');
assert.equal(getPublicRatingRoute(0), 'unrated');
assert.equal(getPublicRatingRoute(6), 'unrated');
assert.equal(isPrivateFeedbackRating(3), true);
assert.equal(isPrivateFeedbackRating(4), false);
assert.equal(isGoogleReviewRating(4), true);
assert.equal(isGoogleReviewRating(2), false);
console.log('public rating routing: ok');
