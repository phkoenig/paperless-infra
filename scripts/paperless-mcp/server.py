#!/usr/bin/env python3
"""
Paperless-NGX MCP Server
Model Context Protocol Server für Paperless-NGX REST API
"""

import os
import sys
import json
import asyncio
from typing import Any, Sequence
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    CallToolResult,
    ListResourcesResult,
    ReadResourceResult,
)
import subprocess

# Paperless-NGX Configuration
PAPERLESS_SSH_HOST = os.getenv("PAPERLESS_SSH_HOST", "paperless")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "08303a894fc26772730f3f5f8802b70837ca48c3")
PAPERLESS_API_URL = "http://localhost:8000"


def _ssh_curl(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Execute curl command via SSH to bypass Caddy's HTTPS redirect"""
    url = f"{PAPERLESS_API_URL}{endpoint}"
    
    cmd = [
        "ssh", PAPERLESS_SSH_HOST,
        "docker", "exec", "infra-paperless-webserver-1",
        "curl", "-s", "-X", method,
        "-H", f"Authorization: Token {PAPERLESS_TOKEN}",
        "-H", "Content-Type: application/json"
    ]
    
    if data:
        cmd.extend(["-d", json.dumps(data)])
    
    cmd.append(url)
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"SSH Error: {result.stderr}")
    
    if not result.stdout.strip():
        return {}
    
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw": result.stdout}


# Initialize MCP Server
app = Server("paperless-ngx")


@app.list_resources()
async def list_resources() -> ListResourcesResult:
    """List available Paperless-NGX resources"""
    return ListResourcesResult(
        resources=[
            Resource(
                uri="paperless://statistics",
                name="Paperless-NGX Statistics",
                mimeType="application/json",
                description="Overall statistics about documents, tags, correspondents"
            ),
            Resource(
                uri="paperless://documents/recent",
                name="Recent Documents",
                mimeType="application/json",
                description="List of recently added documents"
            ),
            Resource(
                uri="paperless://tasks",
                name="Active Tasks",
                mimeType="application/json",
                description="List of running and pending tasks"
            ),
        ]
    )


