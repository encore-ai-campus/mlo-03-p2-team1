# AGENTS.md

## Project scope

This project turns heterogeneous real estate data into reproducible AI-ready datasets. The goal is to predict apartment sale prices by legal neighborhood (beopjeong-dong) in Seoul. Keep collection and transformation code extensible to additional regions and sources. See [INTENT.md](INTENT.md) for project goals and [SPEC.md](SPEC.md) for the design. Use the relevant code and configuration examples to verify current behavior and settings.

## Repository conventions

- Maintain source definitions and collection plans in `metadata/src_*.csv`, dataset definitions in `metadata/ds_dataset.csv`, and Silver column mappings in `metadata/std_term.csv`. Check `pipeline/common/std_rules.py` for shared transformation behavior. Record transformation and validation results in `report/`. [Metadata guide](metadata/README.md) · [Reporting guide](report/README.md)
- Keep raw and generated data files and `.env` out of commits. Keep API keys and passwords out of code, documentation, logs, and responses. After a pipeline run, review diffs for tracked manifests, collection logs, stage READMEs, and reports. See [.env.example](.env.example) and the [backend README](backend/README.md) for environment variable names and setup.
- Keep this file focused on durable rules and entry points. Share task status in the relevant task and read the linked documentation and code as needed.

## Pipeline

- The implemented stages run in order from [Source `00_collect.py`](pipeline/source/00_collect.py) to [Bronze `01_bronze.py`](pipeline/bronze/01_bronze.py) to [Silver `02_normalize.py`](pipeline/silver/02_normalize.py). Gold, AI Ready, automated ingestion, and model training are planned. Use `pipeline/common/` for path, I/O, and reporting logic shared by two or more stages.
- Bronze preserves source rows and values. It marks every discovered source data file as read-only and compares SHA-256 hashes before and after the run, even with `--dataset`. Bronze and Silver transformations update outputs and reports. Use `--dataset` to limit which datasets are transformed.
- Silver standardizes column names, types, and value formats using `std_*.csv`. After changing Silver, verify that Bronze and Silver row counts match, Bronze SHA-256 hashes stay the same, and a rerun with the same input records `status=unchanged` in the manifest. [Silver standardization](docs/silver_표준화.md)
- `api --plan` previews collection without calling the API. Plans using `sido:` require the local legal neighborhood code dataset. `seoul --plan` queries the live API for a record count when needed and creates the collection log if it is missing. API calls require `requests` and the corresponding API key. `inventory` updates the source manifest and summary. [Data collection guide](docs/data_collecting.md)

## Application

- The backend uses FastAPI and psycopg. `backend/app/main.py` registers the routes. `GET /api/health` is the only implemented project endpoint. When changing dashboard queries, check the [dashboard backend guide](backend/app/features/dashboard/README.md), the actual PostgreSQL schema, and the [frontend types](frontend/src/types/dashboard.ts).
- The frontend is a 3D dashboard built with React, TypeScript, and Vite. Start with `frontend/src/App.tsx` for the UI and `frontend/src/store/useDashboardStore.ts` for state. The dashboard currently uses mock data from `frontend/src/data/mockRegimes.ts` and a map at the city, county, and district level.

## Run and verify

Run these commands from the repository root. Run the checks relevant to the change and report any checks blocked by missing inputs or access.

| Area | Setup and verification |
| --- | --- |
| Pipeline | Run `python -m pip install pandas pyarrow`, then `python pipeline/validation/check_std_rules.py`. The rule checks can run without source data. |
| Silver | With local Bronze Parquet files available, run `python pipeline/silver/02_normalize.py --check` for a read-only preflight. |
| Backend | Run `python -m pip install -r backend/requirements-dev.txt`, then `python -m pytest backend`. Tests mock the database connection. Start the development server with `python -m uvicorn backend.app.main:app --reload`. The live health check requires database access. |
| Frontend | Check Vite's `engines.node` in the [lockfile](frontend/package-lock.json) for the Node.js requirement. Run `npm --prefix frontend ci` to install, `npm --prefix frontend run dev` for the development server, and `npm --prefix frontend run build` to type-check and bundle. |

## Browser and VM access

- When the user requests Chrome DevTools MCP or the browser task is supported by it, discover and use the MCP tools before falling back to computer-use UI automation. Check pages with `list_pages` and use `new_page` when the user asks for a new page. Verify the result on the requested surface, whether that is an MCP browser page, the visible Chrome DevTools panel, or a separate browser window. Report anything you could not verify. If computer use is stopped for the turn, respect the stop and do not bypass it through another UI automation path.
- Use the VM's existing configured account by default. If the requested account is unavailable, identify and use a supported existing login. Create or delete accounts or change SSH key access only when the user explicitly requests that specific change. Ask before provisioning another account.
