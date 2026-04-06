# Kinesis

Video upload + async transcoding pipeline with `backend` (API), `worker` (queue processor), and `frontend` (UI).

Refer to [architecture.jpeg](./architecture.jpeg) for architecture.

## Requirements

- Node.js 18+
- Bun
- Docker + Docker Compose
- AWS S3 credentials

## Environment

Create these files first:

```bash
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
```

Required values:

- `DATABASE_URL`
- `REDIS_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET`

## Run Locally

Start services in separate terminals.

1) Worker dependencies + worker container

```bash
cd worker
docker compose up -d --build
```

2) Backend (`:8000`)

```bash
cd backend
bun install
bun dev
```

3) Frontend (`:3000`)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Worker runs FFmpeg inside the worker container (no Docker socket mount).
- Processed files and original upload are deleted from S3 after 1 hour.
- Download links endpoint: `GET /api/v1/videos/:videoId/downloads`

## TODO

- container orchestration using k8s or smth else
- video state management(PENDING, PROCESSING, COMPLETED, FAILED) for each resolution and when pushback to the queue, check if the video is already processed, better to have a table for each resolution referenced in the Videos table
- better queue retry/backoff handling and dead-letter queue
- atomic cleanup claiming if running multiple workers
- migrate aws sdk v2 to v3 (backend + worker)
- user session
- serve via CDN
- support multiple output formats currently only mp4
- obv ui improvements
