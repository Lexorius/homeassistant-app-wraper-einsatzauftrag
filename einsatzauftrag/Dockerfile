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
# Aktualität/Sicherheit: Alle Basisimages sind bewegliche Tags und werden bei jedem
# Bau neu gezogen (CI: pull=true). Die Alpine-Pakete werden beim Bau auf den neuesten
# Stand gebracht, die App-Abhängigkeiten kommen exakt aus dem Upstream-Lockfile und
# werden mit „npm audit“ geprüft. Das Image ist nur so aktuell wie sein letzter Bau –
# der wöchentliche Scan (.github/workflows/sicherheit.yaml) meldet, wenn ein Neubau nötig ist.
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
FROM --platform=$BUILDPLATFORM node:26-alpine AS build

# Quelle der App. REF kann ein Branch, Tag oder Commit sein.
ARG EINSATZAUFTRAG_REPO=https://github.com/wattnpapa/einsatzauftrag.git
ARG EINSATZAUFTRAG_REF=main
# GoatCounter-Zähler (gc.zgo.at) aus den Seiten entfernen: Im Heimnetz
# hinter Home Assistant soll die App nichts nach außen melden.
ARG ENTFERNE_ZAEHLER=true
# Bau abbrechen, wenn „npm audit“ in den Laufzeit-Abhängigkeiten der App eine
# Lücke ab dieser Stufe meldet (low, moderate, high, critical; leer = nicht prüfen).
ARG AUDIT_STUFE=high

RUN apk add --no-cache git

WORKDIR /src
RUN git clone --depth 1 --branch "${EINSATZAUFTRAG_REF}" "${EINSATZAUFTRAG_REPO}" . \
    && echo "Baue einsatzauftrag @ $(git rev-parse --short HEAD) (${EINSATZAUFTRAG_REF})"

# Exakt die Versionen aus dem Upstream-Lockfile, ohne Install-Skripte fremder
# Pakete auszuführen (Lieferketten-Schutz; der Vite-Build braucht sie nicht).
RUN npm ci --ignore-scripts \
    && if [ -n "${AUDIT_STUFE}" ]; then npm audit --omit=dev --audit-level="${AUDIT_STUFE}"; fi \
    && npm run web:build

# Zähler entfernen und CSP-Hashes der Inline-Blöcke für nginx berechnen.
COPY nachbearbeiten.mjs /tmp/nachbearbeiten.mjs
RUN node /tmp/nachbearbeiten.mjs dist-web /src/csp.conf "${ENTFERNE_ZAEHLER}"

# ---------------------------------------------------------------------------
# Stufe 2: Auslieferung mit nginx
# ---------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# - Alpine-Pakete auf den neuesten Stand (Sicherheitsfixes, die jünger sind als das Basisimage)
# - nginx und su-exec (Wechsel zum unprivilegierten Nutzer „nginx“)
# - Nicht benötigte Werkzeuge des Basisimages entfernen: tempio (Go-Binary mit
#   bekannten CVEs), jeprof, bashio, curl, jq, dig – diese App braucht davon nichts.
RUN apk upgrade --no-cache \
    && apk add --no-cache nginx su-exec \
    && apk del --no-cache curl jq bind-tools \
    && rm -rf /usr/bin/tempio /usr/local/bin/jeprof /usr/lib/bashio \
              /etc/nginx/http.d /var/www/localhost /var/lib/nginx/html \
              /var/cache/apk/*

COPY rootfs /
COPY --from=build /src/dist-web /var/www/einsatzauftrag
COPY --from=build /src/csp.conf /etc/nginx/snippets/csp.conf

RUN chmod +x /run.sh \
    && chmod -R a+rX,go-w /var/www/einsatzauftrag /etc/nginx

# Ingress-Port, siehe config.yaml (ingress_port). Wird nicht nach außen
# veröffentlicht, der Supervisor spricht ihn im internen Netz an.
EXPOSE 8099

HEALTHCHECK --interval=60s --timeout=5s --start-period=10s \
    CMD [ "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8099/" ]

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
