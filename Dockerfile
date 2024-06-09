FROM node:20-slim as frontend-build

ENV PNPM_HOME="/pnpm"

ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY . /app

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run build


# build caddy with some extensions
FROM caddy:builder-alpine AS caddy-build

RUN xcaddy build \
    --with github.com/protomaps/go-pmtiles/caddy


FROM caddy:alpine

COPY Caddyfile /etc/caddy/

COPY maps /srv/

COPY --from=frontend-build /app/dist /srv

COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy