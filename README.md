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

Das Image funktioniert auch ohne Supervisor. Erkennt es keinen Home Assistant
(Umgebungsvariable `SUPERVISOR_TOKEN` fehlt), lässt nginx den Zugriff für alle Adressen zu.

**Empfohlen: Compose mit dem fertigen Image von GHCR**

```bash
docker compose pull && docker compose up -d
```

Danach ist die App unter <http://localhost:8099/> erreichbar. Die
[docker-compose.yml](docker-compose.yml) startet den Container gehärtet: schreibgeschütztes
Dateisystem, alle Capabilities bis auf die vier für den Nutzerwechsel entfernt,
`no-new-privileges`, Prozess- und Speicherlimit. Soll die App aus dem Internet erreichbar sein,
gehört ein Reverse-Proxy mit TLS davor; dann in der Compose-Datei nur lokal binden
(`127.0.0.1:8099:8099`).

**Selbst bauen** (holt den aktuellen Stand aus dem Original-Repository):

```bash
docker compose --profile build up -d --build
```

Oder ohne Compose:

```bash
docker build -t einsatzauftrag einsatzauftrag/
```

```bash
docker run --rm -p 8099:8099 einsatzauftrag
```

### Build-Argumente

| Argument              | Standard                                          | Bedeutung |
|-----------------------|---------------------------------------------------|-----------|
| `EINSATZAUFTRAG_REPO` | `https://github.com/wattnpapa/einsatzauftrag.git` | Quell-Repository der App |
| `EINSATZAUFTRAG_REF`  | `main`                                            | Branch, Tag oder Commit, der gebaut wird |
| `ENTFERNE_ZAEHLER`    | `true`                                            | Entfernt den externen GoatCounter-Zähler aus allen Seiten |
| `AUDIT_STUFE`         | `high`                                            | Bau bricht ab, wenn `npm audit` in den Laufzeit-Abhängigkeiten eine Lücke ab dieser Stufe meldet (leer = nicht prüfen) |
| `BUILD_FROM`          | `ghcr.io/home-assistant/base:3.23`                | Basisimage der Laufzeit-Stufe (Multi-Arch) |

## Sicherheit

Die App selbst verarbeitet alles im Browser; der Container liefert nur statische Dateien aus.
Was die Verpackung dafür tut:

- **Aktualität:** Basisimages sind bewegliche Tags und werden bei jedem Bau frisch gezogen,
  `apk upgrade` holt Alpine-Fixes, die App-Abhängigkeiten kommen exakt aus dem Lockfile des
  Original-Repos und werden mit `npm audit` geprüft. Ein Image ist aber immer nur so aktuell
  wie sein letzter Bau. Deshalb scannt der Workflow [Sicherheit](.github/workflows/sicherheit.yaml)
  jeden Bau mit Trivy und wöchentlich das veröffentlichte Image; findet er Lücken mit
  verfügbarem Fix, öffnet er ein Issue. Dann Version erhöhen und neu bauen.
- **Minimales Image:** Nicht benötigte Werkzeuge des Basisimages (`tempio`, `jeprof`, `bashio`,
  `curl`, `jq`, `dig`) werden entfernt. Trivy meldet für das Image 0 Funde.
- **Unprivilegiert:** nginx läuft als Nutzer `nginx`, nicht als root; das Root-Dateisystem
  kann schreibgeschützt sein.
- **Zugriff:** In Home Assistant akzeptiert nginx nur Verbindungen vom Ingress-Proxy des
  Supervisors; die Anmeldung übernimmt Home Assistant. Ein AppArmor-Profil
  ([apparmor.txt](einsatzauftrag/apparmor.txt)) begrenzt den Container zusätzlich.
- **Browser-Seite:** Strenge Content-Security-Policy ohne `unsafe-inline` (Hashes werden beim
  Bau berechnet), `nosniff`, `no-referrer`, `Permissions-Policy`, nur `GET`/`HEAD`. Der
  externe Besucherzähler der Original-App ist entfernt, die App spricht mit keinem Server.
- **Lieferkette:** Install-Skripte fremder npm-Pakete werden nicht ausgeführt, alle GitHub
  Actions sind auf Commit-SHAs gepinnt, Dependabot hält Actions und Basisimages aktuell,
  Images werden mit Cosign signiert.

Bekannt und bewusst offen: `npm audit` meldet in den *Entwicklungs*-Abhängigkeiten von
Upstream eine moderate Lücke in `uuid` (über `exceljs`). Sie betrifft Funktionen, die die
App nicht nutzt, und liegt im Original-Repository; sie wird dort gelöst, sobald `exceljs` nachzieht.

Beispiel, einen festen Stand der App bauen:

```bash
docker build --build-arg EINSATZAUFTRAG_REF=v1.0.0 -t einsatzauftrag einsatzauftrag/
```

## Aufbau des Repositories

```
repository.yaml               Add-on-Repository für Home Assistant
docker-compose.yml            Standalone-Betrieb (gehärtet; Image von GHCR oder --profile build)
einsatzauftrag/
├── config.yaml               App-Metadaten, Ingress, Seitenleisten-Panel
├── Dockerfile                Stufe 1: Clone + Audit + Vite-Build, Stufe 2: nginx (gehärtet)
├── nachbearbeiten.mjs        Entfernt den Zähler, berechnet CSP-Hashes für nginx
├── apparmor.txt              AppArmor-Profil (s6 + Unterprofil nginx)
├── rootfs/
│   ├── run.sh                Start: Zugriffsregel setzen, zu Nutzer nginx wechseln
│   └── etc/nginx/
│       ├── nginx.conf        Statische Auslieferung auf Port 8099, nur GET/HEAD
│       └── snippets/sicherheit.conf   Sicherheits-Header (CSP kommt aus dem Bau)
├── DOCS.md                   Doku im Add-on-Store
├── CHANGELOG.md
├── icon.png, logo.png
└── README.md
.github/
├── dependabot.yml            Actions und Basisimages aktuell halten
└── workflows/
    ├── builder.yaml          Build (amd64, aarch64) → ghcr.io/lexorius/app-einsatzauftrag
    ├── sicherheit.yaml       Trivy: jeder Bau + wöchentlich das veröffentlichte Image
    └── lint.yaml             Add-on-Linter, ShellCheck, Hadolint, nginx -t
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
