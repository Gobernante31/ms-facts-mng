# Shark Attack Curriculum API

This Express service is a local, exercise-specific replacement for the removed
OpenDataSoft `global-shark-attack` dataset. It intentionally implements only the API
operations used by the NebulaE University curricula:

- `GET /api/explore/v2.1/catalog/datasets/global-shark-attack/records`
- Query parameters: `limit` (1-100), `offset`, and `where=country='COUNTRY'`
- OpenDataSoft v2-style response: `{ "total_count": number, "results": [...] }`
- `GET /health`

The container uses the vendored dataset snapshot and makes no outbound network calls.
See [data/SOURCE.md](data/SOURCE.md) for provenance and limitations.

From the template's `playground` directory:

```bash
docker compose --profile curriculum-data up -d shark-attack-data-api
curl 'http://localhost:8989/api/explore/v2.1/catalog/datasets/global-shark-attack/records?limit=1'
```

When the consuming backend runs on the host, use `http://localhost:8989`. When it runs
as another service in the same Compose project, use
`http://shark-attack-data-api:8080`.

Run locally with Node.js 22 or later:

```bash
npm ci
npm test
npm start
```
