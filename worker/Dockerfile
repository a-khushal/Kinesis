FROM oven/bun:latest

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock ./

RUN bun install

COPY prisma ./prisma
RUN bunx prisma generate

COPY . .

EXPOSE 9000

CMD ["bun", "run", "dev"]
