export const HA_TOKEN = process.env.SUPERVISOR_TOKEN || process.env.HA_TOKEN;
export const HA_WS_URL = process.env.HA_WS_URL || 'ws://supervisor/core/websocket';

if (!HA_TOKEN) {
    console.error('FATAL: Token is missing. Provide SUPERVISOR_TOKEN (Add-on) or HA_TOKEN (Docker).');
    process.exit(1);
}

console.log(`🚀 Starting Panel Hub`);
console.log(`🔗 connecting to HA at: ${HA_WS_URL}`);

const CONFIG_DIR = process.env.HA_CONFIG_DIR || '/homeassistant';

export const AUTH_FILE_PATH = `${CONFIG_DIR}/.storage/auth`;
export const LOVELANCE_DASHBOARD_FILE_PATH = `${CONFIG_DIR}/.storage/lovelace_dashboards`;

export const OPTIONS_PATH = process.env.OPTIONS_PATH || '/data/options.json';

export const connectedClients = new Set<ReadableStreamDefaultController>();