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

const server = serve({
    port: 8000,
    idleTimeout: 120,
    async fetch(req) {
        const url = new URL(req.url);
        
        // Strip ingress prefix if present
        let pathname = url.pathname;
        const ingressPrefix = process.env.INGRESS_PATH || "";
        if (ingressPrefix && pathname.startsWith(ingressPrefix)) {
            pathname = pathname.substring(ingressPrefix.length) || "/";
        }
        
        // Add debug logging
        console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
        
        if (pathname === "/api/stream") {
            let controller: ReadableStreamDefaultController;
            let heartbeatInterval: Timer;
            return new Response(
                new ReadableStream({
                    start(c) {
                        controller = c;
                        connectedClients.add(controller);
                        heartbeatInterval = setInterval(() => {
                            try {
                                controller.enqueue(": ping\n\n");
                            } catch (e) {
                                connectedClients.delete(controller);
                                clearInterval(heartbeatInterval);
                            }
                        }, 30000);
                    },
                    cancel() {
                        connectedClients.delete(controller);
                        clearInterval(heartbeatInterval);
                    },
                }),
                {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        Connection: "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                },
            );
        }
        
        if (pathname === "/api/users") {
            console.log("[DEBUG] Fetching users...");
            try {
                const users = await fetchUsersData();
                console.log(`[DEBUG] Found ${users.length} users`);
                return Response.json(users);
            } catch (e) {
                console.error("[ERROR] Failed to fetch users:", e);
                return Response.json({ error: String(e) }, { status: 500 });
            }
        }
        
        if (pathname === "/api/structure") {
            console.log("[DEBUG] Fetching dashboards...");
            try {
                const dashboards = await fetchDashboardsData();
                console.log(`[DEBUG] Found ${dashboards.length} dashboards`);
                return Response.json(dashboards);
            } catch (e) {
                console.error("[ERROR] Failed to fetch dashboards:", e);
                return Response.json({ error: String(e) }, { status: 500 });
            }
        }
        
        if (pathname === "/api/update" && req.method === "POST") {
            try {
                const payload = (await req.json()) as UpdatePayload;
                console.log("[DEBUG] Update request:", payload);
                const result = await updateDashboardAccess(payload);
                if (result.success) return Response.json({ success: true });
                else
                    return Response.json(
                        { success: false, error: result.error },
                        { status: 500 },
                    );
            } catch (e) {
                console.error("[ERROR] Update failed:", e);
                return Response.json(
                    { success: false, error: "Invalid JSON" },
                    { status: 400 },
                );
            }
        }
        
        if (pathname === "/" || pathname === "") {
            console.log("[DEBUG] Rendering main page...");
            try {
                const config = await getAddonConfig();
                const users = await fetchUsersData();
                const dashboards = await fetchDashboardsData();
                console.log(`[DEBUG] Rendering with ${users.length} users, ${dashboards.length} dashboards`);
                const html = renderPage(users, dashboards, config.ha_url);
                return new Response(html, {
                    headers: { "Content-Type": "text/html" },
                });
            } catch (e) {
                console.error("[ERROR] Failed to render page:", e);
                return new Response(`Error: ${String(e)}`, { status: 500 });
            }
        }
        
        console.log(`[WARN] Not found: ${pathname}`);
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`✅ Server running at http://0.0.0.0:${server.port}`);
