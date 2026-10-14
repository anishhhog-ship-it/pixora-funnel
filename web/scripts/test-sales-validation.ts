import assert from 'node:assert/strict';
import { boundedText, isHttpsUrl, isUuid } from '../src/services/salesValidation.ts';

assert.equal(isUuid('00000000-0000-4000-8000-000000000000'), true);
assert.equal(isUuid('not-an-id'), false);
assert.equal(boundedText('  customer  ', 20), 'customer');
assert.equal(boundedText('too long', 3), null);
assert.equal(isHttpsUrl('https://maps.google.com'), true);
assert.equal(isHttpsUrl('javascript:alert(1)'), false);
console.log('sales validation helpers: ok');
