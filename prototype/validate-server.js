const assert = require("assert");
const http = require("http");
const { server } = require("./server");

function request(port, path, method = "GET", body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        method,
        path,
        port
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(JSON.parse(data));
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();

  try {
    await request(port, "/api/reset", "POST");
    await request(port, "/api/action/accept", "POST");
    await request(port, "/api/action/start", "POST");
    await request(port, "/api/action/before", "POST");
    await request(port, "/api/action/after", "POST");
    const submitted = await request(port, "/api/action/submit", "POST");

    assert.equal(submitted.state.status, "PROOF SUBMITTED");

    await new Promise((resolve) => setTimeout(resolve, 1400));
    const finalState = await request(port, "/api/state");
    assert.equal(finalState.state.status, "PAID");
    console.log("PASS server-flow");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
