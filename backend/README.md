# Backend Structure

This backend now follows a modular internal package layout:

- `main.go`: HTTP server entrypoint and route wiring.
- `internal/handlers/`: HTTP handlers grouped by feature.
- `internal/middleware/`: Shared HTTP middleware.
- `internal/auth/`: JWT and password utilities.
- `internal/services/`: External service integrations (email, payments).
- `internal/database/`: DB initialization and migration runner.
- `internal/models/`: Shared data models and request/response types.
- `internal/response/`: Centralized JSON response helpers.
- `migrations/`: SQL migrations applied at startup.
- `cmd/`: Standalone admin and maintenance commands.

## Commands

From the `backend/` directory:

- Run API server: `go run .`
- Make user admin: `go run ./cmd/admin-setup user@example.com`
- Reset admin password: `go run ./cmd/admin-reset NewPassword123`
- Run product fix utility: `go run ./cmd/fix-products`

## Notes

- Runtime/generated files are intentionally ignored via `.gitignore` (`*.exe`, `*.log`, temp files, `.env`).
- Keep one-off scripts in `cmd/` so production server code stays clean.
- Keep application runtime logic in `internal/` packages rather than root-level files.
