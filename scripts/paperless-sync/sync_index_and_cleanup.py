#!/usr/bin/env python3
"""
Paperless-NGX Index Synchronization & Cleanup Script

Aufgaben:
1. Synchronisiert paperless_documents_index mit tatsächlich importierten Dokumenten
2. Räumt "failed" Duplikate aus consume/ Ordner auf
3. Aktualisiert Paperless-IDs in Supabase-Index

Soll täglich via Cron laufen.
"""

import os
import sys
import json
import hashlib
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from supabase import create_client, Client

# ============================================
# CONFIGURATION
# ============================================

# Paperless-NGX
PAPERLESS_URL = os.getenv("PAPERLESS_URL", "http://localhost:8000")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "08303a894fc26772730f3f5f8802b70837ca48c3")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jpmhwyjiuodsvjowddsm.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E")

# Paths
CONSUME_DIR = Path("/usr/src/paperless/consume")
FAILED_DIR = CONSUME_DIR / "failed"

# ============================================
# CLIENTS
# ============================================

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

paperless_headers = {
    "Authorization": f"Token {PAPERLESS_TOKEN}",
    "Content-Type": "application/json"
}


# ============================================
# PAPERLESS API FUNCTIONS
# ============================================

def get_all_paperless_documents() -> List[Dict]:
    """Hole alle Dokumente aus Paperless"""
    all_docs = []
    page = 1
    
    print("📥 Lade alle Paperless-Dokumente...")
    
    while True:
        url = f"{PAPERLESS_URL}/api/documents/?page={page}&page_size=100"
        response = requests.get(url, headers=paperless_headers)
        
        if response.status_code != 200:
            print(f"❌ Fehler beim Laden von Dokumenten: {response.status_code}")
            break
        
        data = response.json()
        results = data.get("results", [])
        
        if not results:
            break
        
        all_docs.extend(results)
        print(f"   Seite {page}: {len(results)} Dokumente geladen (Total: {len(all_docs)})")
        
        if not data.get("next"):
            break
        
        page += 1
    
    print(f"✅ {len(all_docs)} Paperless-Dokumente geladen\n")
    return all_docs


def search_document_by_content(search_term: str) -> Optional[Dict]:
    """Suche Dokument in Paperless nach Inhalt"""
    url = f"{PAPERLESS_URL}/api/documents/?query={search_term}&page_size=5"
    response = requests.get(url, headers=paperless_headers)
    
    if response.status_code == 200:
        results = response.json().get("results", [])
        return results[0] if results else None
    
    return None


# ============================================
# SUPABASE INDEX FUNCTIONS
# ============================================

def get_index_entries_without_paperless_id() -> List[Dict]:
    """Hole alle Index-Einträge ohne Paperless-ID"""
    try:
        response = supabase.table("paperless_documents_index")\
            .select("*")\
            .is_("paperless_id", "null")\
            .execute()
        
        return response.data
    except Exception as e:
        print(f"❌ Fehler beim Laden von Index-Einträgen: {e}")
        return []


def update_index_paperless_id(rfc_message_id: str, paperless_id: int, notes: str = None):
    """Aktualisiere Paperless-ID im Index"""
    try:
        data = {
            "paperless_id": paperless_id,
            "updated_at": datetime.now().isoformat()
        }
        
        if notes:
            data["notes"] = notes
        
        response = supabase.table("paperless_documents_index")\
            .update(data)\
            .eq("rfc_message_id", rfc_message_id)\
            .execute()
        
        return True
    except Exception as e:
        print(f"❌ Fehler beim Update: {e}")
        return False


# ============================================
# SYNC & CLEANUP LOGIC
# ============================================

