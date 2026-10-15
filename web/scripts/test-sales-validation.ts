import assert from 'node:assert/strict';
import { boundedText, isAllowedGoogleMapsUrl, isAllowedGoogleReviewUrl, isHttpsUrl, isUuid } from '../src/services/salesValidation.ts';

assert.equal(isUuid('00000000-0000-4000-8000-000000000000'), true);
assert.equal(isUuid('not-an-id'), false);
assert.equal(boundedText('  customer  ', 20), 'customer');
assert.equal(boundedText('too long', 3), null);
assert.equal(isHttpsUrl('https://maps.google.com'), true);
assert.equal(isHttpsUrl('javascript:alert(1)'), false);
assert.equal(isAllowedGoogleMapsUrl('https://www.google.com/maps/place/Example/data=!abc'), true);
assert.equal(isAllowedGoogleMapsUrl('https://maps.app.goo.gl/example'), true);
assert.equal(isAllowedGoogleMapsUrl('https://goo.gl/maps/example'), true);
assert.equal(isAllowedGoogleMapsUrl('https://example.com/redirect'), false);
assert.equal(isAllowedGoogleMapsUrl('http://127.0.0.1/maps/place/test'), false);
assert.equal(isAllowedGoogleReviewUrl('https://search.google.com/local/writereview?placeid=ChIJexample'), true);
assert.equal(isAllowedGoogleReviewUrl('https://example.com/?placeid=ChIJexample'), false);
console.log('sales validation helpers: ok');
