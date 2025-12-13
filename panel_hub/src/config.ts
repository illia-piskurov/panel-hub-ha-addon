export const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
export const HA_WS_URL = "ws://supervisor/core/websocket";

if (!SUPERVISOR_TOKEN) {
    console.error("FATAL: SUPERVISOR_TOKEN is missing.");
    process.exit(1);
}

console.log(`🚀 Starting Lovelace Manager Add-on`);
console.log(`🔗 Internal WS URL: ${HA_WS_URL}`);

export const AUTH_FILE_PATH = "/homeassistant/.storage/auth";
export const LOVELANCE_DASHBOARD_FILE_PATH =
    "/homeassistant/.storage/lovelace_dashboards";
export const OPTIONS_PATH = "/data/options.json";

export const connectedClients = new Set<ReadableStreamDefaultController>();
