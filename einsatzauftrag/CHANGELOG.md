# Changelog

Alle nennenswerten Änderungen an der Add-on-Verpackung. Änderungen an der App selbst
stehen im [Original-Repository](https://github.com/wattnpapa/einsatzauftrag).

## 1.0.0 - 2026-10-30

### Hinzugefügt

- Erste Fassung der Home-Assistant-App.
- Zweistufiges Dockerfile: Klont `wattnpapa/einsatzauftrag` (Branch `main`) beim Bau,
  baut die Web-App mit Vite und liefert sie mit nginx auf dem Home-Assistant-Basisimage
  (`ghcr.io/home-assistant/base:3.23`, Alpine) aus.
- Ingress mit Eintrag in der Seitenleiste (`panel_title: Einsatzauftrag`), kein Port nach
  außen, Watchdog auf den nginx-Port.
- Zugriff auf nginx im Home-Assistant-Betrieb auf den Ingress-Proxy des Supervisors
  beschränkt; standalone per `docker run` offen.
- Externer Besucherzähler (GoatCounter) wird beim Bau aus `index.html` entfernt
  (abschaltbar über Build-Argument `ENTFERNE_ZAEHLER=false`).
- GitHub Actions mit den Home-Assistant-Builder-Actions (BuildKit, Cosign):
  Multi-Arch-Image (`aarch64`, `amd64`) nach `ghcr.io/lexorius/app-einsatzauftrag`,
  Linter für Konfiguration, Shell und Dockerfile.
