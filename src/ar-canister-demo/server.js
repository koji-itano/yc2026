"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("os");
const path = require("path");
const { URL } = require("url");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
const certFile = process.env.SSL_CERT_FILE || "";
const keyFile = process.env.SSL_KEY_FILE || "";
const useHttps = Boolean(certFile && keyFile);
const root = __dirname;

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

function safeJoin(urlPath) {
  const normalized = path.normalize(path.join(root, urlPath));
  if (!normalized.startsWith(root)) {
    return null;
  }
  return normalized;
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(content);
  });
}

function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry || entry.internal || entry.family !== "IPv4") {
        return;
      }
      addresses.push(entry.address);
    });
  });

  return Array.from(new Set(addresses));
}

function buildUrls(address) {
  const protocol = useHttps ? "https" : "http";
  return {
    control: `${protocol}://${address}:${port}/control.html`,
    worker: `${protocol}://${address}:${port}/index.html`,
    dashboard: `${protocol}://${address}:${port}/dashboard.html`,
  };
}

function logLaunchUrls() {
  const protocol = useHttps ? "https" : "http";
  const localhostUrls = buildUrls("localhost");

  console.log("");
  console.log(`Real Physical Gigs AR demo running over ${protocol.toUpperCase()} on ${host}:${port}`);
  console.log(`Control:   ${localhostUrls.control}`);
  console.log(`Worker:    ${localhostUrls.worker}`);
  console.log(`Dashboard: ${localhostUrls.dashboard}`);

  const lanAddresses = getLocalNetworkAddresses();
  if (lanAddresses.length) {
    console.log("");
    console.log("Same Wi-Fi phone URLs:");
    lanAddresses.forEach((address) => {
      const urls = buildUrls(address);
      console.log(`- Control:   ${urls.control}`);
      console.log(`  Worker:    ${urls.worker}`);
      console.log(`  Dashboard: ${urls.dashboard}`);
    });
  }

  if (!useHttps) {
    console.log("");
    console.log("Camera note:");
    console.log("- Phone browsers usually require HTTPS for getUserMedia on LAN IPs.");
    console.log("- HTTP is still useful for UI checks and manual fallback mode.");
    console.log("- For camera-based AR on a phone, start this server with SSL_CERT_FILE and SSL_KEY_FILE.");
  }
}

function createRequestHandler() {
  return (req, res) => {
    const url = new URL(req.url, `${useHttps ? "https" : "http"}://${req.headers.host}`);
    const pathname = url.pathname === "/" ? "/control.html" : url.pathname;
    const filePath = safeJoin(pathname);

    if (!filePath) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveFile(res, filePath);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  };
}

function createServer() {
  if (!useHttps) {
    return http.createServer(createRequestHandler());
  }

  return https.createServer(
    {
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
    },
    createRequestHandler(),
  );
}

const server = createServer();

if (require.main === module) {
  server.listen(port, host, () => {
    logLaunchUrls();
  });
}

module.exports = {
  server,
};
