#!/usr/bin/env python3
"""
🔄 TABULA RASA - Vollständiger System-Reset
==========================================

Dieses Skript setzt das gesamte Paperless-System auf Null zurück:
- Supabase Datenbank leeren
- Paperless-NGX Dokumente löschen  
- Google Drive Ordner leeren
- Server Ordner leeren
- Docker Logs zurücksetzen

Verwendung:
    python scripts/tabula-rasa-reset.py [--confirm]
    
    --confirm: Bestätigt die Ausführung (verhindert versehentliche Löschung)
"""

import os
import sys
import subprocess
import argparse
import time
from datetime import datetime

# Supabase Configuration
SUPABASE_URL = "https://jpmhwyjiuodsvjowddsm.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E"

# Server Configuration
SERVER_HOST = "paperless"
SERVER_USER = "ubuntu"
SERVER_PATH = "/home/ubuntu/paperless-infra"

def print_banner():
    """Zeigt das Tabula Rasa Banner"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                    🔄 TABULA RASA RESET                     ║
║                                                              ║
║  ⚠️  WARNUNG: Dieses Skript löscht ALLE Daten!              ║
║  📋 Supabase, Paperless, Google Drive, Server               ║
║  🗑️  Alle Dokumente, Ordner, Logs werden gelöscht          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)

def run_command(command, description, check=True):
    """Führt einen Befehl aus und zeigt den Status"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        if result.returncode == 0:
            print(f"✅ {description} - Erfolgreich")
            return True
        else:
            print(f"❌ {description} - Fehler: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - Exception: {str(e)}")
        return False

def ssh_command(command, description):
    """Führt einen SSH-Befehl aus"""
    full_command = f'ssh {SERVER_HOST} "{command}"'
    return run_command(full_command, description)

def reset_supabase():
    """Leert alle Supabase Tabellen"""
    print("\n🗄️  SUPABASE DATENBANK LEEREN")
    print("=" * 50)
    
    # Importiere Supabase Client
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except ImportError:
        print("❌ Supabase Client nicht installiert. Installiere mit: pip install supabase")
        return False
    
    tables_to_clear = [
        "paperless_documents_index",
        "email_filter_decisions", 
        "email_whitelist",
        "email_blacklist"
    ]
    
    for table in tables_to_clear:
        try:
            result = supabase.table(table).delete().neq("id", 0).execute()
            print(f"✅ {table} geleert")
        except Exception as e:
            print(f"⚠️  {table}: {str(e)}")
    
    return True

def reset_paperless():
    """Leert alle Paperless-NGX Dokumente"""
    print("\n📄 PAPERLESS-NGX LEEREN")
    print("=" * 50)
    
    commands = [
        # Alle Dokumente löschen
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Document; Document.objects.all().delete(); print('Alle Dokumente gelöscht')\"",
        
        # Alle Tags löschen (außer Standard)
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Tag; Tag.objects.exclude(name__in=['important', 'archive']).delete(); print('Tags gelöscht')\"",
        
        # Alle Correspondents löschen
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Correspondent; Correspondent.objects.all().delete(); print('Correspondents gelöscht')\"",
        
        # Alle Document Types löschen
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import DocumentType; DocumentType.objects.all().delete(); print('Document Types gelöscht')\"",
    ]
    
    for command in commands:
        ssh_command(command, "Paperless-NGX leeren")

def reset_google_drive():
    """Leert Google Drive Ordner (manuell)"""
    print("\n☁️  GOOGLE DRIVE ORDNER")
    print("=" * 50)
    print("⚠️  MANUELLE AUSFÜHRUNG ERFORDERLICH!")
    print()
    print("📋 Führe diese Schritte in Google Drive aus:")
    print("   1. Gehe zu Google Drive (philip@zepta.com)")
    print("   2. Suche nach: 'Paperless-Emails'")
    print("   3. Lösche ALLE Ordner in diesem Ordner")
    print("   4. Suche nach: 'Paperless-Attachments'") 
    print("   5. Lösche ALLE Ordner in diesem Ordner")
    print()
    print("📋 Wiederhole für phkoenig@gmail.com:")
    print("   1. Wechsle zu phkoenig@gmail.com")
    print("   2. Wiederhole die gleichen Schritte")
    print()
    
    input("⏸️  Drücke Enter wenn Google Drive geleert wurde...")

