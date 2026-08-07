import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomBytes } from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoomData {
  state: unknown;
  clients: Set<WebSocket>;
  ownerToken: string; // server-issued; required to push state/effects after reconnect
}

// ── In-memory room store ──────────────────────────────────────────────────────

const rooms = new Map<string, RoomData>();

function generateRoomCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  return code;
}

// .forEach avoids TS2802 "Set can only be iterated with --downlevelIteration"
function broadcastToRoom(
  room: RoomData,
  message: unknown,
  exclude?: WebSocket,
): void {
  const data = JSON.stringify(message);
  room.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // noServer: true — we handle HTTP upgrades manually so that Vite's HMR
  // WebSocket on /vite-hmr is never intercepted or rejected by this server.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = request.url ?? "";
    if (url === "/ws" || url.startsWith("/ws?")) {
      wss.handleUpgrade(request, socket as import("net").Socket, head, (client) => {
        wss.emit("connection", client, request);
      });
      // All other upgrade paths (e.g. /vite-hmr) fall through to Vite's listener.
    }
  });

  wss.on("connection", (ws) => {
    // Server-tracked per-connection state — client-supplied roomCode is
    // never used for authorization; only these server-bound values are.
    let currentRoomCode: string | null = null;
    let isCreator = false;

    // Keep-alive: server-side ping every 25 s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 25_000);

    ws.on("message", (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      switch (msg.type) {

        // ── Admin creates a new game room ──────────────────────────────────
        case "CREATE_ROOM": {
          // Leave any previous room
          if (currentRoomCode) {
            const prev = rooms.get(currentRoomCode);
            if (prev) {
              prev.clients.delete(ws);
              if (prev.clients.size === 0) rooms.delete(currentRoomCode);
            }
          }
          const code = generateRoomCode();
          const ownerToken = randomBytes(24).toString("hex"); // 48-char secret
          const state = msg.state ?? {};
          currentRoomCode = code;
          isCreator = true;
          rooms.set(code, { state, clients: new Set([ws]), ownerToken });
          ws.send(JSON.stringify({ type: "ROOM_CREATED", roomCode: code, state, ownerToken }));
          console.log(`[WS] Room ${code} created (${rooms.size} total rooms)`);
          break;
        }

        // ── Any client joins an existing room ──────────────────────────────
        // Authorization: a client proves creator identity by supplying the
        // ownerToken that was issued at CREATE_ROOM time.  The check must
        // happen BEFORE currentRoomCode is mutated; isCreator is derived from
        // the token match and never inherited from a previous CREATE_ROOM.
        case "JOIN_ROOM": {
          const code = String(msg.roomCode ?? "").trim();
          const room = rooms.get(code);
          if (!room) {
            ws.send(JSON.stringify({ type: "ERROR", message: `Room ${code} not found` }));
            return;
          }

          // ① Determine creator status BEFORE any side effects
          const providedToken = String(msg.ownerToken ?? "");
          const tokenMatches =
            providedToken.length > 0 && providedToken === room.ownerToken;

          // ② Leave previous room if switching to a different one
          if (currentRoomCode && currentRoomCode !== code) {
            const prev = rooms.get(currentRoomCode);
            if (prev) {
              prev.clients.delete(ws);
              if (prev.clients.size === 0) rooms.delete(currentRoomCode);
            }
          }

          // ③ Bind socket to the new room
          currentRoomCode = code;
          isCreator = tokenMatches; // never carried over from a prior CREATE_ROOM
          room.clients.add(ws);

          ws.send(JSON.stringify({ type: "ROOM_JOINED", roomCode: code, state: room.state }));
          console.log(
            `[WS] Client joined room ${code} (creator=${isCreator}, ${room.clients.size} clients)`,
          );
          break;
        }

        // ── Room creator pushes updated game state ─────────────────────────
        // Only the socket whose token matched at JOIN_ROOM may push state.
        // We use the server-tracked currentRoomCode — ignoring any roomCode
        // field in the message for authorization.
        case "STATE_UPDATE": {
          if (!isCreator || !currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.state = msg.state;
          broadcastToRoom(room, { type: "SYNC", state: msg.state }, ws);
          break;
        }

        // ── Room creator sends a transient effect (confetti / fanfare / wrong)
        // Same authorization requirement as STATE_UPDATE.
        case "EFFECT": {
          if (!isCreator || !currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          broadcastToRoom(room, { type: "EFFECT", effect: msg.effect }, ws);
          break;
        }

        // ── Keep-alive ─────────────────────────────────────────────────────
        case "PING": {
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
        }
      }
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.clients.delete(ws);
          if (room.clients.size === 0) {
            rooms.delete(currentRoomCode);
            console.log(`[WS] Room ${currentRoomCode} deleted (empty)`);
          }
        }
      }
    });

    ws.on("error", (err) => {
      console.error("[WS] Client error:", err.message);
    });
  });

  return httpServer;
}
