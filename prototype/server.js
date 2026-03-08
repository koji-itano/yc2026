const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const {
  applyAction,
  buildAuditRecord,
  createInitialState,
  sampleAfterImage,
  sampleBeforeImage
} = require("./state");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4174);
const root = path.join(__dirname, "public");

let state = createInitialState();
let verificationTimer = null;
let payoutTimer = null;

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function scheduleVerification() {
  clearTimeout(verificationTimer);
  clearTimeout(payoutTimer);

  verificationTimer = setTimeout(() => {
    state = applyAction(state, "verified", {
      note: "Cap-secured proof confirmed. Audit trail complete."
    });
  }, 600);

  payoutTimer = setTimeout(() => {
    state = applyAction(state, "paid");
  }, 1200);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(content);
  });
}

function routeStatic(urlPath, res) {
  if (urlPath === "/") {
    serveFile(res, path.join(root, "index.html"));
    return true;
  }

  if (urlPath === "/worker") {
    serveFile(res, path.join(root, "worker.html"));
    return true;
  }

  const requested = path.normalize(path.join(root, urlPath));
  if (!requested.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return true;
  }

  if (fs.existsSync(requested) && fs.statSync(requested).isFile()) {
    serveFile(res, requested);
    return true;
  }

  return false;
}

function withAuditState() {
  return {
    audit: buildAuditRecord(state),
    sampleAssets: {
      after: sampleAfterImage,
      before: sampleBeforeImage
    },
    state
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/state") {
    json(res, 200, withAuditState());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/reset") {
    clearTimeout(verificationTimer);
    clearTimeout(payoutTimer);
    state = applyAction(state, "reset");
    json(res, 200, withAuditState());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auto-run") {
    clearTimeout(verificationTimer);
    clearTimeout(payoutTimer);
    state = applyAction(state, "auto");
    json(res, 200, withAuditState());
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/action/")) {
    try {
      const payload = await parseBody(req);
      const action = url.pathname.split("/").pop();

      state = applyAction(state, action, payload);
      if (action === "submit") {
        scheduleVerification();
      }

      json(res, 200, withAuditState());
    } catch (error) {
      json(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && routeStatic(url.pathname, res)) {
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

if (require.main === module) {
  server.listen(port, host, () => {
    console.log(`Real Physical Gigs demo running at http://${host}:${port}`);
  });
}

module.exports = {
  server
};
