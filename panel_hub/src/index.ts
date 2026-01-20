import { Hono } from "hono";
import { serve } from "bun";
import { connectedClients } from "./config";
import {
    fetchDashboardsData,
    fetchUsersData,
    getAddonConfig,
    updateDashboardAccess,
} from "./data-service";
import { startHAListener } from "./ha-api";
import type { UpdatePayload } from "./types";
import { renderPage } from "./ui";

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

app.get("/", async (c) => {
    console.log("[DEBUG] Rendering main page...");
    try {
        const config = await getAddonConfig();
        const users = await fetchUsersData();
        const dashboards = await fetchDashboardsData();

        console.log(
            `[DEBUG] Rendering with ${users.length} users, ${dashboards.length} dashboards`,
        );

        const html = renderPage(users, dashboards, config.ha_url);

        return c.html(html);
    } catch (e) {
        console.error("[ERROR] Failed to render page:", e);
        return c.text(`Error: ${String(e)}`, 500);
    }
});

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
