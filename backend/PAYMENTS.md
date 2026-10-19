# Razorpay Test Mode

## Configuration

Keep the existing `backend/.env` and add the variables shown in `.env.example`.
Use Razorpay Test Mode credentials for `RAZORPAY_KEY_ID` and
`RAZORPAY_KEY_SECRET`. The secret is used only by the backend; checkout receives
the public key ID only. `RAZORPAY_WEBHOOK_SECRET` is optional for basic order
creation and signature verification; configure it only when enabling signed
webhook handling. Restart the backend after changing environment variables.

Shipping and tax are calculated on the backend. `SHIPPING_COST` is applied
below `SHIPPING_FREE_THRESHOLD`; `TAX_RATE=0.18` represents 18% tax.

## Checkout APIs

- `POST /api/payment/create-order` requires a bearer token and accepts
  `orderItems: [{ product, quantity }]` plus `shippingAddress`.
- `POST /api/payment/verify` requires a bearer token and accepts
  `paymentAttemptId`,
  `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` from the
  Razorpay Checkout response.
- `POST /api/payment/webhook` verifies `x-razorpay-signature` against the exact
  raw request body and processes captured-payment events idempotently.

The amount in the create-order response is in paise. The server fetches product
prices and stock and stores the immutable snapshot in `PaymentAttempt`; it does
not create an Order document until the signature and captured Razorpay payment
are verified. It then creates the Paid/Processing Order and deducts stock in one
MongoDB transaction. If stock is no longer available after capture, the server
starts a refund and marks the payment attempt `Refund Pending` until Razorpay
reports completion.

The legacy `POST /api/orders` endpoint is for COD only. Its prices and totals are
also recalculated on the server. Online orders must use the payment endpoints.

## Dashboard Webhook

If webhook handling is enabled, set the webhook URL to
`https://<your-api-host>/api/payment/webhook`, use the same value for
`RAZORPAY_WEBHOOK_SECRET`, and subscribe to `payment.captured` and
`payment.failed`. For local webhook
testing, expose port 5000 through a trusted HTTPS tunnel and use that public URL
in the Razorpay Dashboard. Never place either Razorpay secret in frontend
configuration or source control.

## Manual Test

1. Start MongoDB and the backend after configuring Test Mode credentials.
2. Log in, add an in-stock product, and open Checkout.
3. Complete a Razorpay Test Mode payment. Confirm the browser is redirected to
   order details only after the verification API returns success.
4. Confirm the order shows `Razorpay` / `Paid` and stock decreased once.
5. Close the checkout or use a failed test payment. Confirm the cart remains and
   no stock was deducted.
6. Repeat the same verification request. It must return the existing paid order
   without another stock deduction.
7. Test COD separately; it should continue creating an order through
   `POST /api/orders` with server-calculated totals.
