import { Hono } from "hono";
import { serve } from "bun";
import { serveStatic } from "hono/bun";
import { connectedClients } from "./config";
import {
    fetchDashboardsData,
    fetchUsersData,
    getAddonConfig,
    updateDashboardAccess,
} from "./data-service";
import { startHAListener } from "./ha-api";
import type { UpdatePayload } from "./types";


startHAListener();

const app = new Hono();
const ingressPrefix = process.env.INGRESS_PATH || "";

app.use("*", async (c, next) => {
    if (ingressPrefix && c.req.path.startsWith(ingressPrefix)) {
        const stripped = c.req.path.slice(ingressPrefix.length) || "/";
        c.req.path = stripped;
    }

    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`);

    await next();
});

app.get("/api/config", async (c) => {
    const config = await getAddonConfig();
    const cleanHaUrl = config.ha_url.replace(/\/$/, "");
    return c.json({ haUrl: cleanHaUrl });
});

app.get("/api/stream", (c) => {
    let controller: ReadableStreamDefaultController;
    let heartbeatInterval: Timer;

    const stream = new ReadableStream({
        start(ctrl) {
            controller = ctrl;
            connectedClients.add(controller);

            heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(": ping\n\n");
                } catch {
                    connectedClients.delete(controller);
                    clearInterval(heartbeatInterval);
                }
            }, 30_000);
        },
        cancel() {
            connectedClients.delete(controller);
            clearInterval(heartbeatInterval);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
});

app.get("/api/users", async (c) => {
    try {
        const users = await fetchUsersData();
        return c.json(users);
    } catch (e) {
        return c.json({ error: String(e) }, 500);
    }
});

app.get("/api/structure", async (c) => {
    try {
        const dashboards = await fetchDashboardsData();
        return c.json(dashboards);
    } catch (e) {
        return c.json({ error: String(e) }, 500);
    }
});

app.post("/api/update", async (c) => {
    try {
        const payload = (await c.req.json()) as UpdatePayload;
        console.log("[DEBUG] Update request:", payload);

        const result = await updateDashboardAccess(payload);

        if (result.success) {
            return c.json({ success: true });
        }

        return c.json({ success: false, error: result.error }, 500);
    } catch (e) {
        console.error("[ERROR] Update failed:", e);
        return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
});

app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

app.notFound((c) => {
    console.log(`[WARN] Not found: ${c.req.path}`);
    return c.text("Not Found", 404);
});

const server = serve({
    port: 8000,
    idleTimeout: 120,
    fetch: app.fetch,
});

console.log(`✅ Server running at http://0.0.0.0:${server.port}`);