def reset_server():
    """Leert alle Server-Ordner"""
    print("\n🖥️  SERVER ORDNER LEEREN")
    print("=" * 50)
    
    commands = [
        # Consume Ordner leeren
        "rm -rf /opt/paperless/consume/emails/*",
        "rm -rf /opt/paperless/consume/emails_pdf/*", 
        "rm -rf /opt/paperless/consume/gdrive-office/*",
        "rm -rf /opt/paperless/consume/gdrive-philip/*",
        
        # Docker Logs zurücksetzen
        "cd /home/ubuntu/paperless-infra && docker compose -f infra/docker-compose.yml logs --tail=0 > /dev/null 2>&1",
        
        # Docker Container neu starten (für saubere Logs)
        "cd /home/ubuntu/paperless-infra && docker compose -f infra/docker-compose.yml restart"
    ]
    
    for command in commands:
        ssh_command(command, f"Server: {command.split('/')[-1]}")

def reset_docker_logs():
    """Setzt Docker Logs zurück"""
    print("\n🐳 DOCKER LOGS ZURÜCKSETZEN")
    print("=" * 50)
    
    commands = [
        # Alle Container stoppen
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml down",
        
        # Docker System bereinigen
        "docker system prune -f",
        
        # Container neu starten
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml up -d",
        
        # Warten bis Services bereit sind
        "sleep 30"
    ]
    
    for command in commands:
        ssh_command(command, "Docker System Reset")

def verify_reset():
    """Überprüft ob der Reset erfolgreich war"""
    print("\n✅ VERIFICATION")
    print("=" * 50)
    
    # Supabase Check
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        result = supabase.table("paperless_documents_index").select("*").execute()
        print(f"📊 Supabase Index: {len(result.data)} Einträge")
        
    except Exception as e:
        print(f"⚠️  Supabase Check: {str(e)}")
    
    # Paperless Check
    ssh_command(
        f"cd {SERVER_PATH} && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Document; print(f'Paperless Documents: {{Document.objects.count()}}')\"",
        "Paperless Dokumente zählen"
    )
    
    # Server Ordner Check
    ssh_command(
        "find /opt/paperless/consume -maxdepth 2 -type f | wc -l",
        "Server Dateien zählen"
    )

def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description="Tabula Rasa - Vollständiger System Reset")
    parser.add_argument("--confirm", action="store_true", 
                       help="Bestätigt die Ausführung (verhindert versehentliche Löschung)")
    
    args = parser.parse_args()
    
    print_banner()
    
    if not args.confirm:
        print("❌ FEHLER: --confirm Flag erforderlich!")
        print("   Verwendung: python scripts/tabula-rasa-reset.py --confirm")
        print("   ⚠️  Dies verhindert versehentliche Löschung aller Daten!")
        sys.exit(1)
    
    print(f"🕐 Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Reset-Sequenz
    steps = [
        ("Supabase Datenbank", reset_supabase),
        ("Paperless-NGX", reset_paperless), 
        ("Google Drive", reset_google_drive),
        ("Server Ordner", reset_server),
        ("Docker Logs", reset_docker_logs),
        ("Verification", verify_reset)
    ]
    
    for step_name, step_function in steps:
        print(f"\n🔄 {step_name.upper()}")
        print("=" * 60)
        
        try:
            step_function()
            print(f"✅ {step_name} - Abgeschlossen")
        except Exception as e:
            print(f"❌ {step_name} - Fehler: {str(e)}")
            continue
    
    print(f"\n🎉 TABULA RASA ABGESCHLOSSEN!")
    print(f"🕐 Ende: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("📋 NÄCHSTE SCHRITTE:")
    print("   1. Führe Apps Script 'exportToPaperless' aus")
    print("   2. Warte auf rclone Sync (ca. 5 Min)")
    print("   3. Warte auf eml2pdf Konvertierung")
    print("   4. Überprüfe Paperless-NGX für neue Dokumente")

if __name__ == "__main__":
    main()