@app.read_resource()
async def read_resource(uri: str) -> ReadResourceResult:
    """Read a Paperless-NGX resource"""
    
    if uri == "paperless://statistics":
        stats = _ssh_curl("/api/statistics/")
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text=json.dumps(stats, indent=2)
                )
            ]
        )
    
    elif uri == "paperless://documents/recent":
        docs = _ssh_curl("/api/documents/?page=1&page_size=10&ordering=-created")
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text=json.dumps(docs, indent=2)
                )
            ]
        )
    
    elif uri == "paperless://tasks":
        tasks = _ssh_curl("/api/tasks/")
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text=json.dumps(tasks, indent=2)
                )
            ]
        )
    
    else:
        raise ValueError(f"Unknown resource: {uri}")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available Paperless-NGX tools"""
    return [
        Tool(
            name="search_documents",
            description="Search for documents in Paperless-NGX",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "limit": {
                        "type": "number",
                        "description": "Maximum number of results",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_document",
            description="Get details of a specific document",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "number",
                        "description": "Document ID"
                    }
                },
                "required": ["document_id"]
            }
        ),
        Tool(
            name="delete_document",
            description="Delete a document from Paperless-NGX",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "number",
                        "description": "Document ID to delete"
                    }
                },
                "required": ["document_id"]
            }
        ),
        Tool(
            name="list_documents",
            description="List all documents with optional filters",
            inputSchema={
                "type": "object",
                "properties": {
                    "page": {
                        "type": "number",
                        "description": "Page number",
                        "default": 1
                    },
                    "page_size": {
                        "type": "number",
                        "description": "Results per page",
                        "default": 100
                    },
                    "ordering": {
                        "type": "string",
                        "description": "Sort order (e.g., '-created', 'title')",
                        "default": "-created"
                    }
                }
            }
        ),
        Tool(
            name="update_document",
            description="Update document metadata (title, tags, correspondent, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "number",
                        "description": "Document ID"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Tag IDs"
                    },
                    "correspondent": {
                        "type": "number",
                        "description": "Correspondent ID"
                    },
                    "document_type": {
                        "type": "number",
                        "description": "Document type ID"
                    }
                },
                "required": ["document_id"]
            }
        ),
        Tool(
            name="get_statistics",
            description="Get overall Paperless-NGX statistics",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="list_tags",
            description="List all tags",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="create_tag",
            description="Create a new tag",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Tag name"
                    },
                    "color": {
                        "type": "string",
                        "description": "Hex color code (e.g., '#ff0000')",
                        "default": "#aaaaaa"
                    }
                },
                "required": ["name"]
            }
        ),
        Tool(
            name="list_tasks",
            description="List all active and recent tasks",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    """Handle tool calls"""
    
    if name == "search_documents":
        query = arguments.get("query")
        limit = arguments.get("limit", 10)
        result = _ssh_curl(f"/api/documents/?query={query}&page_size={limit}")
        docs = result.get("results", [])
        
        response = f"Found {len(docs)} documents matching '{query}':\n\n"
        for doc in docs:
            response += f"• ID {doc['id']}: {doc['title']}\n"
            response += f"  Created: {doc.get('created', 'N/A')}\n"
            response += f"  Tags: {doc.get('tags', [])}\n\n"
        
        return [TextContent(type="text", text=response)]
    
    elif name == "get_document":
        doc_id = arguments.get("document_id")
        doc = _ssh_curl(f"/api/documents/{doc_id}/")
        return [TextContent(type="text", text=json.dumps(doc, indent=2))]
    
    elif name == "delete_document":
        doc_id = arguments.get("document_id")
        _ssh_curl(f"/api/documents/{doc_id}/", method="DELETE")
        return [TextContent(type="text", text=f"✅ Document {doc_id} deleted successfully")]
    
    elif name == "list_documents":
        page = arguments.get("page", 1)
        page_size = arguments.get("page_size", 100)
        ordering = arguments.get("ordering", "-created")
        result = _ssh_curl(f"/api/documents/?page={page}&page_size={page_size}&ordering={ordering}")
        docs = result.get("results", [])
        
        response = f"📄 {len(docs)} documents (Total: {result.get('count', 0)}):\n\n"
        for doc in docs:
            response += f"• ID {doc['id']}: {doc['title']}\n"
            response += f"  Created: {doc.get('created', 'N/A')}\n\n"
        
        return [TextContent(type="text", text=response)]
    
    elif name == "update_document":
        doc_id = arguments.get("document_id")
        data = {k: v for k, v in arguments.items() if k != "document_id" and v is not None}
        result = _ssh_curl(f"/api/documents/{doc_id}/", method="PATCH", data=data)
        return [TextContent(type="text", text=f"✅ Document {doc_id} updated:\n{json.dumps(result, indent=2)}")]
    
    elif name == "get_statistics":
        stats = _ssh_curl("/api/statistics/")
        response = "📊 Paperless-NGX Statistics:\n\n"
        response += f"• Documents Total: {stats.get('documents_total', 0)}\n"
        response += f"• Tags: {stats.get('tag_count', 0)}\n"
        response += f"• Correspondents: {stats.get('correspondent_count', 0)}\n"
        response += f"• Document Types: {stats.get('document_type_count', 0)}\n"
        response += f"• Characters: {stats.get('character_count', 0)}\n"
        return [TextContent(type="text", text=response)]
    
    elif name == "list_tags":
        result = _ssh_curl("/api/tags/")
        tags = result.get("results", [])
        response = f"🏷️  {len(tags)} tags:\n\n"
        for tag in tags:
            response += f"• ID {tag['id']}: {tag['name']} (Color: {tag.get('color', 'N/A')})\n"
        return [TextContent(type="text", text=response)]
    
    elif name == "create_tag":
        name_val = arguments.get("name")
        color = arguments.get("color", "#aaaaaa")
        data = {"name": name_val, "color": color}
        result = _ssh_curl("/api/tags/", method="POST", data=data)
        return [TextContent(type="text", text=f"✅ Tag created: {json.dumps(result, indent=2)}")]
    
    elif name == "list_tasks":
        result = _ssh_curl("/api/tasks/")
        tasks = result.get("results", [])
        response = f"⚙️  {len(tasks)} tasks:\n\n"
        for task in tasks:
            response += f"• {task.get('id')}: {task.get('task_name')}\n"
            response += f"  Status: {task.get('status')}\n\n"
        return [TextContent(type="text", text=response)]
    
    else:
        raise ValueError(f"Unknown tool: {name}")


async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())

