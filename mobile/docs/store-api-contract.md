# Mobile store API contract

The mobile owner app calls the shared authenticated commerce endpoint used by
the web dashboard. It is kept behind `mobile/src/lib/mobileApi.ts`; the app does
not insert an order directly into a local table or claim success when the server
route is missing.

## `GET /api/commerce/catalog`

Returns active products with server-issued UUIDs, current prices, and inventory
availability. The app disables quantities when available stock is zero.

## `GET /api/commerce/orders`

Returns the authenticated customer's prior order requests.

## `POST /api/commerce/orders`

Requires the same bearer token and accepts:

```json
{
  "businessId": "business-uuid",
  "customerName": "Owner name",
  "customerEmail": "owner@example.com",
  "customerPhone": "+91...",
  "shippingAddress": "Street and building",
  "city": "City",
  "state": "State",
  "postalCode": "000000",
  "country": "India",
  "items": [{ "productId": "product-uuid", "quantity": 1 }],
  "paymentMethod": "manual",
  "notes": "Optional fulfilment notes"
}
```

The server verifies business membership, resolves product IDs from its canonical
catalog, calculates prices server-side, reserves stock, and creates a pending
order and its items. Payment remains pending admin review; the mobile app never
shows a paid or delivered state unless the server returns it.

Errors should return `{ "success": false, "error": "..." }` with an
appropriate 4xx/5xx status. The mobile app shows those errors and does not clear
the cart or display an order confirmation for an unsuccessful response.
