"use strict";

const express = require("express");
const { loadRecords } = require("./dataset");

const DATASET_ID = "global-shark-attack";
const RECORDS_PATH = `/api/explore/v2.1/catalog/datasets/${DATASET_ID}/records`;
const MAX_LIMIT = 100;

function parseInteger(value, fallback, name, minimum, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }

  const number = Number(value);
  if (number < minimum || number > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return number;
}

function countryFromWhere(where) {
  if (where === undefined) return null;
  if (typeof where !== "string") {
    throw new Error("where must be a single country equality expression");
  }

  const match = where.match(/^\s*country\s*=\s*(['"])(.*?)\1\s*$/i);
  if (!match) {
    throw new Error("Only where=country='COUNTRY' is supported by this curriculum API");
  }
  return match[2].trim().toLocaleUpperCase("en-US");
}

function createApp({ records = loadRecords() } = {}) {
  const app = express();
  app.disable("x-powered-by");

  app.use((request, response, next) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    response.set("Access-Control-Allow-Headers", "Accept,Content-Type");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", dataset: DATASET_ID, records: records.length });
  });

  app.get("/", (_request, response) => {
    response.json({
      service: "NebulaE University shark attack curriculum API",
      dataset: DATASET_ID,
      records_endpoint: RECORDS_PATH,
      health_endpoint: "/health"
    });
  });

  app.get(RECORDS_PATH, (request, response) => {
    try {
      const limit = parseInteger(request.query.limit, 10, "limit", 1, MAX_LIMIT);
      const offset = parseInteger(
        request.query.offset,
        0,
        "offset",
        0,
        Number.MAX_SAFE_INTEGER
      );
      const country = countryFromWhere(request.query.where);
      const matchingRecords = country
        ? records.filter(
            (record) =>
              record.country &&
              record.country.trim().toLocaleUpperCase("en-US") === country
          )
        : records;

      response.json({
        total_count: matchingRecords.length,
        results: matchingRecords.slice(offset, offset + limit)
      });
    } catch (error) {
      response.status(400).json({
        error_code: "InvalidParameter",
        message: error.message
      });
    }
  });

  app.use((_request, response) => {
    response.status(404).json({
      error_code: "NotFoundResource",
      message: "The requested resource does not exist."
    });
  });

  return app;
}

module.exports = { createApp, DATASET_ID, MAX_LIMIT, RECORDS_PATH };
