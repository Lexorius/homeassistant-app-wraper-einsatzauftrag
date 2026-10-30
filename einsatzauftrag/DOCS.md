# Add-on: Einsatzauftrag

## Was macht das Add-on?

Es stellt die Web-App **Einsatzauftrag** von Johannes Rudolph
([wattnpapa/einsatzauftrag](https://github.com/wattnpapa/einsatzauftrag)) in Home Assistant
bereit. Die App füllt den THW-Einsatzauftrag (Vordruck *Fb Fü 3*) als PDF aus:

- **Einzeln**: Formular mit Live-Vorschau ausfüllen, PDF herunterladen
- **Viele auf einmal**: Excel- oder CSV-Datei laden, pro Zeile ein Auftrag
- Das Formular wird als Vektorgrafik auf DIN A4 gezeichnet, möglichst auf eine Seite

Alles läuft im Browser. Es werden keine Daten an einen Server geschickt, auch nicht an
das Add-on selbst: nginx liefert nur die statischen Dateien aus.

## Installation

1. Add-on installieren und **starten**
2. **In der Seitenleiste anzeigen** einschalten
3. Links in der Seitenleiste auf **Einsatzauftrag** klicken

Das Add-on hat keine Optionen. Es öffnet keinen Port nach außen; der Zugriff läuft
ausschließlich über Ingress und damit über die Anmeldung von Home Assistant.

## Woher kommt die App?

Beim Bauen des Add-on-Images wird das Original-Repository `wattnpapa/einsatzauftrag`
(Branch `main`) geklont und mit Vite gebaut. Dieses Add-on-Repository enthält keinen
Quellcode der App, nur die Verpackung. Die im Fuß der App angezeigte *Fassung* nennt
Bauzeit und Commit des App-Stands.

Abweichend vom Original ist der externe Besucherzähler (GoatCounter, `gc.zgo.at`) aus
der Startseite entfernt, damit die App im Heimnetz nichts nach außen meldet.

## Sicherheit

- nginx liefert nur statische Dateien aus, läuft als unprivilegierter Nutzer und nimmt in
  Home Assistant ausschließlich Verbindungen vom Ingress-Proxy an. Nur `GET`/`HEAD`.
- Strenge Content-Security-Policy und weitere Sicherheits-Header; die App lädt nichts von
  fremden Servern (der Besucherzähler des Originals ist entfernt).
- Ein AppArmor-Profil begrenzt den Container, nicht benötigte Werkzeuge des Basisimages
  sind entfernt. Jeder Bau wird mit Trivy geprüft, das veröffentlichte Image wöchentlich.
- Die App braucht keinen Zugriff auf Home-Assistant-APIs, Hardware, Netzwerk des Hosts
  oder Verzeichnisse. Ein Update erscheint im Add-on-Store, sobald eine neue Version gebaut ist.

## Offline-Nutzung

Die App bringt einen Service Worker mit, der sie nach dem ersten Laden im Browser
zwischenspeichert. Innerhalb von Home Assistant hilft das vor allem bei kurzen
Verbindungsabbrüchen; eine echte Offline-Nutzung ohne erreichbares Home Assistant ist
über Ingress nicht möglich, weil der Ingress-Zugang eine gültige Anmeldesitzung braucht.
Wer die App unterwegs ohne Netz braucht, nutzt dafür besser direkt
<https://einsatzauftrag.app>.

## Fehlersuche

- **Seitenleisten-Eintrag fehlt**: In den Add-on-Einstellungen *In der Seitenleiste
  anzeigen* aktivieren und die Seite neu laden.
- **Leere Seite oder 403**: Add-on-Protokoll prüfen. Dort sollte beim Start
  `Home Assistant erkannt - Zugriff nur ueber Ingress.` stehen. Andere Zugriffe als über
  den Supervisor werden absichtlich abgewiesen.
- **Alte Fassung wird angezeigt**: Browser-Cache leeren bzw. im Browser die Service Worker
  der Home-Assistant-Domain entfernen, danach neu laden.

## Support

- Fehler **an der Verpackung** (Add-on startet nicht, Ingress, Build):
  <https://github.com/Lexorius/homeassistant-app-wraper-einsatzauftrag/issues>
- Fehler **in der App** (PDF, Formular, Excel-Import):
  <https://github.com/wattnpapa/einsatzauftrag/issues>

## Lizenz

Die App steht unter der EUPL-1.2, © Johannes Rudolph.
