# Grid Project

Large data table with inline editing and realtime sync.

## Run

Requirements:
- Docker Desktop

Command:

```bash
docker compose up --build
```

## URLs

- Frontend: `http://localhost:5173`
- Backend via Nginx: `http://localhost:8080`
- Healthcheck: `http://localhost:8080/health`

## Implemented

- PostgreSQL as data source
- Node.js/Express BFF
- React + TanStack Table grid
- Row virtualization
- Inline editing for `text`, `number`, `select`
- Realtime updates via WebSocket

## Stop

```bash
docker compose down
```
