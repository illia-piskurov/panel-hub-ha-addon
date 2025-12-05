import { serve } from "bun";


const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_WS_URL = "ws://supervisor/core/websocket";

if (!SUPERVISOR_TOKEN) {
    console.error("FATAL: SUPERVISOR_TOKEN is missing. This script must run as a Home Assistant Add-on.");
    process.exit(1);
}

console.log(`🚀 Starting Lovelace Manager Add-on`);
console.log(`🔗 Internal WS URL: ${HA_WS_URL}`);

const AUTH_FILE_PATH = "/homeassistant/.storage/auth";
const LOVELANCE_DASHBOARD_FILE_PATH = "/homeassistant/.storage/lovelace_dashboards";
const OPTIONS_PATH = "/data/options.json";


interface DashboardItem { id: string; title: string; url_path: string; mode: string; icon?: string; }
interface DashboardsListFile { data: { items: DashboardItem[]; } }
interface HADashboardItem { id: string; title: string; url_path: string; mode: string; icon?: string; }
interface HAViewVisibility { user?: string; }
interface HAView { title?: string; path?: string; icon?: string; visible?: HAViewVisibility[] | boolean; }
interface HADashboardConfig { data: { config: { title?: string; views: HAView[]; } } }
interface AppViewInfo { title: string; path: string; icon: string; isPublic: boolean; allowedUserIds: string[]; }
interface AppDashboardInfo { id: string; title: string; url: string; views: AppViewInfo[]; }
interface UpdatePayload { type: 'set_public' | 'set_user'; dashId: string; urlPath: string; viewPath: string; isPublic?: boolean; userId?: string; isAllowed?: boolean; }
interface AddonConfig { ha_url: string; }


const connectedClients = new Set<ReadableStreamDefaultController>();


const getAddonConfig = async (): Promise<AddonConfig> => {
    try {
        const file = Bun.file(OPTIONS_PATH);
        if (!await file.exists()) return { ha_url: "http://homeassistant.local:8123" };
        return await file.json();
    } catch (e) {
        return { ha_url: "http://homeassistant.local:8123" };
    }
}

const get_dashboards_list = async (): Promise<DashboardItem[]> => {
    try {
        const file = Bun.file(LOVELANCE_DASHBOARD_FILE_PATH);
        if (!await file.exists()) return [];
        const content = await file.json() as DashboardsListFile;
        return content.data.items;
    } catch (e) { return []; }
}

const get_dashboard_details = async (dashboard: HADashboardItem): Promise<AppDashboardInfo> => {
    const filename = `lovelace.${dashboard.id}`;
    const file = Bun.file(`/homeassistant/.storage/${filename}`);
    const result: AppDashboardInfo = { id: dashboard.id, title: dashboard.title, url: dashboard.url_path, views: [] };

    if (!await file.exists()) return result;

    try {
        const content = await file.json() as HADashboardConfig;
        const haViews = content.data.config.views || [];

        result.views = haViews.map((view, index) => {
            const allowedUsers: string[] = [];
            let isPublic = true;
            if (view.visible && Array.isArray(view.visible)) {
                isPublic = false;
                view.visible.forEach(rule => { if (rule.user) allowedUsers.push(rule.user); });
            }
            return {
                title: view.title || `Tab ${index + 1}`,
                path: view.path || String(index),
                icon: view.icon || "mdi:view-dashboard",
                isPublic: isPublic,
                allowedUserIds: allowedUsers
            };
        });
        return result;
    } catch (e) { return result; }
}

const fetchUsersData = async () => {
    try {
        const file = Bun.file(AUTH_FILE_PATH);
        if (!await file.exists()) return [];
        const content = await file.json();
        return content.data.users
            .filter((u: any) => u.is_active && !u.system_generated)
            .map((user: any) => ({ name: user.name, id: user.id, role: user.is_owner ? "Owner" : "User" }));
    } catch (err) { return []; }
};

