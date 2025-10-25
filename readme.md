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
- user session
- container orchestration using k8s or smth else
- serve via CDN
- db state update from PENDING to PROCESSING then to COMPLETED
- db S3 path updates
- obv ui improvements
- support multiple output formats currently only mp4
