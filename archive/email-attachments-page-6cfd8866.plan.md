<!-- 6cfd8866-b119-4d9f-83e6-29888e8d51b7 a2b3528c-786b-4521-bf7f-9d4e032e6976 -->
# Email PDF Attachments-Seite Implementation

## Ziel

E-Mails mit Anhängen bekommen eine zusätzliche letzte Seite im PDF mit der Überschrift "Attachments" und einer vollständigen Liste aller Anhänge inklusive Metadaten und Paperless-Suchlink.

## Anforderungen

- Attachments-Seite nur wenn Anhänge vorhanden sind
- Pro Attachment anzeigen: Dateiname + Dateigröße
- Klickbarer Button "Zeige alle Anhänge in Paperless"
- Am Ende alle relevanten Metadaten (Message-ID, Thread-ID, Export-Info)
- Sauberes, professionelles Layout

## Dateien zum Ändern

### 1. `infra/eml2pdf/app.py`

#### Neue Funktion hinzufügen (nach Zeile 49):

```python
def format_file_size(size_bytes: int) -> str:
    """Formatiert Dateigröße in lesbares Format (KB, MB)"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def create_attachments_page(metadata: dict) -> str:
    """
    Erstellt HTML für Attachments-Seite mit:
 - Überschrift "Attachments"
 - Liste aller Anhänge (Name + Größe)
 - Paperless-Suchlink
 - Metadaten (Message-ID, Thread-ID, etc.)
    """
    attachments = metadata.get('attachments', [])
    message_id = metadata.get('messageId', 'unknown')
    
    if not attachments:
        return ""  # Keine Seite wenn keine Attachments
    
    # HTML für Attachments-Seite
    html = """
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 40px;
                color: #333;
            }
            h1 {
                color: #0066cc;
                border-bottom: 3px solid #0066cc;
                padding-bottom: 10px;
            }
            .attachment-list {
                list-style: none;
                padding: 0;
            }
            .attachment-item {
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border-left: 4px solid #0066cc;
            }
            .filename {
                font-weight: bold;
                font-size: 1.1em;
            }
            .filesize {
                color: #666;
                margin-left: 10px;
            }
            .paperless-button {
                display: inline-block;
                margin: 20px 0;
                padding: 15px 30px;
                background: #0066cc;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                font-size: 1.1em;
            }
            .metadata {
                margin-top: 40px;
                padding: 20px;
                background: #f0f0f0;
                border-radius: 5px;
                font-size: 0.9em;
            }
            .metadata h3 {
                margin-top: 0;
                color: #555;
            }
            .metadata code {
                background: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <h1>📎 Attachments</h1>
        
        <p>Diese E-Mail enthält <strong>""" + str(len(attachments)) + """ Anhänge</strong>:</p>
        
        <ul class="attachment-list">
    """
    
    for att in attachments:
        filename = att.get('filename', 'unknown')
        size = att.get('size', 0)
        size_formatted = format_file_size(size)
        
        html += f"""
            <li class="attachment-item">
                <span class="filename">📄 {filename}</span>
                <span class="filesize">({size_formatted})</span>
            </li>
        """
    
    html += """
        </ul>
        
        <a href="http://paperless.zepta.com/documents/?custom_email_message_id=""" + message_id + """" 
           class="paperless-button">
            🔗 Zeige alle Anhänge in Paperless
        </a>
        
        <div class="metadata">
            <h3>Metadaten</h3>
    """
    
    # Alle relevanten Metadaten hinzufügen
    if 'messageId' in metadata:
        html += f"<p><strong>Message-ID:</strong> <code>{metadata['messageId']}</code></p>"
    if 'gmailThreadId' in metadata:
        html += f"<p><strong>Thread-ID:</strong> <code>{metadata['gmailThreadId']}</code></p>"
    if 'exportTimestamp' in metadata:
        html += f"<p><strong>Export:</strong> {metadata['exportTimestamp']}</p>"
    if 'exportedFrom' in metadata:
        html += f"<p><strong>Account:</strong> {metadata['exportedFrom']}</p>"
    
    html += """
        </div>
    </body>
    </html>
    """
    
    return html
```

