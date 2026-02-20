import express from "express";
import crypto from "crypto";

const DEFAULT_XWIKI_URL = process.env.XWIKI_URL || "";
const DEFAULT_USERNAME = process.env.XWIKI_USERNAME || "";
const DEFAULT_PASSWORD = process.env.XWIKI_PASSWORD || "";
const DEFAULT_WIKI = process.env.XWIKI_WIKI || "xwiki";

const tools = [
  { name: "search_xwiki", description: "Search XWiki articles", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" }, limit: { type: "number", description: "Max results (default 10)" } }, required: ["query"] } },
  { name: "get_xwiki_page", description: "Get XWiki page content", inputSchema: { type: "object", properties: { page_path: { type: "string", description: "Page path (e.g. Main.WebHome)" } }, required: ["page_path"] } },
  { name: "create_xwiki_page", description: "Create or update XWiki page", inputSchema: { type: "object", properties: { page_path: { type: "string", description: "Page path" }, title: { type: "string", description: "Title" }, content: { type: "string", description: "Content in XWiki syntax" } }, required: ["page_path", "title", "content"] } }
];

async function callTool(name, args) {
  const baseUrl = DEFAULT_XWIKI_URL.replace(/\/$/, "");
  const headers = { "Accept": "application/json" };
  if (DEFAULT_USERNAME && DEFAULT_PASSWORD) {
    headers["Authorization"] = "Basic " + Buffer.from(`${DEFAULT_USERNAME}:${DEFAULT_PASSWORD}`).toString("base64");
  }
  
  try {
    if (name === "search_xwiki") {
      const { query, limit = 10 } = args;
      const searchUrl = `${baseUrl}/rest/wikis/${DEFAULT_WIKI}/search?q=${encodeURIComponent(query)}&number=${limit}`;
      const response = await fetch(searchUrl, { headers });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const results = (data.searchResults || []).map(r => ({ title: r.title || r.pageName, space: r.space, url: `${baseUrl}/bin/view/${(r.pageFullName||"").replace(/\./g, "/")}` }));
      return JSON.stringify(results, null, 2);
    }
    
    if (name === "get_xwiki_page") {
      const { page_path } = args;
      const parts = page_path.replace(/\//g, ".").split(".");
      const spacePath = parts.slice(0, -1).join("/spaces/");
      const pageName = parts[parts.length - 1] || "WebHome";
      const pageUrl = `${baseUrl}/rest/wikis/${DEFAULT_WIKI}/spaces/${spacePath}/pages/${pageName}`;
      const response = await fetch(pageUrl, { headers });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const page = await response.json();
      return JSON.stringify({ title: page.title, content: page.content, author: page.author, modified: page.modified }, null, 2);
    }
    
    if (name === "create_xwiki_page") {
      const { page_path, title, content } = args;
      const parts = page_path.replace(/\//g, ".").split(".");
      const spacePath = parts.slice(0, -1).join("/spaces/");
      const pageName = parts[parts.length - 1] || "WebHome";
const pageUrl = `${baseUrl}/rest/wikis/${DEFAULT_WIKI}/spaces/${spacePath}/pages/${pageName}`;
      const xml = `<?xml version="1.0" encoding="UTF-8"?><page xmlns="http://www.xwiki.org"><title>${title}</title><content><![CDATA[${content}]]></content></page>`;
      const response = await fetch(pageUrl, { method: "PUT", headers: { ...headers, "Content-Type": "application/xml" }, body: xml });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return `Page created/updated: ${baseUrl}/bin/view/${page_path.replace(/\./g, "/")}`;
    }
    
    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// MCP JSON-RPC handler
app.post("/mcp", async (req, res) => {
  const { method, params, id } = req.body;
  console.log("MCP request:", method);
  
  let result;
  
  if (method === "initialize") {
    result = { protocolVersion: "2024-11-05", serverInfo: { name: "xwiki-mcp", version: "1.0.0" }, capabilities: { tools: {} } };
  } else if (method === "tools/list") {
    result = { tools };
  } else if (method === "tools/call") {
    const { name, arguments: args } = params;
    const text = await callTool(name, args || {});
    result = { content: [{ type: "text", text }] };
  } else if (method === "notifications/initialized") {
    return res.json({ jsonrpc: "2.0", id });
  } else {
    return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  }
  
  res.json({ jsonrpc: "2.0", id, result });
});

// SSE endpoint for compatibility
const sessions = new Map();

app.get("/sse", (req, res) => {
  const sessionId = crypto.randomUUID();
  console.log("SSE connection:", sessionId);
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  
  sessions.set(sessionId, res);
  
  res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`);
  
  const keepAlive = setInterval(() => res.write(":keepalive\n\n"), 30000);
  
  req.on("close", () => {
    console.log("SSE closed:", sessionId);
    clearInterval(keepAlive);
    sessions.delete(sessionId);
  });
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const sseRes = sessions.get(sessionId);
  
  if (!sseRes) {
    return res.status(400).json({ error: "Session not found" });
  }
  
  const { method, params, id } = req.body;
  console.log("SSE message:", method, "session:", sessionId);
  
  let result;
  
  if (method === "initialize") {
    result = { protocolVersion: "2024-11-05", serverInfo: { name: "xwiki-mcp", version: "1.0.0" }, capabilities: { tools: {} } };
  } else if (method === "tools/list") {
    result = { tools };
  } else if (method === "tools/call") {
    const { name, arguments: args } = params;
    const text = await callTool(name, args || {});
    result = { content: [{ type: "text", text }] };
  } else if (method === "notifications/initialized") {
    return res.status(202).end();
  } else {
    return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  }
  
  const response = { jsonrpc: "2.0", id, result };
  sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
  res.status(202).end();
});

app.get("/health", (req, res) => res.json({ 
  status: "ok", 
  xwiki: DEFAULT_XWIKI_URL ? "configured" : "not configured", 
  sessions: sessions.size 
}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP XWiki on http://0.0.0.0:${PORT}`);
  console.log(`Endpoints: /mcp (JSON-RPC), /sse + /messages (SSE)`);
});