const fetchDashboardsData = async () => {
    const dashboardsList = await get_dashboards_list();
    const detailedDashboards = await Promise.all(dashboardsList.map(d => get_dashboard_details(d)));
    return detailedDashboards;
};


const startHAListener = async () => {
    const connect = () => {
        console.log(`🔌 Connecting to HA Event Bus...`);
        const socket = new WebSocket(HA_WS_URL);
        let messageId = 1;

        socket.onopen = () => { };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());

            if (data.type === 'auth_required') {
                socket.send(JSON.stringify({ type: "auth", access_token: SUPERVISOR_TOKEN }));
            }

            if (data.type === 'auth_ok') {
                console.log("✅ HA Listener Authenticated.");
                socket.send(JSON.stringify({
                    id: messageId++,
                    type: "subscribe_events",
                    event_type: "lovelace_updated"
                }));
            }

            if (data.type === 'event' && data.event && data.event.event_type === 'lovelace_updated') {
                console.log("📢 Event: Lovelace Updated. Notifying clients...");
                notifyClients();
            }
        };

        socket.onclose = () => {
            console.warn("⚠️ HA Listener disconnected. Reconnecting in 5s...");
            setTimeout(connect, 5000);
        };

        socket.onerror = (e) => {
            console.error("❌ HA Listener Error:", e);
        };
    };

    connect();
};


const notifyClients = () => {
    connectedClients.forEach(controller => {
        try {
            controller.enqueue("data: update\n\n");
        } catch (e) {
            connectedClients.delete(controller);
        }
    });
};


const saveConfigViaWS = async (urlPath: string, config: any): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(HA_WS_URL);
        let messageId = 1;
        let authenticated = false;

        socket.onopen = () => { };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());

            if (data.type === 'auth_required') {
                socket.send(JSON.stringify({ type: "auth", access_token: SUPERVISOR_TOKEN }));
            }

            if (data.type === 'auth_ok') {
                authenticated = true;
                const targetUrlPath = urlPath === 'lovelace' ? null : urlPath;
                console.log(`📝 Saving config for: ${targetUrlPath || 'default'}`);

                socket.send(JSON.stringify({
                    id: messageId,
                    type: "lovelace/config/save",
                    url_path: targetUrlPath,
                    config: config
                }));
            }

            if (data.id === messageId && authenticated) {
                if (data.success) {
                    console.log("✅ Config saved successfully");
                    resolve(true);
                } else {
                    console.error("❌ Save failed:", data.error);
                    resolve(false);
                }
                socket.close();
            }
        };

        socket.onerror = () => {
            console.error("❌ WS Write Error");
            resolve(false);
        }

        setTimeout(() => {
            if (socket.readyState !== WebSocket.CLOSED) {
                socket.close();
                resolve(false);
            }
        }, 5000);
    });
};


const updateDashboardAccess = async (payload: UpdatePayload) => {
    const filename = `lovelace.${payload.dashId}`;
    const filePath = `/homeassistant/.storage/${filename}`;
    const file = Bun.file(filePath);

    if (!await file.exists()) return { success: false, error: "Dashboard file not found" };

    try {
        const content = await file.json() as HADashboardConfig;
        const views = content.data.config.views;

        if (!views) return { success: false, error: "No views found in dashboard" };

        const targetView = views.find((v, index) => {
            const currentPath = v.path || String(index);
            return currentPath === payload.viewPath;
        });

        if (!targetView) return { success: false, error: "View not found" };

        if (payload.type === 'set_public') {
            if (payload.isPublic) {
                delete targetView.visible;
            } else {
                if (!targetView.visible || !Array.isArray(targetView.visible)) targetView.visible = [];
            }
        }
        else if (payload.type === 'set_user') {
            if (!Array.isArray(targetView.visible)) targetView.visible = [];
            const targetVisible = targetView.visible as HAViewVisibility[];
            const userId = payload.userId!;

            if (payload.isAllowed) {
                if (!targetVisible.some(r => r.user === userId)) targetVisible.push({ user: userId });
            } else {
                targetView.visible = targetVisible.filter(r => r.user !== userId);
            }
        }

        const success = await saveConfigViaWS(payload.urlPath, content.data.config);

        if (success) return { success: true };
        else return { success: false, error: "HA refused to save config" };

    } catch (e) {
        console.error(e);
        return { success: false, error: String(e) };
    }
}


