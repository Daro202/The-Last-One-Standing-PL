import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Content-hashed build assets (/assets/*-<hash>.js|css) are immutable —
  // their name changes whenever the content does, so they're safe to cache
  // hard. This is what makes repeat loads fast without ever going stale.
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );

  // Everything else in the build dir (favicon, /audio_questions, /data, …).
  // index.html must NEVER be cached: a stale index.html points at old hashed
  // bundles that no longer exist after a redeploy, which is exactly what broke
  // the app until a hard refresh. no-store guarantees each visit re-fetches it.
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }),
  );

  // SPA fallback — ONLY for navigation routes. A request that looks like a
  // file (has an extension) must 404 instead of receiving index.html, so a
  // stale cached page asking for an old JS chunk fails loudly rather than
  // getting HTML served in place of JavaScript (which silently bricks the app
  // and shows the endless "connecting…"). Navigation paths get a fresh,
  // no-cache index.html.
  app.use((req, res, next) => {
    if (req.method !== "GET" || path.extname(req.path)) return next();
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
