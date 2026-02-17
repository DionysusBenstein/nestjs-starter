FROM node:22.13-alpine

WORKDIR /app

RUN mkdir /app/node_modules
RUN chown -R node:node /app/node_modules

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml* ./
COPY tsconfig.json .

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  else echo "pnpm-lock.yaml not found." && exit 1; \
  fi

RUN pnpm add -g @nestjs/cli@11

COPY . .
