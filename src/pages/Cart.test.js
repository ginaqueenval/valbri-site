import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Cart.jsx", import.meta.url), "utf8");
const enLocale = readFileSync(new URL("../i18n/locales/en.json", import.meta.url), "utf8");
const zhLocale = readFileSync(new URL("../i18n/locales/zh.json", import.meta.url), "utf8");

test("cart desktop rows do not render a fake selection checkbox", () => {
  assert.equal(
    source.indexOf('h-5 w-5 rounded-[6px] border border-white/10 bg-white/[0.03]'),
    -1,
    "Cart rows should not show a checkbox-looking placeholder when merged checkout is not supported",
  );
});

test("cart copy does not imply merged checkout is reserved", () => {
  assert.equal(
    enLocale.indexOf("merged checkout"),
    -1,
    "English cart copy should not mention future merged checkout",
  );
  assert.equal(
    zhLocale.indexOf("合并支付"),
    -1,
    "Chinese cart copy should not mention future merged checkout",
  );
});