const renderPage = (users: any[], dashboards: any[], haUrl: string) => {
    const cleanHaUrl = haUrl.replace(/\/$/, "");

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HA Dashboard Manager</title>
        <style>
            :root { --primary: #03a9f4; --bg: #1c1c1c; --card-bg: #2c2c2c; --text: #e1e1e1; --border: #444; --success: #4caf50; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            h1 { color: var(--primary); margin: 0; }
            .btn { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
            .btn:hover { background: #3c3c3c; }
            .dashboard-card { background: var(--card-bg); border-radius: 8px; margin-bottom: 20px; padding: 15px; border: 1px solid var(--border); }
            .dashboard-header { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 10px;}
            .view-item { margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; }
            .view-header { display: flex; justify-content: space-between; align-items: center; }
            .view-title { font-weight: 600; display: flex; align-items: center; gap: 8px; }
            .users-list { margin-top: 10px; padding-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; transition: opacity 0.3s; }
            .users-list.hidden { display: none; }
            .users-list.loading { opacity: 0.5; pointer-events: none; }
            .user-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; }
            .user-checkbox:hover { background: rgba(255,255,255,0.1); }
            .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; border-radius: 20px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--primary); }
            input:checked + .slider:before { transform: translateX(20px); }
            .badge { font-size: 0.8em; padding: 2px 6px; border-radius: 4px; background: #444; }
            #toast { visibility: hidden; min-width: 250px; background-color: #333; color: #fff; text-align: center; border-radius: 4px; padding: 16px; position: fixed; z-index: 1; right: 30px; bottom: 30px; font-size: 17px; border-left: 5px solid var(--success); }
            #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
            @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
            @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
        </style>
    </head>
    <body>
        <div class="header-bar">
            <h1>Lovelace Access Control</h1>
            <div style="display:flex; gap:10px; align-items:center;">
                <span id="status-indicator" style="width:10px; height:10px; background:grey; border-radius:50%; display:inline-block;" title="Connection Status"></span>
                <span style="font-size:0.8em; color:#888;">Auto-updates enabled</span>
            </div>
        </div>
        
        <div id="app">Loading...</div>
        <div id="toast">Changes saved</div>

        <script>
            let currentDashboards = ${JSON.stringify(dashboards)};
            let currentUsers = ${JSON.stringify(users)};
            let haUrl = "${cleanHaUrl}";

            // === SSE CONNECTION ===
            const statusInd = document.getElementById('status-indicator');
            const evtSource = new EventSource("/api/stream");
            
            evtSource.onopen = () => {
                statusInd.style.background = "#4caf50"; 
                console.log("SSE Connected");
            };

            evtSource.onmessage = async (event) => {
                console.log("Got update event. Refreshing...");
                await reloadData();
            };

            evtSource.onerror = () => {
                statusInd.style.background = "#f44336"; 
            };

            // === DATA LOGIC ===
            async function reloadData() {
                try {
                    const [dashRes, userRes] = await Promise.all([
                        fetch('/api/structure'),
                        fetch('/api/users')
                    ]);
                    currentDashboards = await dashRes.json();
                    currentUsers = await userRes.json();
                    renderApp();
                } catch(e) { console.error(e); }
            }

            function renderApp() {
                const app = document.getElementById('app');
                const html = currentDashboards.map(dash => \`
                    <div class="dashboard-card">
                        <div class="dashboard-header">
                            <span>\${dash.title}</span>
                            <span class="badge">\${dash.url}</span>
                            <a href="\${haUrl}/\${dash.url}" target="_blank" class="btn" style="font-size:0.8em; margin-left:auto; text-decoration:none">Open ↗</a>
                        </div>
                        <div class="views-container">
                            \${dash.views.map((view) => \`
                                <div class="view-item">
                                    <div class="view-header">
                                        <div class="view-title">
                                            <span>\${view.icon ? '👁️' : '#'}</span>
                                            \${view.title} <span style="font-weight:normal; opacity:0.6">(\${view.path})</span>
                                        </div>
                                        <label class="switch" title="Public access">
                                            <input type="checkbox" \${view.isPublic ? 'checked' : ''} onchange="togglePublic('\${dash.id}', '\${dash.url}', '\${view.path}', this.checked)">
                                            <span class="slider"></span>
                                        </label>
                                    </div>
                                    <div class="users-list \${view.isPublic ? 'hidden' : ''}" id="users-\${dash.id}-\${view.path}">
                                        \${currentUsers.map(user => \`
                                            <label class="user-checkbox">
                                                <input type="checkbox" value="\${user.id}" \${view.allowedUserIds.includes(user.id) ? 'checked' : ''} onchange="updatePermission('\${dash.id}', '\${dash.url}', '\${view.path}', '\${user.id}', this.checked)">
                                                \${user.name}
                                            </label>
                                        \`).join('')}
                                    </div>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
                app.innerHTML = html;
            }

            renderApp();

            function showToast() {
                var x = document.getElementById("toast");
                x.className = "show";
                setTimeout(() => { x.className = x.className.replace("show", ""); }, 3000);
            }

            async function togglePublic(dashId, dashUrl, viewPath, isPublic) {
                const success = await sendUpdate({ type: 'set_public', dashId, urlPath: dashUrl, viewPath, isPublic });
                if (success) {
                    const userList = document.getElementById('users-' + dashId + '-' + viewPath);
                    if (isPublic) userList.classList.add('hidden');
                    else userList.classList.remove('hidden');
                } else {
                    reloadData();
                }
            }

            function updatePermission(dashId, dashUrl, viewPath, userId, isAllowed) {
                sendUpdate({ type: 'set_user', dashId, urlPath: dashUrl, viewPath, userId, isAllowed });
            }

            async function sendUpdate(payload) {
                try {
                    const res = await fetch('/api/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast();
                        return true;
                    } else {
                        alert('Error: ' + data.error);
                        return false;
                    }
                } catch (e) { alert('Network Error'); return false; }
            }
        </script>
    </body>
    </html>
    `;
};


startHAListener();

const server = serve({
    port: 8000,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/stream") {
            let controller: ReadableStreamDefaultController;
            let heartbeatInterval: Timer;
            return new Response(new ReadableStream({
                start(c) {
                    controller = c;
                    connectedClients.add(controller);
                    heartbeatInterval = setInterval(() => {
                        try { controller.enqueue(": ping\n\n"); }
                        catch (e) { connectedClients.delete(controller); clearInterval(heartbeatInterval); }
                    }, 30000);
                },
                cancel() {
                    connectedClients.delete(controller);
                    clearInterval(heartbeatInterval);
                }
            }), {
                headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" }
            });
        }

        if (url.pathname === "/api/users") return Response.json(await fetchUsersData());
        if (url.pathname === "/api/structure") return Response.json(await fetchDashboardsData());

        if (url.pathname === "/api/update" && req.method === "POST") {
            try {
                const payload = await req.json() as UpdatePayload;
                const result = await updateDashboardAccess(payload);
                if (result.success) return Response.json({ success: true });
                else return Response.json({ success: false, error: result.error }, { status: 500 });
            } catch (e) { return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
        }

        if (url.pathname === "/") {
            const config = await getAddonConfig();
            const users = await fetchUsersData();
            const dashboards = await fetchDashboardsData();
            const html = renderPage(users, dashboards, config.ha_url);
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running at ${server.url}`);