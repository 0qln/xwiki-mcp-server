#!/bin/bash
# Genera certificados SSL y levanta el contenedor

echo "Generando certificados SSL..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/CN=mcp-xwiki/O=MCP/C=ES" 2>/dev/null

echo "Construyendo y levantando contenedor..."
docker-compose up -d --build

echo "Verificando..."
sleep 3
curl -sk https://localhost:3000/health

echo -e "\n✅ MCP XWiki disponible en https://$(hostname -I | awk '{print $1}'):3000"
