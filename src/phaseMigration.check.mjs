import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const appSource = read("./App.jsx");
const accountModalSource = read("./components/OrderAccountInfoModal.jsx");
const playerAuthSource = read("./utils/playerAuth.js");
const loginSource = read("./pages/Login.jsx");
const registerSource = read("./pages/Register.jsx");
const productTypesSource = read("./pages/fc26ProductTypes.js");
const checkoutSource = read("./pages/Checkout.jsx");
const paymentSuccessSource = read("./pages/PaymentSuccess.jsx");
const paymentRedirectSource = read("./utils/paymentRedirect.js");
const requestSource = read("./utils/request.js");
const enSource = read("./i18n/locales/en.json");

test("backup code guide is routed, chromeless, and linked from account modal", () => {
  assert.match(appSource, /const BackupCodesGuide = lazy/);
  assert.match(appSource, /path="\/guide\/backup-codes"/);
  assert.match(appSource, /isChromelessRoute/);
  assert.match(accountModalSource, /href="#\/guide\/backup-codes"/);
  assert.match(enSource, /"guide"\s*:/);

  for (const name of ["step1.png", "step2.png", "step3.png", "step4.png"]) {
    assert.equal(
      existsSync(new URL(`../public/backup-codes/${name}`, import.meta.url)),
      true,
      `${name} should be copied into public/backup-codes`,
    );
  }
});

test("safe storage, remember me, and registration terms are integrated", () => {
  assert.match(playerAuthSource, /safeGetItem/);
  assert.match(playerAuthSource, /remember === true/);
  assert.match(loginSource, /remember: rememberMe/);
  assert.match(registerSource, /acceptTerms/);
  assert.match(registerSource, /auth\.acceptTerms/);
  assert.match(enSource, /"acceptTermsRequired"/);
});

test("SBC platform normalization and payment success SSE self-healing are preserved", () => {
  assert.match(productTypesSource, /\[COIN_PRODUCT_TYPE\]: \["PS\/Xbox", "PC"\]/);
  assert.match(productTypesSource, /platform === "PlayStation"/);
  assert.match(checkoutSource, /getSafePaymentRedirectUrl/);
  assert.match(paymentRedirectSource, /SAFE_PAYMENT_PROTOCOLS/);
  assert.match(requestSource, /sessionClearing/);
  assert.match(paymentSuccessSource, /const paidRef = useRef\(false\)/);
  assert.match(paymentSuccessSource, /event\.fallback/);
  assert.doesNotMatch(paymentSuccessSource, /settledRef/);
});