def sync_index_with_paperless():
    """
    Synchronisiere Index mit Paperless:
    - Finde Dokumente in Paperless die im Index fehlen (paperless_id = null)
    - Aktualisiere Index mit Paperless-IDs
    """
    print("🔄 SYNC: Index mit Paperless synchronisieren...\n")
    
    # 1. Hole alle Index-Einträge ohne Paperless-ID
    pending_entries = get_index_entries_without_paperless_id()
    
    if not pending_entries:
        print("✅ Keine pendenden Index-Einträge gefunden\n")
        return
    
    print(f"📋 {len(pending_entries)} Index-Einträge ohne Paperless-ID gefunden")
    
    # 2. Hole alle Paperless-Dokumente
    all_docs = get_all_paperless_documents()
    
    if not all_docs:
        print("⚠️  Keine Paperless-Dokumente gefunden\n")
        return
    
    # 3. Versuche Match über Content-Suche (Email-Betreff, Absender)
    matched_count = 0
    
    for entry in pending_entries:
        message_id = entry.get("rfc_message_id")
        email_subject = entry.get("email_subject", "")
        email_from = entry.get("email_from", "")
        
        print(f"\n🔍 Suche Dokument für Message-ID: {message_id[:50]}...")
        print(f"   Betreff: {email_subject[:60]}")
        
        # Versuche Match über Betreff
        if email_subject:
            # Suche in Paperless nach Betreff
            for doc in all_docs:
                doc_title = doc.get("title", "").lower()
                doc_content = doc.get("content", "").lower()
                
                # Check ob Betreff im Titel oder Content vorkommt
                if email_subject.lower()[:30] in doc_title or email_subject.lower()[:30] in doc_content:
                    # Möglicher Match gefunden
                    print(f"   ✅ Match gefunden: Paperless-ID {doc['id']} - {doc['title'][:60]}")
                    
                    # Update Index
                    if update_index_paperless_id(
                        message_id, 
                        doc['id'],
                        notes=f"Matched by subject/content similarity (sync script)"
                    ):
                        matched_count += 1
                        break
                    else:
                        print(f"   ⚠️  Update fehlgeschlagen")
                        break
            else:
                print(f"   ⚠️  Kein Match gefunden")
    
    print(f"\n✅ Sync abgeschlossen: {matched_count}/{len(pending_entries)} Einträge aktualisiert\n")


def cleanup_failed_duplicates():
    """
    Räume fehlgeschlagene Duplikate auf:
    - Prüfe failed/ Ordner
    - Vergleiche mit existierenden Dokumenten
    - Lösche bekannte Duplikate
    """
    print("🧹 CLEANUP: Fehlgeschlagene Duplikate aufräumen...\n")
    
    if not FAILED_DIR.exists():
        print(f"✅ Kein failed/ Ordner vorhanden: {FAILED_DIR}\n")
        return
    
    # Hole alle Paperless-Dokumente
    all_docs = get_all_paperless_documents()
    
    if not all_docs:
        print("⚠️  Keine Paperless-Dokumente gefunden - Cleanup übersprungen\n")
        return
    
    # Erstelle Set aller Dokumenten-Hashes in Paperless
    existing_hashes = {doc.get("checksum") for doc in all_docs if doc.get("checksum")}
    print(f"📊 {len(existing_hashes)} eindeutige Dokument-Hashes in Paperless")
    
    # Durchsuche failed/ Ordner
    failed_files = list(FAILED_DIR.glob("**/*"))
    failed_files = [f for f in failed_files if f.is_file()]
    
    if not failed_files:
        print(f"✅ Keine fehlgeschlagenen Dateien in {FAILED_DIR}\n")
        return
    
    print(f"📋 {len(failed_files)} fehlgeschlagene Dateien gefunden")
    
    deleted_count = 0
    skipped_count = 0
    
    for failed_file in failed_files:
        # Berechne SHA-256 Hash der fehlgeschlagenen Datei
        try:
            with open(failed_file, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            
            # Prüfe ob Hash bereits in Paperless existiert
            if file_hash in existing_hashes:
                print(f"   🔁 DUPLIKAT: {failed_file.name} (Hash existiert in Paperless)")
                
                # Lösche Duplikat
                failed_file.unlink()
                deleted_count += 1
                print(f"   🗑️  Gelöscht: {failed_file.name}")
            else:
                skipped_count += 1
        
        except Exception as e:
            print(f"   ❌ Fehler bei {failed_file.name}: {e}")
            skipped_count += 1
    
    print(f"\n✅ Cleanup abgeschlossen:")
    print(f"   🗑️  {deleted_count} Duplikate gelöscht")
    print(f"   ⏭️  {skipped_count} Dateien übersprungen (nicht in Paperless)\n")


# ============================================
# MAIN
# ============================================

def main():
    """Hauptfunktion"""
    print("=" * 60)
    print("📊 Paperless-NGX Index Sync & Cleanup Script")
    print("=" * 60)
    print(f"⏰ Gestartet: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        # 1. Synchronisiere Index mit Paperless
        sync_index_with_paperless()
        
        # 2. Räume fehlgeschlagene Duplikate auf
        cleanup_failed_duplicates()
        
        print("=" * 60)
        print("✅ Script erfolgreich abgeschlossen")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Fehler: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

