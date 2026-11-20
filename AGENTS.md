# AGENTS.md

## Context & Navigation
- Read [INTENT.md](INTENT.md) for project goals, [SPEC.md](SPEC.md) for infrastructure, and [plan.md](plan.md) for milestones.
- Read a subdirectory's `README.md` (`pipeline/`, `metadata/`, `report/`, `docs/manual/`) on demand when working in that directory.
- Scope responses and changes strictly to the directory and stage requested by the user.

## Invariants
- Keep raw and generated datasets local under `data/` and load secrets exclusively from `.env`.
- Treat files in `data/source/` as read-only inputs verified by SHA-256 hashes.
- Define standardization, cleaning, and validation rules in `metadata/*.csv`, and write execution results to `report/`.
- Produce deterministic outputs (`status=unchanged` when rerun on identical inputs).
