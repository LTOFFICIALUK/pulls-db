import http from "node:http";

const port = Number(process.env.PORT || 3001);
http
  .createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "pulls-db" }));
      return;
    }
    res.writeHead(404);
    res.end();
  })
  .listen(port, () => {
    console.log("pulls db health on", port);
  });
