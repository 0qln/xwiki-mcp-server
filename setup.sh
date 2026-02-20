#!/bin/bash
# Script de configuración para XWiki MCP Server
# Genera certificados SSL (opcional) y levanta el contenedor

set -e

echo "🚀 Configurando XWiki MCP Server..."

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    exit 1
fi

# Opción para generar certificados SSL
if [ "$1" == "--ssl" ]; then
    echo "📜 Generando certificados SSL..."
    if ! command -v openssl &> /dev/null; then
        echo "⚠️  Advertencia: OpenSSL no está instalado. Saltando generación de certificados."
    else
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout server.key -out server.crt \
            -subj "/CN=mcp-xwiki/O=MCP/C=US" 2>/dev/null
        echo "✅ Certificados SSL generados"
    fi
fi

echo "🐳 Construyendo y levantando contenedor..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo "⏳ Esperando a que el servidor esté listo..."
sleep 5

# Verificar salud del servidor
echo "🔍 Verificando estado del servidor..."
if command -v curl &> /dev/null; then
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Servidor funcionando correctamente"
        curl -s http://localhost:3000/health | grep -o '"status":"[^"]*"' || echo ""
    else
        echo "⚠️  No se pudo verificar el estado del servidor"
    fi
else
    echo "⚠️  curl no está instalado. No se puede verificar el estado."
fi

echo ""
echo "✅ XWiki MCP Server está disponible en http://localhost:3000"
echo "📖 Para más información, consulta el README.md"
