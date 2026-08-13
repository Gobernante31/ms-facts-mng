"use strict";

const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");

/**
 * Base OpenDataSoft records URL. The public catalog `global-shark-attack` was
 * retired (HTTP 404), so the default points to the local curriculum-data API
 * shipped in the playground. Override with SHARK_ATTACK_DATA_URL to target
 * any OpenDataSoft v2.1 explorer that exposes the same records endpoint.
 */
const DEFAULT_RECORDS_URL =
  "http://localhost:8989/api/explore/v2.1/catalog/datasets/global-shark-attack/records";

function requestJson$(urlStr) {
  const u = new URL(urlStr);
  const lib = u.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(u, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new Error(
              `OpenDataSoft GET ${urlStr} failed: HTTP ${res.statusCode}`,
            ),
          );
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`OpenDataSoft invalid JSON response: ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () =>
      req.destroy(new Error("OpenDataSoft request timed out")),
    );
  });
}

function recordsUrl({ limit, where }) {
  const url = new URL(process.env.SHARK_ATTACK_DATA_URL || DEFAULT_RECORDS_URL);
  if (limit !== undefined) url.searchParams.set("limit", String(limit));
  if (where) url.searchParams.set("where", where);
  return url.toString();
}

/**
 * GET records from the OpenDataSoft global-shark-attack catalog.
 * @param {{limit?: number, where?: string}} params
 * @returns {Promise<Array>} array of catalog records
 */
function getRecords({ limit, where } = {}) {
  return requestJson$(recordsUrl({ limit, where })).then(
    (body) => body.results || [],
  );
}

module.exports = { getRecords, recordsUrl, DEFAULT_RECORDS_URL };
