interface HAUser {
    id: string;
    name: string;
    is_active: boolean;
    is_owner: boolean;
    system_generated: boolean;
}

interface AuthFile {
    data: {
        users: HAUser[];
    }
}

interface DashboardItem {
    id: string;
    title: string;
    url_path: string;
    mode: string;
    icon?: string;
}

interface DashboardsListFile {
    data: {
        items: DashboardItem[];
    }
}

interface HADashboardItem {
    id: string;
    title: string;
    url_path: string;
    mode: string;
    icon?: string;
}

interface HAFileList {
    data: { items: HADashboardItem[] }
}

interface HAViewVisibility {
    user?: string;
}

interface HAView {
    title?: string;
    path?: string;
    icon?: string;
    visible?: HAViewVisibility[] | boolean;
}

interface HADashboardConfig {
    data: {
        config: {
            title?: string;
            views: HAView[];
        }
    }
}

interface AppViewInfo {
    title: string;
    path: string;
    icon: string;
    isPublic: boolean;
    allowedUserIds: string[];
}

interface AppDashboardInfo {
    id: string;
    title: string;
    url: string;
    views: AppViewInfo[];
}

interface UpdatePayload {
    type: 'set_public' | 'set_user';
    dashId: string;
    viewPath: string;
    isPublic?: boolean;
    userId?: string;
    isAllowed?: boolean;
}

const AUTH_FILE_PATH = "/homeassistant/.storage/auth";
const LOVELANCE_DASHBOARD_FILE_PATH = "/homeassistant/.storage/lovelace_dashboards";

const get_dashboards_list = async (): Promise<DashboardItem[]> => {
    try {
        const file = Bun.file(LOVELANCE_DASHBOARD_FILE_PATH);

        if (!await file.exists()) return [];

        const content = await file.json() as DashboardsListFile;
        return content.data.items;
    } catch (e) {
        console.error("Error reading dashboards list", e);
        return [];
    }
}

const get_dashboard_details = async (dashboard: HADashboardItem): Promise<AppDashboardInfo> => {
    const filename = `lovelace.${dashboard.id}`;
    const file = Bun.file(`/homeassistant/.storage/${filename}`);

    const result: AppDashboardInfo = {
        id: dashboard.id,
        title: dashboard.title,
        url: dashboard.url_path,
        views: []
    };

    if (!await file.exists()) return result;

    try {
        const content = await file.json() as HADashboardConfig;
        const haViews = content.data.config.views || [];

        result.views = haViews.map((view, index) => {
            const allowedUsers: string[] = [];

            let isPublic = true;

            if (view.visible && Array.isArray(view.visible)) {
                isPublic = false;

                view.visible.forEach(rule => {
                    if (rule.user) {
                        allowedUsers.push(rule.user);
                    }
                });
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

    } catch (e) {
        console.error(`Error parsing ${filename}`, e);
        return result;
    }
}

const fetchUsersData = async () => {
    try {
        const file = Bun.file(AUTH_FILE_PATH);
        if (!await file.exists()) return [];
        const content = await file.json();

        return content.data.users
            .filter((u: any) => u.is_active && !u.system_generated)
            .map((user: any) => ({
                name: user.name,
                id: user.id,
                role: user.is_owner ? "Owner" : "User"
            }));
    } catch (err) {
        console.error(err);
        return [];
    }
};

const fetchDashboardsData = async () => {
    const dashboardsList = await get_dashboards_list();

    const detailedDashboards = await Promise.all(
        dashboardsList.map(d => get_dashboard_details(d))
    );

    return detailedDashboards;
};

const renderPage = (users: any[], dashboards: any[]) => {
    return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HA Dashboard Manager</title>
        <style>
            :root {
                --primary: #03a9f4;
                --bg: #1c1c1c;
                --card-bg: #2c2c2c;
                --text: #e1e1e1;
                --border: #444;
            }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
            h1 { color: var(--primary); }
            
            .dashboard-card { background: var(--card-bg); border-radius: 8px; margin-bottom: 20px; padding: 15px; border: 1px solid var(--border); }
            .dashboard-header { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 10px;}
            
            .view-item { margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; }
            .view-header { display: flex; justify-content: space-between; align-items: center; }
            .view-title { font-weight: 600; display: flex; align-items: center; gap: 8px; }
            
            .users-list { margin-top: 10px; padding-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
            .users-list.hidden { display: none; }
            
            .user-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; }
            .user-checkbox:hover { background: rgba(255,255,255,0.1); }
            
            /* Toggle Switch Style */
            .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--primary); }
            input:checked + .slider:before { transform: translateX(20px); }
            
            .badge { font-size: 0.8em; padding: 2px 6px; border-radius: 4px; background: #444; }
        </style>
    </head>
    <body>
        <h1>Управление доступами Lovelace</h1>
        
        <div id="app">
            ${dashboards.map(dash => `
                <div class="dashboard-card">
                    <div class="dashboard-header">
                        <span>${dash.title}</span>
                        <span class="badge">${dash.id}</span>
                    </div>
                    
                    <div class="views-container">
                        ${dash.views.map((view: any, vIndex: number) => `
                            <div class="view-item" data-dash="${dash.id}" data-view="${vIndex}">
                                <div class="view-header">
                                    <div class="view-title">
                                        <span>${view.icon ? '👁️' : '#'}</span>
                                        ${view.title} <span style="font-weight:normal; opacity:0.6">(${view.path})</span>
                                    </div>
                                    <label class="switch" title="Публичный доступ (видят все)">
                                        <input type="checkbox" 
                                               class="public-toggle" 
                                               ${view.isPublic ? 'checked' : ''}
                                               onchange="togglePublic('${dash.id}', '${view.path}', this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                
                                <div class="users-list ${view.isPublic ? 'hidden' : ''}" id="users-${dash.id}-${view.path}">
                                    ${users.map(user => `
                                        <label class="user-checkbox">
                                            <input type="checkbox" 
                                                   value="${user.id}"
                                                   ${view.allowedUserIds.includes(user.id) ? 'checked' : ''}
                                                   onchange="updatePermission('${dash.id}', '${view.path}', '${user.id}', this.checked)">
                                            ${user.name}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <script>
            function togglePublic(dashId, viewPath, isPublic) {
                const userList = document.getElementById('users-' + dashId + '-' + viewPath);
                if (isPublic) {
                    userList.classList.add('hidden');
                } else {
                    userList.classList.remove('hidden');
                }

                console.log('API CALL: Set Public', { dashId, viewPath, isPublic });
                sendUpdate({ type: 'set_public', dashId, viewPath, isPublic });
            }

            function updatePermission(dashId, viewPath, userId, isAllowed) {
                console.log('API CALL: User Permission', { dashId, viewPath, userId, isAllowed });
                sendUpdate({ type: 'set_user', dashId, viewPath, userId, isAllowed });
            }

            async function sendUpdate(payload) {
                try {
                    /*
                    const res = await fetch('/api/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) alert('Save error!');
                    */
                } catch (e) {
                    console.error(e);
                }
            }
        </script>
    </body>
    </html>
    `;
};

const server = Bun.serve({
    port: 8000,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/users") {
            return Response.json(await fetchUsersData());
        }

        if (url.pathname === "/api/structure") {
            return Response.json(await fetchDashboardsData());
        }

        if (url.pathname === "/") {
            const users = await fetchUsersData();
            const dashboards = await fetchDashboardsData();
            const html = renderPage(users, dashboards);
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running at ${server.url}`);