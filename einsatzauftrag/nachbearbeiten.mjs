// Nachbearbeitung des Vite-Builds, wird im Dockerfile nach „npm run web:build“ aufgerufen.
//
//   1. Entfernt den extern geladenen GoatCounter-Zähler (gc.zgo.at) aus allen HTML-Seiten.
//   2. Berechnet die CSP-Hashes aller Inline-<script>- und <style>-Blöcke und schreibt
//      daraus eine nginx-Datei mit dem Content-Security-Policy-Header. So braucht die
//      Policy kein 'unsafe-inline', bleibt aber bei jedem neuen App-Stand gültig.
//
// Aufruf: node nachbearbeiten.mjs <dist-Verzeichnis> <csp.conf-Ausgabe> [zaehlerEntfernen=true|false]
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dist, cspPfad, zaehlerEntfernen = "true"] = process.argv.slice(2);
if (!dist || !cspPfad) {
    console.error("Aufruf: node nachbearbeiten.mjs <dist> <csp.conf> [true|false]");
    process.exit(2);
}

const hash = text => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

const scriptHashes = new Set();
const styleHashes = new Set();

for (const name of readdirSync(dist).filter(n => n.endsWith(".html")).sort()) {
    const pfad = join(dist, name);
    let html = readFileSync(pfad, "utf8");

    if (zaehlerEntfernen === "true") {
        const vorher = html;
        html = html.replace(
            /<script>(?:(?!<\/script>)[\s\S])*?gc\.zgo\.at[\s\S]*?<\/script>/g,
            "<!-- Zähler (GoatCounter) in der Home-Assistant-App entfernt -->"
        );
        if (html !== vorher) {
            writeFileSync(pfad, html);
            console.log(`Zähler aus ${name} entfernt.`);
        }
    }

    // Inline-Skripte: <script> ohne src-Attribut
    for (const treffer of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        if (treffer[1].trim()) scriptHashes.add(hash(treffer[1]));
    }
    for (const treffer of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        if (treffer[1].trim()) styleHashes.add(hash(treffer[1]));
    }
    // Der Text der Datenschutzseite darf den Zähler erwähnen, nur Skript-Verweise zählen.
    if (zaehlerEntfernen === "true" && /gc\.zgo\.at/.test(html)) {
        console.warn(`Hinweis: ${name} lädt weiterhin ein Skript von gc.zgo.at.`);
    }
}

const richtlinie = [
    "default-src 'none'",
    `script-src 'self'${[...scriptHashes].map(h => " " + h).join("")}`,
    `style-src 'self'${[...styleHashes].map(h => " " + h).join("")}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
    // frame-ancestors bewusst nicht gesetzt: Home Assistant bettet die App per Ingress in ein iframe ein.
].join("; ");

writeFileSync(cspPfad,
    "# Automatisch erzeugt von nachbearbeiten.mjs beim Image-Bau – nicht von Hand ändern.\n" +
    `# Inline-Skripte: ${scriptHashes.size}, Inline-Styles: ${styleHashes.size}\n` +
    `add_header Content-Security-Policy "${richtlinie}" always;\n`
);
console.log(`CSP geschrieben nach ${cspPfad} (${scriptHashes.size} Skript-, ${styleHashes.size} Style-Hashes).`);
