# The website as one container for Google Cloud Run (Nov 2026: Vercel paused the Hobby account).
# Built and deployed by .github/workflows/cloud-run.yml. Vercel ignores this file.
#
# Build-time values: NEXT_PUBLIC_* are baked into the browser code, so they are build args.
# The workflow also passes the server secrets as a BuildKit secret (/run/secrets/appenv), so pages
# that read the database are pre-rendered with real content. Nothing secret is kept in the image.

FROM mirror.gcr.io/library/node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM mirror.gcr.io/library/node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    VERCEL_ENV=production \
    NEXT_PUBLIC_VERCEL_ENV=production
# Public by design (they are in every page's JavaScript). Override with --build-arg if they change.
ARG NEXT_PUBLIC_SITE_URL=https://www.royalfitnesclub.in
ARG NEXT_PUBLIC_SUPABASE_URL=https://trcnjdtbaydmtmdmpxbj.supabase.co
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_H1dFKz1z0OgUILidREYdOQ_JYWnz_Gx
ARG NEXT_PUBLIC_GA_ID=
ARG NEXT_PUBLIC_META_PIXEL_ID=
ARG NEXT_PUBLIC_LAB_LINK_1MG=
ARG NEXT_PUBLIC_LAB_LINK_REDCLIFFE=
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID \
    NEXT_PUBLIC_LAB_LINK_1MG=$NEXT_PUBLIC_LAB_LINK_1MG \
    NEXT_PUBLIC_LAB_LINK_REDCLIFFE=$NEXT_PUBLIC_LAB_LINK_REDCLIFFE \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
RUN --mount=type=secret,id=appenv,required=false \
    if [ -f /run/secrets/appenv ]; then . /run/secrets/appenv; fi; \
    npm run build

FROM mirror.gcr.io/library/node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0 \
    VERCEL_ENV=production
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 8080
CMD ["node", "server.js"]
