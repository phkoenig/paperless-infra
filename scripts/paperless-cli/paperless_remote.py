#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Paperless-NGX Remote API Client
Nutzt SSH-Tunnel um Caddy's HTTPS-Redirect zu umgehen
"""

import os
import sys
import json
import subprocess
from typing import Optional, Dict, List

# Fix Windows Unicode output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

class PaperlessRemote:
    """Client für Paperless-NGX über SSH"""
    
    def __init__(self, ssh_host: str = "paperless", token: str = "08303a894fc26772730f3f5f8802b70837ca48c3"):
        self.ssh_host = ssh_host
        self.token = token
        self.api_url = "http://localhost:8000"
    
    def _ssh_curl(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict:
        """Führe curl über SSH aus"""
        url = f"{self.api_url}{endpoint}"
        
        cmd = [
            "ssh", self.ssh_host,
            "docker", "exec", "infra-paperless-webserver-1",
            "curl", "-s", "-X", method,
            "-H", f"Authorization: Token {self.token}",
            "-H", "Content-Type: application/json"
        ]
        
        if data:
            cmd.extend(["-d", json.dumps(data)])
        
        cmd.append(url)
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"SSH-Fehler: {result.stderr}")
        
        if not result.stdout.strip():
            return {}
        
        return json.loads(result.stdout)
    
    # ===== DOKUMENTE =====
    
    def list_documents(self, page: int = 1, page_size: int = 100) -> Dict:
        """Liste alle Dokumente"""
        return self._ssh_curl(f"/api/documents/?page={page}&page_size={page_size}")
    
    def search_documents(self, query: str) -> Dict:
        """Suche Dokumente"""
        return self._ssh_curl(f"/api/documents/?query={query}")
    
    def get_document(self, doc_id: int) -> Dict:
        """Hole einzelnes Dokument"""
        return self._ssh_curl(f"/api/documents/{doc_id}/")
    
    def delete_document(self, doc_id: int) -> None:
        """Lösche Dokument"""
        self._ssh_curl(f"/api/documents/{doc_id}/", method="DELETE")
    
    # ===== STATISTICS =====
    
    def get_statistics(self) -> Dict:
        """Hole Statistiken"""
        return self._ssh_curl("/api/statistics/")
    
    # ===== TASKS =====
    
    def list_tasks(self) -> Dict:
        """Liste alle Tasks"""
        return self._ssh_curl("/api/tasks/")


def main():
    """CLI Interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Paperless-NGX Remote API CLI')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # List
    list_parser = subparsers.add_parser('list', help='Liste Dokumente')
    list_parser.add_argument('--limit', type=int, default=10)
    
    # Search
    search_parser = subparsers.add_parser('search', help='Suche Dokumente')
    search_parser.add_argument('query', help='Suchbegriff')
    
    # Delete
    delete_parser = subparsers.add_parser('delete', help='Lösche Dokument')
    delete_parser.add_argument('id', type=int, help='Dokument ID')
    
    # Stats
    subparsers.add_parser('stats', help='Statistiken')
    
    # Tasks
    subparsers.add_parser('tasks', help='Tasks')
    
    args = parser.parse_args()
    
    api = PaperlessRemote()
    
    try:
        if args.command == 'list':
            result = api.list_documents(page_size=args.limit)
            docs = result.get('results', [])
            print(f"\n📄 {len(docs)} Dokumente (Total: {result.get('count', 0)}):\n")
            for doc in docs:
                print(f"  ID {doc['id']}: {doc['title']}")
                print(f"    Erstellt: {doc.get('created')}")
                print()
        
        elif args.command == 'search':
            result = api.search_documents(args.query)
            docs = result.get('results', [])
            print(f"\n🔍 {len(docs)} Treffer für '{args.query}':\n")
            for doc in docs:
                print(f"  ID {doc['id']}: {doc['title']}")
                print(f"    Erstellt: {doc.get('created')}")
                print()
        
        elif args.command == 'delete':
            api.delete_document(args.id)
            print(f"✅ Dokument {args.id} gelöscht!")
        
        elif args.command == 'stats':
            stats = api.get_statistics()
            print("\n📊 Paperless-NGX Statistiken:\n")
            print(f"  📄 Dokumente Total: {stats.get('documents_total', 0)}")
            print(f"  📥 Inbox: {stats.get('documents_inbox', 0) or 'N/A'}")
            print(f"  🏷️  Tags: {stats.get('tag_count', 0)}")
            print(f"  👤 Korrespondenten: {stats.get('correspondent_count', 0)}")
            print(f"  📁 Dokumenttypen: {stats.get('document_type_count', 0)}")
            print(f"  🔤 Zeichen: {stats.get('character_count', 0)}")
            print()
        
        elif args.command == 'tasks':
            result = api.list_tasks()
            tasks = result.get('results', [])
            print(f"\n⚙️  {len(tasks)} Tasks:\n")
            for task in tasks:
                print(f"  {task.get('id')}: {task.get('task_name')}")
                print(f"    Status: {task.get('status')}")
                print()
        
        else:
            parser.print_help()
    
    except Exception as e:
        print(f"❌ Fehler: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

