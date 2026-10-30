# Home-Assistant-App: Einsatzauftrag

[![Add-on bauen](https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/actions/workflows/builder.yaml/badge.svg)](https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/actions/workflows/builder.yaml)
[![Prüfen](https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/actions/workflows/lint.yaml/badge.svg)](https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/actions/workflows/lint.yaml)

Verpackt die Web-App **[Einsatzauftrag](https://github.com/wattnpapa/einsatzauftrag)** von
Johannes Rudolph ([@wattnpapa](https://github.com/wattnpapa)) als Home-Assistant-App (Add-on).
Die App füllt den THW-Einsatzauftrag (Vordruck *Fb Fü 3*) als PDF aus, einzeln mit
Live-Vorschau oder viele auf einmal aus einer Excel-/CSV-Datei. Alles läuft im Browser,
nichts wird hochgeladen.

In Home Assistant erscheint die App über **Ingress** direkt in der Seitenleiste und ist
durch dessen Anmeldung geschützt. Es wird kein zusätzlicher Port geöffnet.

> **Hinweis:** Dieses Repository enthält **keinen** Quellcode der App. Das
> [Dockerfile](einsatzauftrag/Dockerfile) klont beim Bauen immer das Original-Repository
> `wattnpapa/einsatzauftrag` (Branch `main`, einstellbar über das Build-Argument
> `EINSATZAUFTRAG_REF`) und baut die App daraus.

## Installation in Home Assistant

1. **Einstellungen → Add-ons → Add-on Store → ⋮ (oben rechts) → Repositories**
2. Diese URL eintragen und hinzufügen:

   ```
   https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag
   ```

   Oder direkt über den Button:

   [![Add-on-Repository hinzufügen](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FLexorius%2Fhomeassistant-app-wraper-einsatzauftrag)

3. Im Store **Einsatzauftrag** auswählen → **Installieren**
4. **Starten** und **In der Seitenleiste anzeigen** aktivieren
5. In der Seitenleiste erscheint der Eintrag **Einsatzauftrag**

Unterstützte Architekturen: `aarch64`, `amd64` (32-Bit-ARM wird von Home Assistant
nicht mehr unterstützt).

## Standalone mit Docker (ohne Home Assistant)

Das Dockerfile funktioniert auch ohne Supervisor. Erkennt es keinen Home Assistant
(Umgebungsvariable `SUPERVISOR_TOKEN` fehlt), lässt nginx den Zugriff für alle Adressen zu:

```bash
docker build -t einsatzauftrag einsatzauftrag/
```

```bash
docker run --rm -p 8099:8099 einsatzauftrag
```

Danach ist die App unter <http://localhost:8099/> erreichbar.

Oder mit Compose:

```bash
docker compose up --build
```

### Build-Argumente

| Argument              | Standard                                          | Bedeutung |
|-----------------------|---------------------------------------------------|-----------|
| `EINSATZAUFTRAG_REPO` | `https://github.com/wattnpapa/einsatzauftrag.git` | Quell-Repository der App |
| `EINSATZAUFTRAG_REF`  | `main`                                            | Branch, Tag oder Commit, der gebaut wird |
| `ENTFERNE_ZAEHLER`    | `true`                                            | Entfernt den externen GoatCounter-Zähler aus `index.html` |
| `BUILD_FROM`          | `ghcr.io/home-assistant/base:3.23`                | Basisimage der Laufzeit-Stufe (Multi-Arch) |

Beispiel, einen festen Stand der App bauen:

```bash
docker build --build-arg EINSATZAUFTRAG_REF=v1.0.0 -t einsatzauftrag einsatzauftrag/
```

## Aufbau des Repositories

```
repository.yaml               Add-on-Repository für Home Assistant
docker-compose.yml            Standalone-Betrieb
einsatzauftrag/
├── config.yaml               App-Metadaten, Ingress, Seitenleisten-Panel
├── Dockerfile                Stufe 1: Clone + Vite-Build, Stufe 2: nginx
├── zaehler-entfernen.mjs     Entfernt den Analytics-Zähler aus dem Build
├── rootfs/
│   ├── run.sh                Start: Zugriffsregel setzen, nginx starten
│   └── etc/nginx/nginx.conf  Statische Auslieferung auf Port 8099
├── DOCS.md                   Doku im Add-on-Store
├── CHANGELOG.md
├── icon.png, logo.png
└── README.md
.github/workflows/
├── builder.yaml              Build (amd64, aarch64) → ghcr.io/lexorius/app-einsatzauftrag
└── lint.yaml                 Add-on-Linter, ShellCheck, Hadolint
```

## Release

1. Version in `einsatzauftrag/config.yaml` erhöhen
2. Abschnitt in `einsatzauftrag/CHANGELOG.md` ergänzen (die Release-Notizen werden daraus gezogen)
3. Committen, taggen, pushen (Tag muss zur Version passen):

   ```bash
   git tag v1.0.1 && git push && git push --tags
   ```

GitHub Actions baut das Image für beide Architekturen auf nativen Runnern, signiert es
mit Cosign, veröffentlicht es als Multi-Arch-Manifest auf GHCR und legt ein
GitHub-Release an. Home Assistant bietet danach das Update im Add-on-Store an.

Jeder Push auf `main` baut ebenfalls, veröffentlicht aber nur, wenn der Versions-Tag auf
GHCR noch nicht existiert. Soll ein neuer Stand der App ohne Änderung am Wrapper
ausgeliefert werden, genügt also eine Versionserhöhung: Der Build holt sich beim Bauen
immer den aktuellen Stand von `main`. Über **Actions → Add-on bauen → Run workflow** lässt
sich auch gezielt ein anderer Branch/Tag der App bauen.

> **Falls Home Assistant beim Installieren `error from registry: denied` meldet:** Entweder
> läuft der Build für die neue Version noch (Actions-Tab prüfen), oder das GHCR-Paket ist
> nicht öffentlich. Pakete, die ein Workflow dieses öffentlichen Repos anlegt, erben dessen
> Sichtbarkeit; sonst unter <https://github.com/Lexorius?tab=packages> →
> `app-einsatzauftrag` → *Package settings* → *Change visibility* → **Public** setzen.
> Alternativ `image:` in `config.yaml` auskommentieren, dann baut der Supervisor das Image
> lokal auf dem Home-Assistant-Host (dauert auf einem Raspberry Pi einige Minuten).

## Lizenz und Dank

Die App *Einsatzauftrag* steht unter der [EUPL-1.2](https://github.com/wattnpapa/einsatzauftrag/blob/main/LICENSE),
© Johannes Rudolph. Dieses Repository enthält nur die Verpackung als Home-Assistant-App;
Fehler oder Wünsche zur App selbst bitte im
[Original-Repository](https://github.com/wattnpapa/einsatzauftrag/issues) melden.
