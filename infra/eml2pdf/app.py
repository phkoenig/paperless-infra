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
    seen = set()
    while True:
        try:
            for name in os.listdir(MAIL_DIR):
                if not name.lower().endswith(".eml"):
                    continue
                path = os.path.join(MAIL_DIR, name)
                if path in seen:
                    continue
                try:
                    body = extract_body(path)
                    base = os.path.splitext(os.path.basename(name))[0]
                    dest = os.path.join(OUT_DIR, f"{base}.pdf")
                    render_html_to_pdf(body, dest)
                    seen.add(path)
                except Exception:
                    # skip and retry later
                    continue
            time.sleep(10)
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    main()
