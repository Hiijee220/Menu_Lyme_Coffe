# Ordering and payments

Project: `menu-lyme-coffe`. Website: GitHub Pages in `Hiijee220/Menu_Lyme_Coffe`.

## Activation

1. Enable the **Anonymous** provider in Firebase Authentication. Existing Google admin sign-in remains in use.
2. Publish `firebase/firestore.rules` to this project's existing `(default)` database. The rules retain menu and admin access and add private customer orders, immutable item records, and public merchant payment instructions.
3. Sign in at `admin-transaksi.html`. Open **Pengaturan pemesanan & pembayaran**. Upload the merchant's real QR image and/or fill the merchant bank details. Enable the required payment methods. Cash needs no bank details.
4. Save settings with **Buka pemesanan online** enabled. This transaction adds only missing fallback catalog documents and never overwrites existing menu customizations. Ordering remains closed until the settings document exists and explicitly permits checkout.
5. Place a clearly marked test order and verify its receipt and status on a separate customer browser. Do not transfer actual money for a software test. After real QR/bank setup, the merchant must verify the recipient displayed by the payment app.

## Data and workflow

- `lymeCommerce/settings` contains merchant instructions and the open/closed switch. Anyone can read merchant instructions; only verified allowed admins may change them.
- `lymeOrders/{id}` contains the customer UID, name, table/takeaway choice, item options and notes, total, payment method, snapshot of merchant instructions, and order/payment statuses.
- An atomic checkout writes the order plus up to eight immutable item validation records at `lymeOrders/{id}/items/{0..7}`. Each record is price-checked against the authoritative menu, including availability, allowed options, and the Rp6,000 oat-milk addition. The parent requires all item records to be from the same request and owner, and its total to equal the exact item sum. This keeps rule evaluations and document-access calls within Firebase limits.
- Item validation records are not readable by clients or mutable after creation. A standalone item record cannot be reused by a later checkout because the parent requires the exact current server timestamp. Incomplete attempts never create a visible order.
- The browser saves a pending order ID before sending. A retry checks the same ID and does not create a second order if the first committed. The basket clears only after success.
- Customers can read only their own orders. Anonymous customer identity persists in that browser; clearing browser data or changing devices loses access to that anonymous history. Order IDs are not access tokens.
- Admins can read the latest 200 orders, search/filter, confirm payment, and move pending → preparing → ready → completed, or cancel. Completed requires paid. Ordered items, totals, and recipient snapshots cannot be edited after creation. Orders cannot be deleted through the client.
- QR and bank transfers are **manual merchant payments**, not an automatic payment gateway. The customer can submit a payment reference; this never marks the order paid. Admin must verify received funds. Cash is also marked paid by the cashier after receipt.
- Cancelling an already-paid order does not refund money. The UI instructs the customer to contact the cashier, and admins can record an explanation. Refunding is handled outside this app.

## Verification

Run `npm install` in `tests`, then `npm test` there (Node 20+ and Java 17+ for pinned Firebase CLI 14).

The emulator suite checks order creation, eight item variants, exact pricing/options, sold-out rejection, closed-store rejection, recipient matching, customer isolation, admin permissions, immutable financial records, atomic item validation, and payment/status transitions. UI integration is tested with an isolated simulated backend; simulated orders and payment details must never be published to production.
