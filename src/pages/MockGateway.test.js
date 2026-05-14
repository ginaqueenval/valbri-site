import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const paypalSource = readFileSync(new URL("../../public/mock-gateway/paypal.html", import.meta.url), "utf8");
const stripeSource = readFileSync(new URL("../../public/mock-gateway/stripe.html", import.meta.url), "utf8");

for (const [provider, source] of [
  ["paypal", paypalSource],
  ["stripe", stripeSource],
]) {
  test(`${provider} mock gateway behaves like an external payment page`, () => {
    assert.notEqual(
      source.indexOf("const orderNo = params.get(\"orderNo\");"),
      -1,
      "Gateway should read orderNo from the query string",
    );
    assert.notEqual(
      source.indexOf('localStorage.getItem("player_token")'),
      -1,
      "Gateway should forward the stored player token to mock payment APIs",
    );
    assert.notEqual(
      source.indexOf('"/api/payment/mock/success"'),
      -1,
      "Gateway should call the mock success endpoint",
    );
    assert.notEqual(
      source.indexOf('"/api/payment/mock/cancel"'),
      -1,
      "Gateway should call the mock cancel endpoint",
    );
    assert.notEqual(
      source.indexOf('submitMockPayment("/api/payment/mock/success", "/#/payment/success");'),
      -1,
      "Gateway should confirm payments through the mock success endpoint and success page",
    );
    assert.notEqual(
      source.indexOf('submitMockPayment("/api/payment/mock/cancel", "/#/payment/cancel");'),
      -1,
      "Gateway should cancel payments through the mock cancel endpoint and cancel page",
    );
  });
}