#### Funktion `extract_body` erweitern (Zeile 25-49):

Umbenennen zu `extract_body_and_attachments` und erweitern:

```python
def extract_body_and_attachments(eml_path: str) -> tuple[str, str]:
    """
    Extrahiert E-Mail Body + erstellt optional Attachments-Seite
    Returns: (body_html, attachments_page_html)
    """
    # Originaler Code für Body-Extraktion bleibt gleich
    with open(eml_path, "rb") as f:
        msg = BytesParser(policy=policy.default).parse(f)
    
    # Body extrahieren (wie bisher)
    html = None
    text = None
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/html" and html is None:
                html = part.get_content()
            elif ctype == "text/plain" and text is None:
                text = part.get_content()
    else:
        ctype = msg.get_content_type()
        if ctype == "text/html":
            html = msg.get_content()
        elif ctype == "text/plain":
            text = msg.get_content()
    
    if html:
        body_html = html
    elif text:
        body_html = f"<html><body><pre>{text}</pre></body></html>"
    else:
        body_html = "<html><body><p>(No body)</p></body></html>"
    
    # Metadata lesen und Attachments-Seite erstellen
    metadata_path = os.path.join(os.path.dirname(eml_path), "email-metadata.json")
    attachments_html = ""
    
    if os.path.exists(metadata_path):
        import json
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        attachments_html = create_attachments_page(metadata)
    
    return body_html, attachments_html
```

#### Funktion `render_html_to_pdf` erweitern (Zeile 15-22):

Für Multi-Page PDF Support:

```python
def render_html_to_pdf(html_pages: list[str], dest_path: str) -> None:
    """
    Konvertiert eine oder mehrere HTML-Seiten zu einem PDF
    html_pages: Liste von HTML-Strings (eine pro Seite)
    """
    files = {}
    
    # Erste Seite (E-Mail Body)
    files["index.html"] = ("index.html", html_pages[0].encode("utf-8"), "text/html")
    
    # Optional: Attachments-Seite
    if len(html_pages) > 1 and html_pages[1]:
        files["attachments.html"] = ("attachments.html", html_pages[1].encode("utf-8"), "text/html")
    
    resp = requests.post(
        f"{GOTENBERG_URL}/forms/chromium/convert/html", 
        files=files, 
        timeout=60
    )
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(resp.content)
```

#### Funktion `main()` anpassen (Zeile 84-91):

```python
# Alte Zeilen 85-89:
# body = extract_body(path)
# render_html_to_pdf(body, dest)

# Neu:
body_html, attachments_html = extract_body_and_attachments(path)
html_pages = [body_html]
if attachments_html:
    html_pages.append(attachments_html)
render_html_to_pdf(html_pages, dest)
```

### 2. Import hinzufügen (Zeile 1):

```python
import json  # Für Metadata-Parsing
```

## Testing

1. Auf Server deployen: `docker compose up -d --build eml2pdf`
2. Test-Email mit Attachments verarbeiten lassen
3. PDF in Paperless prüfen:

                                                                                                                                                                                                - Letzte Seite sollte "Attachments" Überschrift haben
                                                                                                                                                                                                - Alle Anhänge mit Dateigröße aufgelistet
                                                                                                                                                                                                - Button klickbar und führt zu Paperless-Suche
                                                                                                                                                                                                - Metadaten am Ende sichtbar

## Rollback

Falls Probleme auftreten:

- `git checkout HEAD -- infra/eml2pdf/app.py`
- `docker compose up -d eml2pdf`

### To-dos

- [ ] Import 'json' zu infra/eml2pdf/app.py hinzufügen
- [ ] Funktion format_file_size() implementieren
- [ ] Funktion create_attachments_page() implementieren mit HTML-Template
- [ ] extract_body() zu extract_body_and_attachments() erweitern
- [ ] render_html_to_pdf() für Multi-Page Support anpassen
- [ ] main() Funktion anpassen für neue Funktionen
- [ ] Docker Service neu bauen und Test-Email verarbeiten