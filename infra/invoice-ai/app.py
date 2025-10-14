import os
import time

MEDIA_DIR = os.environ.get("PAPERLESS_MEDIA_DIR", "/usr/src/paperless/media/documents")


def main():
    seen = set()
    while True:
        for root, _, files in os.walk(MEDIA_DIR):
            for f in files:
                if not f.lower().endswith(".pdf"):
                    continue
                path = os.path.join(root, f)
                if path in seen:
                    continue
                # TODO: OCR text extract via Paperless API or local; call LLM; update metadata
                print(f"invoice-ai-sidecar: queued {path}")
                seen.add(path)
        time.sleep(30)


if __name__ == "__main__":
    main()
