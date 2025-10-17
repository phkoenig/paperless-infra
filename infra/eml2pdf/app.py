import email
import os
import time
import requests
from email import policy
from email.parser import BytesParser

MAIL_DIR = os.environ.get("EML_INPUT_DIR", "/usr/src/paperless/data/mail")
OUT_DIR = os.environ.get("EML_OUTPUT_DIR", "/usr/src/paperless/consume/emails")
GOTENBERG_URL = os.environ.get("GOTENBERG_URL", "http://gotenberg:3000")

os.makedirs(OUT_DIR, exist_ok=True)


def render_html_to_pdf(html: str, dest_path: str) -> None:
    files = {
        "index.html": ("index.html", html.encode("utf-8"), "text/html"),
    }
    resp = requests.post(f"{GOTENBERG_URL}/forms/chromium/convert/html", files=files, timeout=60)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(resp.content)


def extract_body(eml_path: str) -> str:
    with open(eml_path, "rb") as f:
        msg = BytesParser(policy=policy.default).parse(f)
    # Prefer HTML, fallback to plain text
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
        return html
    if text:
        # simple HTML wrapper
        return f"<html><body><pre>{text}</pre></body></html>"
    return "<html><body><p>(No body)</p></body></html>"


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
                body = extract_body(path)
                print(f"   Body extracted: {len(body)} chars")
                print(f"   Converting to PDF: {dest}")
                render_html_to_pdf(body, dest)
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
