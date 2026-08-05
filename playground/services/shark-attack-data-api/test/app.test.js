"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp, RECORDS_PATH } = require("../src/app");

let baseUrl;
let server;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("reports a healthy loaded dataset", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.records, 6302);
});

test("returns the OpenDataSoft-compatible result shape and 100 records", async () => {
  const response = await fetch(`${baseUrl}${RECORDS_PATH}?limit=100`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.total_count, 6302);
  assert.equal(body.results.length, 100);
  assert.equal(typeof body.results[0].original_order, "number");
  assert.ok(Object.hasOwn(body.results[0], "investigator_or_source"));
  assert.ok(Object.hasOwn(body.results[0], "case_number0"));
});

test("filters records by country", async () => {
  const where = encodeURIComponent("country='EGYPT'");
  const response = await fetch(`${baseUrl}${RECORDS_PATH}?where=${where}&limit=5`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.results.length, 5);
  assert.ok(body.results.every((record) => record.country === "EGYPT"));
});

test("applies offsets after filtering", async () => {
  const where = encodeURIComponent("country='EGYPT'");
  const first = await (await fetch(`${baseUrl}${RECORDS_PATH}?where=${where}&limit=1`)).json();
  const second = await (
    await fetch(`${baseUrl}${RECORDS_PATH}?where=${where}&limit=1&offset=1`)
  ).json();

  assert.notEqual(first.results[0].original_order, second.results[0].original_order);
  assert.equal(first.total_count, second.total_count);
});

test("rejects unsupported filters and limits above the OpenDataSoft maximum", async () => {
  const unsupported = await fetch(
    `${baseUrl}${RECORDS_PATH}?where=${encodeURIComponent("year=2018")}`
  );
  const excessiveLimit = await fetch(`${baseUrl}${RECORDS_PATH}?limit=101`);

  assert.equal(unsupported.status, 400);
  assert.equal(excessiveLimit.status, 400);
});
