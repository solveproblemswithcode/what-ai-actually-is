# Builds the static site, then serves it with nginx. No backend.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The public address, for the social preview tags. Passed in by docker compose.
ARG SITE_URL=""
ENV VITE_SITE_URL=$SITE_URL
RUN npm run build

# The unprivileged nginx image runs as a normal user (uid 101) and needs no root powers.
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY headers.inc /etc/nginx/conf.d/headers.inc
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
