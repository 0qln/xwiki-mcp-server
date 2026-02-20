# XWiki MCP Server

Servidor MCP (Model Context Protocol) para interactuar con instancias de XWiki. Este servidor permite buscar, leer y crear páginas en XWiki a través de la API REST.

## 🚀 Características

- **Búsqueda de artículos**: Busca páginas en XWiki usando la API de búsqueda
- **Lectura de páginas**: Obtiene el contenido completo de cualquier página de XWiki
- **Creación/Actualización de páginas**: Crea o actualiza páginas en XWiki usando sintaxis XWiki

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 20+ (si ejecutas sin Docker)
- Acceso a una instancia de XWiki con API REST habilitada

## 🔧 Instalación

### Opción 1: Usando Docker (Recomendado)

1. Clona el repositorio:
```bash
git clone https://github.com/alfredfs85/xwiki-mcp-server.git
cd xwiki-mcp-server
```

2. Configura las variables de entorno creando un archivo `.env`:
```bash
XWIKI_URL=https://tu-instancia-xwiki.com
XWIKI_USERNAME=tu_usuario
XWIKI_PASSWORD=tu_contraseña
XWIKI_WIKI=xwiki
```

3. Construye y ejecuta el contenedor:
```bash
docker-compose up -d --build
```

4. Verifica que el servidor esté funcionando:
```bash
curl http://localhost:3000/health
```

### Opción 2: Ejecución Local

1. Instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno:
```bash
export XWIKI_URL=https://tu-instancia-xwiki.com
export XWIKI_USERNAME=tu_usuario
export XWIKI_PASSWORD=tu_contraseña
export XWIKI_WIKI=xwiki
```

3. Ejecuta el servidor:
```bash
node server.js
```

El servidor estará disponible en `http://localhost:3000`

## 🔐 Configuración con SSL (Opcional)

Si necesitas HTTPS, puedes usar el script `setup.sh` para generar certificados SSL autofirmados:

```bash
chmod +x setup.sh
./setup.sh
```

**Nota**: Los certificados generados (`server.key` y `server.crt`) están en `.gitignore` y no se subirán al repositorio.

## 📡 Endpoints

### Health Check
```
GET /health
```
Retorna el estado del servidor y la configuración de XWiki.

### MCP JSON-RPC
```
POST /mcp
```
Endpoint principal para comunicación MCP usando JSON-RPC 2.0.

### Server-Sent Events (SSE)
```
GET /sse
POST /messages?sessionId={sessionId}
```
Endpoints alternativos para comunicación mediante Server-Sent Events.

## 🛠️ Herramientas Disponibles

### `search_xwiki`
Busca artículos en XWiki.

**Parámetros:**
- `query` (requerido): Término de búsqueda
- `limit` (opcional): Número máximo de resultados (default: 10)

**Ejemplo:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_xwiki",
    "arguments": {
      "query": "documentación",
      "limit": 5
    }
  }
}
```

### `get_xwiki_page`
Obtiene el contenido de una página de XWiki.

**Parámetros:**
- `page_path` (requerido): Ruta de la página (ej: `Main.WebHome` o `Space.Page`)

**Ejemplo:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_xwiki_page",
    "arguments": {
      "page_path": "Main.WebHome"
    }
  }
}
```

### `create_xwiki_page`
Crea o actualiza una página en XWiki.

**Parámetros:**
- `page_path` (requerido): Ruta de la página
- `title` (requerido): Título de la página
- `content` (requerido): Contenido en sintaxis XWiki

**Ejemplo:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_xwiki_page",
    "arguments": {
      "page_path": "Test.MyPage",
      "title": "Mi Página de Prueba",
      "content": "= Título =\n\nContenido de la página..."
    }
  }
}
```

## 🔌 Integración con Cursor/Claude Desktop

Para usar este servidor MCP con Cursor o Claude Desktop, agrega la siguiente configuración a tu archivo de configuración MCP:

```json
{
  "mcpServers": {
    "xwiki": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

## 🐳 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `XWIKI_URL` | URL de tu instancia XWiki | - |
| `XWIKI_USERNAME` | Usuario para autenticación | - |
| `XWIKI_PASSWORD` | Contraseña para autenticación | - |
| `XWIKI_WIKI` | Nombre del wiki | `xwiki` |
| `MCP_MODE` | Modo de operación MCP | `http` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Deshabilitar validación SSL (solo desarrollo) | `0` |

## 📝 Notas de Seguridad

- ⚠️ **Nunca** subas credenciales al repositorio
- ⚠️ Los certificados SSL autofirmados son solo para desarrollo
- ⚠️ En producción, usa certificados válidos y configura `NODE_TLS_REJECT_UNAUTHORIZED=1`
- ⚠️ El archivo `.env` está en `.gitignore` por seguridad

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🐛 Reportar Problemas

Si encuentras algún problema, por favor abre un issue en el repositorio de GitHub.

## 👤 Autor

**alfredfs85**

- GitHub: [@alfredfs85](https://github.com/alfredfs85)

## 🙏 Agradecimientos

- XWiki por su excelente plataforma y API REST
- El equipo de Model Context Protocol por el estándar MCP
