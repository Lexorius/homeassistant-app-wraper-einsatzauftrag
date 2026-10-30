#!/bin/sh
# Startskript der App. Legt die Laufzeit-Verzeichnisse an, entscheidet, wer auf
# nginx zugreifen darf, und startet nginx als unprivilegierter Nutzer „nginx“.
set -eu

LAUFZEIT=/run/nginx
ZUGRIFF="${LAUFZEIT}/zugriff.conf"

# /run ist unter Home Assistant und bei read_only-Containern ein tmpfs.
# /var/lib/nginx/tmp gehört bereits dem Nutzer nginx (Paket bzw. tmpfs aus
# docker-compose) und wird hier bewusst nicht angefasst: ohne CAP_DAC_OVERRIDE
# darf root ein fremdes 700-Verzeichnis nicht einmal lesen.
mkdir -p "${LAUFZEIT}"

# s6-overlay (Home-Assistant-Basisimage) reicht die Container-Umgebung nicht
# an CMD durch, legt sie aber unter /run/s6/container_environment/ ab.
if [ -z "${SUPERVISOR_TOKEN:-}" ] && [ -r /run/s6/container_environment/SUPERVISOR_TOKEN ]; then
    SUPERVISOR_TOKEN=$(cat /run/s6/container_environment/SUPERVISOR_TOKEN)
fi

if [ -n "${SUPERVISOR_TOKEN:-}" ]; then
    # Läuft in Home Assistant: Nur der Ingress-Proxy des Supervisors
    # (172.30.32.2) darf zugreifen. So ist die App ausschließlich über die
    # Home-Assistant-Oberfläche (mit deren Anmeldung) erreichbar.
    echo "[run.sh] Home Assistant erkannt - Zugriff nur ueber Ingress."
    {
        echo "allow 172.30.32.2;"
        echo "allow 127.0.0.1;"
        echo "deny all;"
    } > "${ZUGRIFF}"
else
    # Standalone-Betrieb mit „docker run“: offen lassen.
    echo "[run.sh] Standalone-Betrieb - Zugriff fuer alle Adressen offen."
    echo "allow all;" > "${ZUGRIFF}"
fi

# Nur chown (CAP_CHOWN), kein chmod: das bräuchte CAP_FOWNER, sobald das
# Verzeichnis nginx gehört – und so wenig Capabilities wie möglich ist das Ziel.
chown -R nginx:nginx "${LAUFZEIT}"

# Rechte abgeben: Master- und Worker-Prozesse laufen als „nginx“ (uid 100).
# -e stderr: Fehlerprotokoll auf stderr, bevor die Konfiguration gelesen ist.
echo "[run.sh] Starte nginx als Nutzer nginx."
exec su-exec nginx:nginx nginx -e stderr -g 'daemon off;'
