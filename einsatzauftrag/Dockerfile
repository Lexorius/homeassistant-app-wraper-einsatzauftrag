# syntax=docker/dockerfile:1
#
# Home-Assistant-App „Einsatzauftrag“
# https://contributors.home-assistant.io/apps/guides/dockerfile/
#
# Zweistufiger Build:
#   1. Die Web-App wird aus dem Original-Repository
#      https://github.com/wattnpapa/einsatzauftrag geklont und mit Vite gebaut.
#      Es liegt bewusst kein Quellcode der App in diesem Repository.
#   2. Das fertige, rein statische Ergebnis (dist-web/) wird mit nginx auf dem
#      Home-Assistant-Basisimage ausgeliefert – erreichbar über Ingress.
#
# Standalone (ohne Home Assistant):
#   docker build -t einsatzauftrag einsatzauftrag/
#   docker run --rm -p 8099:8099 einsatzauftrag   → http://localhost:8099/

# Multi-Arch-Manifest (amd64, aarch64), Docker wählt die passende Plattform.
ARG BUILD_FROM=ghcr.io/home-assistant/base:3.23

# ---------------------------------------------------------------------------
# Stufe 1: Web-App bauen
# Das Ergebnis ist reines HTML/JS/CSS und damit architekturunabhängig, deshalb
# läuft diese Stufe immer nativ auf der Build-Plattform (kein QEMU).
# ---------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

# Quelle der App. REF kann ein Branch, Tag oder Commit sein.
ARG EINSATZAUFTRAG_REPO=https://github.com/wattnpapa/einsatzauftrag.git
ARG EINSATZAUFTRAG_REF=main
# GoatCounter-Zähler (gc.zgo.at) aus der Startseite entfernen: Im Heimnetz
# hinter Home Assistant soll die App nichts nach außen melden.
ARG ENTFERNE_ZAEHLER=true

RUN apk add --no-cache git

WORKDIR /src
RUN git clone --depth 1 --branch "${EINSATZAUFTRAG_REF}" "${EINSATZAUFTRAG_REPO}" . \
    && echo "Baue einsatzauftrag @ $(git rev-parse --short HEAD) (${EINSATZAUFTRAG_REF})"

# „npm ci“ führt per prepare-Skript auch den Bibliotheks-Build (tsc) aus,
# die Quellen dafür liegen durch den Clone bereits vor.
RUN npm ci \
    && npm run web:build

# Den extern geladenen Zähler aus dem gebauten index.html entfernen.
COPY zaehler-entfernen.mjs /tmp/zaehler-entfernen.mjs
RUN if [ "${ENTFERNE_ZAEHLER}" = "true" ]; then \
        node /tmp/zaehler-entfernen.mjs dist-web/index.html; \
    fi

# ---------------------------------------------------------------------------
# Stufe 2: Auslieferung mit nginx
# ---------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

RUN apk add --no-cache nginx \
    && rm -rf /etc/nginx/http.d /var/www/localhost

COPY rootfs /
COPY --from=build /src/dist-web /var/www/einsatzauftrag

RUN chmod +x /run.sh

# Ingress-Port, siehe config.yaml (ingress_port). Wird nicht nach außen
# veröffentlicht, der Supervisor spricht ihn im internen Netz an.
EXPOSE 8099

HEALTHCHECK --interval=60s --timeout=5s --start-period=10s \
    CMD wget -q -O /dev/null http://127.0.0.1:8099/ || exit 1

CMD [ "/run.sh" ]

# io.hass.arch und io.hass.version setzt die build-image-Action beim Bau.
LABEL \
    io.hass.type="addon" \
    io.hass.name="Einsatzauftrag" \
    io.hass.description="Einsatzauftrag (Fb Fü 3) als PDF ausfüllen – einzeln oder aus Excel/CSV." \
    io.hass.url="https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag" \
    org.opencontainers.image.title="Home Assistant App: Einsatzauftrag" \
    org.opencontainers.image.description="Einsatzauftrag (Fb Fü 3) als PDF ausfüllen – Web-App von wattnpapa, verpackt als Home-Assistant-App." \
    org.opencontainers.image.authors="Thomas Kloppholz (@Lexorius)" \
    org.opencontainers.image.vendor="Lexorius Home Assistant Add-ons" \
    org.opencontainers.image.licenses="EUPL-1.2" \
    org.opencontainers.image.url="https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag" \
    org.opencontainers.image.source="https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag" \
    org.opencontainers.image.documentation="https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/blob/main/einsatzauftrag/DOCS.md"
