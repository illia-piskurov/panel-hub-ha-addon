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
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/stream") {
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

        if (url.pathname === "/api/users")
            return Response.json(await fetchUsersData());
        if (url.pathname === "/api/structure")
            return Response.json(await fetchDashboardsData());

        if (url.pathname === "/api/update" && req.method === "POST") {
            try {
                const payload = (await req.json()) as UpdatePayload;
                const result = await updateDashboardAccess(payload);
                if (result.success) return Response.json({ success: true });
                else
                    return Response.json(
                        { success: false, error: result.error },
                        { status: 500 },
                    );
            } catch (e) {
                return Response.json(
                    { success: false, error: "Invalid JSON" },
                    { status: 400 },
                );
            }
        }

        if (url.pathname === "/") {
            const config = await getAddonConfig();
            const users = await fetchUsersData();
            const dashboards = await fetchDashboardsData();
            const html = renderPage(users, dashboards, config.ha_url);
            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running at ${server.url}`);
