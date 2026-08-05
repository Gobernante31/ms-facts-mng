"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { parse } = require("csv-parse/sync");

const DATASET_PATH = path.join(__dirname, "..", "data", "attacks.csv.gz");

function nullable(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

function nullableNumber(value) {
  const normalized = nullable(value);
  if (normalized === null) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function toApiRecord(row) {
  return {
    case_number: nullable(row[0]),
    date: nullable(row[1]),
    year: nullableNumber(row[2]),
    type: nullable(row[3]),
    country: nullable(row[4]),
    area: nullable(row[5]),
    location: nullable(row[6]),
    activity: nullable(row[7]),
    name: nullable(row[8]),
    sex: nullable(row[9]),
    age: nullable(row[10]),
    injury: nullable(row[11]),
    fatal_y_n: nullable(row[12]),
    time: nullable(row[13]),
    species: nullable(row[14]),
    investigator_or_source: nullable(row[15]),
    pdf: nullable(row[16]),
    href_formula: nullable(row[17]),
    href: nullable(row[18]),
    case_number0: nullable(row[19]),
    case_number1: nullable(row[20]),
    original_order: nullableNumber(row[21])
  };
}

function loadRecords(datasetPath = DATASET_PATH) {
  const compressed = fs.readFileSync(datasetPath);
  const csv = zlib.gunzipSync(compressed);
  const rows = parse(csv, {
    bom: true,
    from_line: 2,
    relax_column_count: true,
    skip_empty_lines: true
  });

  return rows
    .map(toApiRecord)
    .filter(
      (record) => record.original_order !== null && record.case_number !== "0"
    );
}

module.exports = { DATASET_PATH, loadRecords, toApiRecord };
