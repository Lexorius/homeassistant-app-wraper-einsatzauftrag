#!/bin/sh
# Startskript der App. Entscheidet, wer auf nginx zugreifen darf, und
# startet nginx im Vordergrund.
set -eu

ZUGRIFF=/etc/nginx/zugriff.conf

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

exec nginx -g 'daemon off;'
