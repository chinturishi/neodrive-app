import { open, readdir, readFile, rename, unlink } from "node:fs/promises";
import http from "node:http";
import mime from "mime-types";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS,DELETE,PUT,PATCH"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  console.log(req.url);
  console.log(req.method);
  if (req.method === "GET") {
    if (req.url === "/favicon.ico") {
      res.writeHead(204); // No content
      return res.end();
    }
    if (req.url === "/") {
      serveDirectory(req, res);
    } else {
      try {
        const [url, queryString] = req.url.split("?");
        const queryParams = {};
        queryString.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          queryParams[key] = value;
        });
        console.log(queryParams);
        const fileHandle = await open(`./storage/${decodeURIComponent(url)}`);
        const stats = await fileHandle.stat();
        if (stats.isDirectory()) {
          serveDirectory(req, res);
        } else {
          const fileStream = fileHandle.createReadStream();
          console.log(mime.contentType(url.slice(1)));
          res.setHeader("Content-Type", mime.contentType(url.slice(1)));
          res.setHeader("Content-Length", stats.size);
          if (queryParams.action === "download") {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${url.slice(1)}"`
            );
          }
          fileStream.pipe(res);
        }
      } catch (err) {
        console.log(err.message);
        res.end("Not Found");
      }
    }
  } else if (req.method === "OPTIONS") {
    res.end("OK");
  } else if (req.method === "POST") {
    //console.log(req.headers.filename);
    const filename = req.headers.filename;
    const writeStream = createWriteStream(`./storage/${filename}`);
    //req.pipe(writeStream);
    req.on("data", (data) => {
      writeStream.write(data);
      //console.log(1);
    });
    req.on("end", () => {
      console.log("end");
      writeStream.end();
      res.end('{"status":"success"}');
    });
    req.on("error", (err) => {
      console.error("Request error:", err);
    });
    req.on("aborted", () => {
      console.warn("Request aborted by the client.");
      writeStream.destroy();
    });
  } else if (req.method === "DELETE") {
    const filename = req.headers.filename;
    try {
      await unlink(`./storage/${filename}`);
      res.end('{"status":"success"}');
    } catch (err) {
      console.log(err.message);
      res.end('{"status":"error"}');
    }
  } else if (req.method === "PATCH") {
    const filename = req.headers.filename;
    const newfilename = req.headers.newfilename;
    try {
      await rename(`./storage/${filename}`, `./storage/${newfilename}`);
      res.end('{"status":"success"}');
    } catch (err) {
      console.log(err.message);
      res.end('{"status":"error"}');
    }
  }
});

async function serveDirectory(req, res) {
  const [url, queryString] = req.url.split("?");
  const folderItems = await readdir(`./storage/${decodeURIComponent(url)}`);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(folderItems));
}
server.timeout = 120000;
server.keepAliveTimeout = 120000;
server.headersTimeout = 130000;

server.listen(3000, "::", () => {
  console.log("Server is running on port 3000");
});
