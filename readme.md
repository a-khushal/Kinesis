# Kinesis - The Video Transcoding Pipeline

Refer to [architecture.jpeg](./architecture.jpeg) for the system architecture.

## Setup

### Prerequisites
- Node.js 18+
- Bun 1.0.0+ (`npm install -g bun`)
- FFmpeg docker image
- AWS credentials
- PostgreSQL
- Redis

### Cloning the repo
```bash
git clone https://github.com/a-khushal/Kinesis.git
cd Kinesis
```

### Backend (port 8000)
```bash
cd backend
cp .env.example .env
bun install
bun dev
```

### Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

### Worker
```bash
cd worker
cp .env.example .env
bun install
bun dev
```

## Todo
- container orchestration using k8s or smth else
- video state management(PENDING, PROCESSING, COMPLETED, FAILED) for each resolution and when pushback to the queue, check if the video is already processed, better to have a table for each resolution referenced in the Videos table
- user session
- serve via CDN
- support multiple output formats currently only mp4
- obv ui improvements
