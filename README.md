# <img src="icons/icon48.png" width="32" alt=""> Rainbow Hearts

Chrome-Erweiterung, die blaue Herz-Emoji (💙 und 🩵) auf Webseiten durch Regenbogenherzen ersetzt.

Funktioniert in allen Chromium-basierten Browsern (Chrome, Edge, Brave, Opera, Vivaldi …).

## Was ersetzt wird

- 💙 und 🩵 im normalen Seitentext
- Emoji, die als Bild eingebunden sind (`<img alt="💙">`, z. B. bei X oder Discord)
- nachgeladene Inhalte wie Feeds, Chats oder Single-Page-Apps

**Nicht** angefasst werden Eingabefelder, Textareas und bearbeitbare Bereiche (`contenteditable`). Was du selbst tippst und absendest, bleibt also unverändert.

Emoji, die eine Seite als CSS-Hintergrundbild einbaut, werden nicht ersetzt.

## Installation

Die Erweiterung ist nicht im Chrome Web Store, sie wird lokal geladen:

1. Repo klonen oder als ZIP herunterladen und entpacken.
2. `chrome://extensions` öffnen (in Edge: `edge://extensions`).
3. Oben rechts den **Entwicklermodus** einschalten.
4. **„Entpackte Erweiterung laden“** klicken und den Projektordner auswählen.

Nach Änderungen am Code bei der Erweiterung auf **Neu laden** ↻ klicken.

## Bedienung

Ein Klick auf das Herz-Icon in der Symbolleiste öffnet einen An/Aus-Schalter. Er wirkt sofort in allen offenen Tabs: Beim Ausschalten kommen die originalen Emoji zurück. Die Einstellung wird über dein Browserprofil synchronisiert.

## Projektaufbau

| Datei | Zweck |
|---|---|
| `manifest.json` | Manifest V3 |
| `content.js` | Ersetzt die Herzen auf den Seiten |
| `heart.svg` | Das eingesetzte Regenbogenherz |
| `popup.html`, `popup.js` | An/Aus-Schalter |
| `_locales/` | Texte auf Englisch (Standard) und Deutsch |
| `icon.svg` | Vorlage für das Icon |
| `icons/` | Icon als PNG in 16, 32, 48 und 128 px |
| `render-icons.ps1` | Erzeugt `icons/` aus `icon.svg` |
| `test.html` | Selbsttest für `content.js` |

## Entwicklung

### Test

`test.html` lädt `content.js` mit nachgebauten Chrome-APIs und prüft Ersetzen, Ausschalten und Wiedereinschalten. Die Seite muss über einen lokalen Server laufen:

```bash
python -m http.server 8765
```

Dann `http://localhost:8765/test.html` öffnen. Unten steht `ALLE OK` oder die fehlgeschlagenen Checks.

### Veröffentlichen im Chrome Web Store

Ein Tag wie `v1.0.1` startet [.github/workflows/webstore.yml](.github/workflows/webstore.yml). Der Workflow setzt die Version aus dem Tag in `manifest.json`, packt die Erweiterung, lädt sie hoch und reicht sie zur Prüfung ein. Nach der Freigabe durch Google geht sie automatisch live.

```bash
git tag v1.0.1
git push origin v1.0.1
```

Die Version muss bei jedem Tag höher sein als die zuletzt hochgeladene.

#### Einmalige Einrichtung

**1. Erste Version von Hand hochladen.** Die API kann nur bestehende Einträge aktualisieren.

ZIP bauen (PowerShell):

```bash
Compress-Archive -Force manifest.json, content.js, heart.svg, popup.html, popup.js, icons, _locales extension.zip
```

Im [Developer Dashboard](https://chrome.google.com/webstore/devconsole) „Neuen Artikel hinzufügen“ wählen, `extension.zip` hochladen und die Tabs **Store-Eintrag** (Beschreibung, Screenshots) und **Datenschutz** ausfüllen:
- Einziger Zweck: blaue Herz-Emoji durch Regenbogenherzen ersetzen.
- `storage`: speichert den An/Aus-Schalter.
- Hostberechtigung (alle Seiten): die Herzen sollen auf jeder Seite ersetzt werden.
- Es werden keine Nutzerdaten erhoben.

Danach einmal von Hand einreichen. Die **Artikel-ID** (32 Buchstaben) steht beim Eintrag, die **Publisher-ID** in der Dashboard-URL: `…/devconsole/<PUBLISHER_ID>/…`.

**2. Google Cloud: Dienstkonto mit Anmeldung per GitHub.** Das kommt ganz ohne Passwort oder Schlüssel aus, denn GitHub Actions weist sich bei Google über OIDC aus. Ein Projekt in der [Cloud Console](https://console.cloud.google.com) anlegen, die [Cloud Shell](https://shell.cloud.google.com) öffnen und dort ausführen:

```bash
gcloud config set project <PROJEKT-ID>   # ID aus: gcloud projects list

REPO=JensFZ/rainbow-hearts
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA=cws-deploy@$PROJECT_ID.iam.gserviceaccount.com

gcloud services enable chromewebstore.googleapis.com iamcredentials.googleapis.com
gcloud iam service-accounts create cws-deploy
gcloud iam workload-identity-pools create github --location=global
gcloud iam workload-identity-pools providers create-oidc rainbow-hearts \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
  --attribute-condition="assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

echo "GCP_WIF_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/rainbow-hearts"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

**3. Dienstkonto im Web Store freischalten.** Im Developer Dashboard unter **Konto** die E-Mail-Adresse des Dienstkontos (`GCP_SERVICE_ACCOUNT`) eintragen.

**4. GitHub-Variablen setzen.** Keine davon ist geheim, deshalb Variablen statt Secrets:

```bash
gh variable set CWS_PUBLISHER_ID --body "<Publisher-ID>"
gh variable set CWS_EXTENSION_ID --body "<Artikel-ID>"
gh variable set GCP_WIF_PROVIDER --body "<Ausgabe aus Schritt 2>"
gh variable set GCP_SERVICE_ACCOUNT --body "<Ausgabe aus Schritt 2>"
```

### Store-Grafiken

`store/assets.html` ist die Vorlage für Screenshot und Werbekacheln. `store/render-store.ps1` erzeugt daraus in `store/out/` das Händlersymbol (128 px), einen Screenshot (1280×800) und die kleine und große Werbekachel (440×280, 1400×560). Screenshot und Kacheln sind wie vom Store verlangt ohne Alpha-Kanal:

```bash
powershell -ExecutionPolicy Bypass -File .\store\render-store.ps1
```

### Icon ändern

`icon.svg` bearbeiten, dann die PNGs neu erzeugen (braucht Chrome und Python mit Pillow):

```bash
powershell -ExecutionPolicy Bypass -File .\render-icons.ps1
```

## Datenschutz

Rainbow Hearts erhebt und überträgt keine Daten, siehe [Datenschutzerklärung](PRIVACY.md).

## Lizenz

[MIT](LICENSE)
