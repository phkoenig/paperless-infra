import email
import os
import time
import requests
import json
import quopri
from email import policy
from email.parser import BytesParser

MAIL_DIR = os.environ.get("EML_INPUT_DIR", "/usr/src/paperless/data/mail")
OUT_DIR = os.environ.get("EML_OUTPUT_DIR", "/usr/src/paperless/consume/emails")
GOTENBERG_URL = os.environ.get("GOTENBERG_URL", "http://gotenberg:3000")

os.makedirs(OUT_DIR, exist_ok=True)


def render_html_to_pdf(html_pages: list, dest_path: str) -> None:
    """
    Konvertiert eine oder mehrere HTML-Seiten zu einem PDF
    html_pages: Liste von HTML-Strings (eine pro Seite)
    """
    files = {}
    
    # Erste Seite (E-Mail Body) - UTF-8 mit BOM für korrekte Zeichenkodierung
    files["index.html"] = ("index.html", html_pages[0].encode("utf-8-sig"), "text/html; charset=utf-8")
    
    # Optional: Attachments-Seite - UTF-8 mit BOM für korrekte Zeichenkodierung
    if len(html_pages) > 1 and html_pages[1]:
        files["attachments.html"] = ("attachments.html", html_pages[1].encode("utf-8-sig"), "text/html; charset=utf-8")
    
    resp = requests.post(
        f"{GOTENBERG_URL}/forms/chromium/convert/html", 
        files=files, 
        timeout=60
    )
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(resp.content)


def extract_body_and_attachments(eml_path: str) -> tuple:
    """
    Extrahiert E-Mail Body + erstellt optional Attachments-Seite
    Returns: (body_html, attachments_page_html)
    """
    # E-Mail parsen mit korrektem Encoding-Handling
    with open(eml_path, "rb") as f:
        msg = BytesParser(policy=policy.default).parse(f)
    
    # Body extrahieren mit MANUELLEM Decoding (wegen Quoted-Printable Bug)
    html_part = None
    text_part = None
    
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/html" and html_part is None:
                html_part = part
            elif ctype == "text/plain" and text_part is None:
                text_part = part
    else:
        ctype = msg.get_content_type()
        if ctype == "text/html":
            html_part = msg
        elif ctype == "text/plain":
            text_part = msg
    
    # INTELLIGENTES CHARSET-DETECTION (behebt UTF-8 Probleme)
    html = None
    text = None
    
    if html_part:
        payload = html_part.get_payload(decode=True)  # Dekodiert Quoted-Printable/Base64
        declared_charset = html_part.get_content_charset() or 'utf-8'
        
        # SMART FIX: Prüfe ob Payload tatsächlich UTF-8 ist (ignoriert falschen Header!)
        actual_charset = declared_charset
        try:
            # Versuche UTF-8 decode (stricte Prüfung)
            test_decode = payload.decode('utf-8', errors='strict')
            # Erfolg! Payload ist valides UTF-8
            actual_charset = 'utf-8'
            print(f"   ✅ Charset-Override: Header={declared_charset} → Detected=utf-8")
        except UnicodeDecodeError:
            # Payload ist NICHT UTF-8, verwende deklarierten Charset
            actual_charset = declared_charset
            print(f"   📝 Using declared charset: {declared_charset}")
        
        # Dekodiere mit korrektem Charset
        html = payload.decode(actual_charset, errors='replace')
                    
    elif text_part:
        payload = text_part.get_payload(decode=True)
        declared_charset = text_part.get_content_charset() or 'utf-8'
        
        # SMART FIX: Auch für Text-Parts
        actual_charset = declared_charset
        try:
            test_decode = payload.decode('utf-8', errors='strict')
            actual_charset = 'utf-8'
            print(f"   ✅ Charset-Override (text): Header={declared_charset} → Detected=utf-8")
        except UnicodeDecodeError:
            actual_charset = declared_charset
        
        text = payload.decode(actual_charset, errors='replace')
    
    if html:
        # UTF-8 Meta-Tag hinzufügen falls nicht vorhanden
        if '<meta charset' not in html.lower():
            if '<head>' in html:
                html = html.replace('<head>', '<head>\n    <meta charset="UTF-8">')
            else:
                html = '<html><head><meta charset="UTF-8"></head><body>' + html + '</body></html>'
        body_html = html
    elif text:
        body_html = f'<html><head><meta charset="UTF-8"></head><body><pre>{text}</pre></body></html>'
    else:
        body_html = '<html><head><meta charset="UTF-8"></head><body><p>(No body)</p></body></html>'
    
    # Metadata lesen und Attachments-Seite erstellen
    metadata_path = os.path.join(os.path.dirname(eml_path), "email-metadata.json")
    attachments_html = ""
    
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            attachments_html = create_attachments_page(metadata)
        except Exception as e:
            print(f"   ⚠️  Warning: Could not read metadata: {e}")
    
    return body_html, attachments_html


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


def main():
    print(f"🚀 eml2pdf started!")
    print(f"📂 Input dir: {MAIL_DIR}")
    print(f"📂 Output dir: {OUT_DIR}")
    print(f"🌐 Gotenberg URL: {GOTENBERG_URL}")
    
    # Rekursiv durch alle Unterordner suchen
    print(f"🔍 Scanning {MAIL_DIR} for .eml files...")
    file_count = 0
    processed_count = 0
    
    for root, dirs, files in os.walk(MAIL_DIR):
        for name in files:
            if not name.lower().endswith(".eml"):
                continue
            file_count += 1
            path = os.path.join(root, name)
            
            # Prüfe ob PDF bereits existiert
            base = os.path.splitext(os.path.basename(name))[0]
            rel_dir = os.path.relpath(root, MAIL_DIR)
            if rel_dir == ".":
                dest = os.path.join(OUT_DIR, f"{base}.pdf")
            else:
                dest_dir = os.path.join(OUT_DIR, rel_dir)
                os.makedirs(dest_dir, exist_ok=True)
                dest = os.path.join(dest_dir, f"{base}.pdf")
            
            if os.path.exists(dest):
                print(f"⏭️  PDF already exists: {base}.pdf")
                continue
                
            try:
                print(f"📧 Processing: {name}")
                body_html, attachments_html = extract_body_and_attachments(path)
                print(f"   Body extracted: {len(body_html)} chars")
                
                # HTML-Seiten vorbereiten
                html_pages = [body_html]
                if attachments_html:
                    html_pages.append(attachments_html)
                    print(f"   Attachments page created")
                
                print(f"   Converting to PDF: {dest}")
                render_html_to_pdf(html_pages, dest)
                processed_count += 1
                print(f"✅ Success: {name} → {base}.pdf")
            except Exception as e:
                print(f"❌ Error processing {path}: {e}")
                import traceback
                traceback.print_exc()
                continue
    
    print(f"📊 Found {file_count} .eml files, processed {processed_count} new PDFs")
    print(f"✅ eml2pdf completed!")


if __name__ == "__main__":
    main()
