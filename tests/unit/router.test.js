import { test } from "node:test";
import assert from "node:assert/strict";

import { formatRoute, parseRoute } from "../../public/js/router.js";

test("a route round-trips through format and parse", () => {
  const route = { category: "payment", exhibit: "odometer" };
  assert.deepEqual(parseRoute(formatRoute(route)), route);
});

test("the leading hash is optional and a trailing slash is tolerated", () => {
  const route = { category: "payment", exhibit: "odometer" };
  assert.deepEqual(parseRoute("/payment/odometer"), route);
  assert.deepEqual(parseRoute("#/payment/odometer/"), route);
});

test("anything that isn't a route parses as none", () => {
  for (const hash of [
    "",
    "#",
    "#/",
    "#/payment",
    "#/payment/odometer/extra",
    "#/Payment/Odometer",
    "#/payment/odo meter",
    "#payment/odometer",
    "#/../../etc/passwd",
  ])
    assert.equal(parseRoute(hash), null, hash);
});

test("a missing hash parses as none rather than throwing", () => {
  assert.equal(parseRoute(undefined), null);
  assert.equal(parseRoute(null), null);
});
