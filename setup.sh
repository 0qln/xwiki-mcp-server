#!/bin/bash
# Setup script for XWiki MCP Server
# Generates SSL certificates (optional) and starts the container

set -e

echo "🚀 Setting up XWiki MCP Server..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    exit 1
fi

# Option to generate SSL certificates
if [ "$1" == "--ssl" ]; then
    echo "📜 Generating SSL certificates..."
    if ! command -v openssl &> /dev/null; then
        echo "⚠️  Warning: OpenSSL is not installed. Skipping certificate generation."
    else
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout server.key -out server.crt \
            -subj "/CN=mcp-xwiki/O=MCP/C=US" 2>/dev/null
        echo "✅ SSL certificates generated"
    fi
fi

echo "🐳 Building and starting container..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo "⏳ Waiting for server to be ready..."
sleep 5

# Check server health
echo "🔍 Verifying server status..."
if command -v curl &> /dev/null; then
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Server is running correctly"
        curl -s http://localhost:3000/health | grep -o '"status":"[^"]*"' || echo ""
    else
        echo "⚠️  Could not verify server status"
    fi
else
    echo "⚠️  curl is not installed. Cannot verify status."
fi

echo ""
echo "✅ XWiki MCP Server is available at http://localhost:3000"
echo "📖 For more information, see README.md"
