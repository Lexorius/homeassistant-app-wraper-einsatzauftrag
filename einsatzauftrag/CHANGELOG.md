# Changelog

Alle nennenswerten Änderungen an der Add-on-Verpackung. Änderungen an der App selbst
stehen im [Original-Repository](https://github.com/wattnpapa/einsatzauftrag).

## 1.1.0 - 2026-10-31

### Sicherheit

- nginx läuft nicht mehr als root: `run.sh` wechselt per `su-exec` zum Nutzer `nginx`;
  Laufzeitdateien liegen unter `/run/nginx`, das Image funktioniert mit
  schreibgeschütztem Root-Dateisystem.
- Content-Security-Policy ohne `unsafe-inline`: Die Hashes der Inline-Blöcke werden
  beim Bau aus den HTML-Seiten berechnet (`nachbearbeiten.mjs`). Dazu
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `Cross-Origin-Resource-Policy`, `Cross-Origin-Opener-Policy`; nur `GET`/`HEAD`,
  versteckte Dateien gesperrt, knappe Puffer und Timeouts.
- Nicht benötigte Werkzeuge des Basisimages entfernt (`tempio`, `jeprof`, `bashio`,
  `curl`, `jq`, `dig`) – damit verschwinden alle 43 Trivy-Funde des Go-Binaries `tempio`.
- `apk upgrade` beim Bau, `npm ci --ignore-scripts` und `npm audit --omit=dev`
  als Bau-Abbruchkriterium (Stufe über Build-Argument `AUDIT_STUFE`, Standard `high`).
- AppArmor-Profil (`apparmor.txt`) mit eigenem Unterprofil für nginx.
- GitHub Actions auf Commit-SHAs gepinnt, Dependabot für Actions und Basisimages,
  neuer Workflow „Sicherheit“: Trivy-Scan jedes Baus (SARIF → Code scanning, Abbruch
  bei HIGH/CRITICAL mit Fix) und wöchentlicher Scan des veröffentlichten Images, der
  bei Funden ein Issue öffnet.

### Geändert

- GoatCounter-Zähler wird jetzt aus allen HTML-Seiten entfernt, nicht nur aus `index.html`.
- `docker-compose.yml` nutzt standardmäßig das fertige Image von GHCR, gehärtet
  (read-only, `cap_drop: ALL`, `no-new-privileges`, Limits); Bauen über `--profile build`.

## 1.0.0 - 2026-10-30

### Hinzugefügt

- Erste Fassung der Home-Assistant-App.
- Zweistufiges Dockerfile: Klont `wattnpapa/einsatzauftrag` (Branch `main`) beim Bau,
  baut die Web-App mit Vite und liefert sie mit nginx auf dem Home-Assistant-Basisimage
  (`ghcr.io/home-assistant/base:3.23`, Alpine) aus.
- Ingress mit Eintrag in der Seitenleiste (`panel_title: Einsatzauftrag`), kein Port nach
  außen, Docker-HEALTHCHECK auf den nginx-Port.
- Zugriff auf nginx im Home-Assistant-Betrieb auf den Ingress-Proxy des Supervisors
  beschränkt; standalone per `docker run` offen.
- Externer Besucherzähler (GoatCounter) wird beim Bau aus `index.html` entfernt
  (abschaltbar über Build-Argument `ENTFERNE_ZAEHLER=false`).
- GitHub Actions mit den Home-Assistant-Builder-Actions (BuildKit, Cosign):
  Multi-Arch-Image (`aarch64`, `amd64`) nach `ghcr.io/lexorius/app-einsatzauftrag`,
  Linter für Konfiguration, Shell und Dockerfile.
