import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Checkout.jsx", import.meta.url), "utf8");

test("checkout tracks the active payment method instead of sharing one loading flag", () => {
  assert.notEqual(
    source.indexOf('const [activePaymentMethod, setActivePaymentMethod] = useState(null);'),
    -1,
    "Checkout should keep a method-specific loading state",
  );
  assert.equal(
    source.indexOf("const [loading, setLoading] = useState(false);"),
    -1,
    "Checkout should not use one shared loading state for all payment buttons",
  );
});

test("paypal loading text does not change the stripe button label", () => {
  assert.notEqual(
    source.indexOf('activePaymentMethod === "stripe" ? t("payment.creating") : t("payment.stripePay")'),
    -1,
    "Stripe button text should depend only on the stripe active method",
  );
  assert.notEqual(
    source.indexOf('activePaymentMethod === "paypal" ? t("payment.creating") : t("payment.paypalPay")'),
    -1,
    "PayPal button text should depend only on the paypal active method",
  );
});

test("checkout disables only the active payment button visually", () => {
  assert.notEqual(
    source.indexOf('disabled={activePaymentMethod === "stripe"}'),
    -1,
    "Stripe button should only enter disabled styling while stripe is active",
  );
  assert.notEqual(
    source.indexOf('disabled={activePaymentMethod === "paypal"}'),
    -1,
    "PayPal button should only enter disabled styling while paypal is active",
  );
  assert.equal(
    source.indexOf("disabled={requestActive}"),
    -1,
    "Inactive payment buttons should not share the active disabled visual state",
  );
});

test("checkout redirects every payment URL with a full page navigation", () => {
  assert.equal(
    source.indexOf('paymentUrl.startsWith("/mock-payment/")'),
    -1,
    "Mock payment should no longer use an internal SPA route",
  );
  assert.equal(
    source.indexOf("navigate(paymentUrl);"),
    -1,
    "Payment redirects should not use React Router navigation",
  );
  assert.notEqual(
    source.indexOf("window.location.href = paymentUrl;"),
    -1,
    "All payment URLs should use full page navigation to match real providers",
  );
});

test("payment buttons keep stable dimensions while a request is active", () => {
  assert.notEqual(
    source.indexOf("const paymentButtonBaseClass ="),
    -1,
    "Checkout should centralize stable payment button sizing",
  );
  assert.notEqual(
    source.indexOf("min-w-[190px]"),
    -1,
    "Payment buttons should keep a stable width across localized loading labels",
  );
});

test("stripe and paypal payments include the cart item id", () => {
  assert.notEqual(
    source.indexOf("cartItemId: cartItem.id"),
    -1,
    "Payment creation should include cartItemId so the backend can remove the checked out cart item",
  );
});

test("stripe and paypal payment creation notifies cart listeners before redirecting", () => {
  const stripeStart = source.indexOf("const handleStripePay = async () => {");
  const paypalStart = source.indexOf("const handlePayPalPay = async () => {");
  const widgetStart = source.indexOf("const handleWidgetPay = async () => {");
  const stripeBody = source.slice(stripeStart, paypalStart);
  const paypalBody = source.slice(paypalStart, widgetStart);

  assert.notEqual(
    stripeBody.indexOf('window.dispatchEvent(new Event("cart-changed"));'),
    -1,
    "Stripe checkout should refresh cart state after payment session creation",
  );
  assert.notEqual(
    paypalBody.indexOf('window.dispatchEvent(new Event("cart-changed"));'),
    -1,
    "PayPal checkout should refresh cart state after payment order creation",
  );
});

test("checkout does not render the coming soon status panel under payment buttons", () => {
  assert.equal(
    source.indexOf("!orderResult && !cartItem.widgetUrl"),
    -1,
    "Checkout should not render the old coming soon status panel below payment buttons",
  );
  assert.equal(
    source.indexOf('rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]'),
    -1,
    "Checkout should not render the old styled coming soon status panel",
  );
});
