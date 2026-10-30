// Entfernt den extern geladenen GoatCounter-Zähler (gc.zgo.at) aus der
// gebauten index.html. Wird im Dockerfile nach „npm run web:build“ aufgerufen.
// Aufruf: node zaehler-entfernen.mjs <pfad/zu/index.html>
import { readFileSync, writeFileSync } from "node:fs";

const pfad = process.argv[2];
if (!pfad) {
    console.error("Aufruf: node zaehler-entfernen.mjs <index.html>");
    process.exit(2);
}

const vorher = readFileSync(pfad, "utf8");
// Der erste <script>-Block, der gc.zgo.at enthält, komplett ersetzen.
const nachher = vorher.replace(
    /<script>(?:(?!<\/script>)[\s\S])*?gc\.zgo\.at[\s\S]*?<\/script>/,
    "<!-- Zähler (GoatCounter) im Home-Assistant-Add-on entfernt -->"
);

if (vorher === nachher) {
    console.warn("Hinweis: kein Zähler-Skript in", pfad, "gefunden, nichts entfernt.");
} else {
    writeFileSync(pfad, nachher);
    console.log("Zähler aus", pfad, "entfernt.");
}
