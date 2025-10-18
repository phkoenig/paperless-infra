#!/bin/bash
# 🔄 TABULA RASA - Vollständiger System-Reset (Bash Version)
# ===========================================================
# 
# Dieses Skript setzt das gesamte Paperless-System auf Null zurück:
# - Supabase Datenbank leeren
# - Paperless-NGX Dokumente löschen  
# - Google Drive Ordner leeren (manuell)
# - Server Ordner leeren
# - Docker Logs zurücksetzen
#
# Verwendung:
#     bash scripts/tabula-rasa-reset.sh [--confirm]
#     
#     --confirm: Bestätigt die Ausführung (verhindert versehentliche Löschung)

set -e  # Exit on any error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server Configuration
SERVER_HOST="paperless"
SERVER_PATH="/home/ubuntu/paperless-infra"

print_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🔄 TABULA RASA RESET                     ║"
    echo "║                                                              ║"
    echo "║  ⚠️  WARNUNG: Dieses Skript löscht ALLE Daten!              ║"
    echo "║  📋 Supabase, Paperless, Google Drive, Server               ║"
    echo "║  🗑️  Alle Dokumente, Ordner, Logs werden gelöscht          ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

run_ssh_command() {
    local command="$1"
    local description="$2"
    
    echo -e "${BLUE}🔄 $description...${NC}"
    
    if ssh "$SERVER_HOST" "$command"; then
        echo -e "${GREEN}✅ $description - Erfolgreich${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - Fehler${NC}"
        return 1
    fi
}

reset_supabase() {
    echo -e "\n${YELLOW}🗄️  SUPABASE DATENBANK LEEREN${NC}"
    echo "=================================================="
    
    echo -e "${YELLOW}⚠️  MANUELLE AUSFÜHRUNG ERFORDERLICH!${NC}"
    echo
    echo "📋 Führe diese SQL-Befehle in Supabase aus:"
    echo "   DELETE FROM paperless_documents_index;"
    echo "   DELETE FROM email_filter_decisions;"
    echo "   DELETE FROM email_whitelist WHERE id > 0;"
    echo "   DELETE FROM email_blacklist WHERE id > 0;"
    echo
    echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/jpmhwyjiuodsvjowddsm"
    echo
    
    read -p "⏸️  Drücke Enter wenn Supabase geleert wurde..."
}

reset_paperless() {
    echo -e "\n${YELLOW}📄 PAPERLESS-NGX LEEREN${NC}"
    echo "=================================================="
    
    # Alle Dokumente löschen
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Document; Document.objects.all().delete(); print('Alle Dokumente gelöscht')\"" \
        "Paperless Dokumente löschen"
    
    # Alle Tags löschen (außer Standard)
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Tag; Tag.objects.exclude(name__in=['important', 'archive']).delete(); print('Tags gelöscht')\"" \
        "Paperless Tags löschen"
    
    # Alle Correspondents löschen
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Correspondent; Correspondent.objects.all().delete(); print('Correspondents gelöscht')\"" \
        "Paperless Correspondents löschen"
    
    # Alle Document Types löschen
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import DocumentType; DocumentType.objects.all().delete(); print('Document Types gelöscht')\"" \
        "Paperless Document Types löschen"
}

reset_google_drive() {
    echo -e "\n${YELLOW}☁️  GOOGLE DRIVE ORDNER${NC}"
    echo "=================================================="
    echo -e "${YELLOW}⚠️  MANUELLE AUSFÜHRUNG ERFORDERLICH!${NC}"
    echo
    echo "📋 Führe diese Schritte in Google Drive aus:"
    echo
    echo "🔵 Account 1: philip@zepta.com (ZEPTA)"
    echo "   1. Gehe zu Google Drive"
    echo "   2. Suche nach: 'Paperless-Emails'"
    echo "   3. Lösche ALLE Ordner in diesem Ordner"
    echo "   4. Suche nach: 'Paperless-Attachments'"
    echo "   5. Lösche ALLE Ordner in diesem Ordner"
    echo
    echo "🔵 Account 2: phkoenig@gmail.com (PRIVAT)"
    echo "   1. Wechsle zu phkoenig@gmail.com"
    echo "   2. Wiederhole die gleichen Schritte"
    echo
    
    read -p "⏸️  Drücke Enter wenn Google Drive geleert wurde..."
}

reset_server() {
    echo -e "\n${YELLOW}🖥️  SERVER ORDNER LEEREN${NC}"
    echo "=================================================="
    
    # Consume Ordner leeren
    run_ssh_command "rm -rf /opt/paperless/consume/emails/*" "Emails Ordner leeren"
    run_ssh_command "rm -rf /opt/paperless/consume/emails_pdf/*" "PDFs Ordner leeren"
    run_ssh_command "rm -rf /opt/paperless/consume/gdrive-office/*" "gdrive-office Ordner leeren"
    run_ssh_command "rm -rf /opt/paperless/consume/gdrive-philip/*" "gdrive-philip Ordner leeren"
    
    # Docker Container neu starten
    run_ssh_command "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml restart" "Docker Container neu starten"
    
    # Warten bis Services bereit sind
    echo -e "${BLUE}⏳ Warte 30 Sekunden bis Services bereit sind...${NC}"
    sleep 30
}

reset_docker_logs() {
    echo -e "\n${YELLOW}🐳 DOCKER LOGS ZURÜCKSETZEN${NC}"
    echo "=================================================="
    
    # Docker System bereinigen
    run_ssh_command "docker system prune -f" "Docker System bereinigen"
    
    # Container Logs zurücksetzen
    run_ssh_command "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml logs --tail=0 > /dev/null 2>&1 || true" "Docker Logs zurücksetzen"
}

verify_reset() {
    echo -e "\n${YELLOW}✅ VERIFICATION${NC}"
    echo "=================================================="
    
    # Paperless Check
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell -c \"from documents.models import Document; print(f'Paperless Documents: {Document.objects.count()}')\"" \
        "Paperless Dokumente zählen"
    
    # Server Ordner Check
    run_ssh_command \
        "find /opt/paperless/consume -maxdepth 2 -type f | wc -l" \
        "Server Dateien zählen"
    
    # Docker Status
    run_ssh_command \
        "cd $SERVER_PATH && docker compose -f infra/docker-compose.yml ps" \
        "Docker Container Status"
}

main() {
    # Argumente prüfen
    if [[ "$1" != "--confirm" ]]; then
        echo -e "${RED}❌ FEHLER: --confirm Flag erforderlich!${NC}"
        echo "   Verwendung: bash scripts/tabula-rasa-reset.sh --confirm"
        echo -e "   ${YELLOW}⚠️  Dies verhindert versehentliche Löschung aller Daten!${NC}"
        exit 1
    fi
    
    print_banner
    
    echo -e "${BLUE}🕐 Start: $(date)${NC}"
    echo
    
    # Reset-Sequenz
    reset_supabase
    reset_paperless
    reset_google_drive
    reset_server
    reset_docker_logs
    verify_reset
    
    echo -e "\n${GREEN}🎉 TABULA RASA ABGESCHLOSSEN!${NC}"
    echo -e "${BLUE}🕐 Ende: $(date)${NC}"
    echo
    echo -e "${YELLOW}📋 NÄCHSTE SCHRITTE:${NC}"
    echo "   1. Führe Apps Script 'exportToPaperless' aus"
    echo "   2. Warte auf rclone Sync (ca. 5 Min)"
    echo "   3. Warte auf eml2pdf Konvertierung"
    echo "   4. Überprüfe Paperless-NGX für neue Dokumente"
}

# Script ausführen
main "$@"
