export const renderPage = (users: any[], dashboards: any[], haUrl: string) => {
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
            
            .dashboard-card, .user-card { background: var(--card-bg); border-radius: 8px; margin-bottom: 20px; padding: 15px; border: 1px solid var(--border); }
            .dashboard-header, .user-card-header { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 10px; cursor: pointer; user-select: none; }
            .dashboard-header:hover, .user-card-header:hover { background: rgba(255,255,255,0.03); margin: -5px -15px 10px -15px; padding: 5px 15px 10px 15px; border-radius: 8px 8px 0 0; }
            
            .toggle-icon { transition: transform 0.3s; font-size: 0.8em; display: inline-block; }
            .toggle-icon.collapsed { transform: rotate(-90deg); }
            
            .user-dash-section { margin-top: 10px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; }
            .user-dash-header { background: rgba(255,255,255,0.03); padding: 8px 12px; font-size: 0.9em; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s; }
            .user-dash-header:hover { background: rgba(255,255,255,0.08); }
            
            .views-container, .access-list, .users-list { max-height: 5000px; overflow: hidden; transition: max-height 0.3s ease-out, opacity 0.3s; opacity: 1; }
            .views-container.collapsed, .access-list.collapsed, .users-list.collapsed { max-height: 0; opacity: 0; }

            .view-item, .access-item { padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; margin: 8px 12px; }
            .access-item { margin: 4px 8px; border-left: 3px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .access-item.public { border-left-color: var(--success); }
            .access-item.private { border-left-color: var(--primary); }

            .users-list { margin-top: 10px; padding-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
            .users-list.hidden { display: none; }

            .switch { position: relative; display: inline-block; width: 40px; height: 20px; flex-shrink: 0; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; border-radius: 20px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--primary); }
            input:checked + .slider:before { transform: translateX(20px); }
            .badge { font-size: 0.75em; padding: 2px 6px; border-radius: 4px; background: #444; }

            .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--border); }
            .tab { padding: 10px 20px; cursor: pointer; background: transparent; border: none; color: var(--text); font-size: 1rem; border-bottom: 3px solid transparent; transition: all 0.2s; }
            .tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: bold; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }

            #toast { visibility: hidden; min-width: 250px; background-color: #333; color: #fff; text-align: center; border-radius: 4px; padding: 16px; position: fixed; z-index: 100; right: 30px; bottom: 30px; border-left: 5px solid var(--success); }
            #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
            @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
            @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
        </style>
    </head>
    <body>
        <div class="header-bar">
            <h1>Lovelace Access Control</h1>
            <div style="display:flex; gap:10px; align-items:center;">
                <span id="status-indicator" style="width:10px; height:10px; background:grey; border-radius:50%; display:inline-block;"></span>
                <span style="font-size:0.8em; color:#888;">Real-time Sync</span>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('dashboards')">By Dashboards</button>
            <button class="tab" onclick="switchTab('users')">By Users</button>
        </div>
        
        <div id="tab-dashboards" class="tab-content active"></div>
        <div id="tab-users" class="tab-content"></div>
        
        <div id="toast">Changes saved</div>

        <script>
            let currentDashboards = ${JSON.stringify(dashboards)};
            let currentUsers = ${JSON.stringify(users)};
            let haUrl = "${cleanHaUrl}";
            let activeTab = 'dashboards';
            let expandedState = {};

            // Функция сохранения: записываем все ID элементов, которые сейчас НЕ свернуты
            function saveExpandedState() {
                expandedState = {};
                const containers = document.querySelectorAll('.views-container, .access-list, .users-list');
                containers.forEach(el => {
                    if (el.id) {
                        expandedState[el.id] = !el.classList.contains('collapsed');
                    }
                });
            }

            // Функция восстановления: проходим по сохраненным ID и убираем collapsed у элементов и их иконок
            function restoreExpandedState() {
                Object.keys(expandedState).forEach(id => {
                    if (expandedState[id]) {
                        const el = document.getElementById(id);
                        if (el) {
                            el.classList.remove('collapsed');
                            
                            // Ищем соответствующую иконку по шаблонам ID
                            let iconId = null;
                            if (id.startsWith('dash-views-')) iconId = id.replace('dash-views-', 'dash-toggle-');
                            else if (id.startsWith('users-')) iconId = id.replace('users-', 'vtg-');
                            else if (id.startsWith('user-access-main-')) iconId = id.replace('user-access-main-', 'user-main-toggle-');
                            else if (id.startsWith('user-dash-content-')) iconId = id.replace('user-dash-content-', 'user-dash-toggle-');
                            
                            const icon = document.getElementById(iconId);
                            if (icon) icon.classList.remove('collapsed');
                        }
                    }
                });
            }

            const evtSource = new EventSource("./api/stream");
            evtSource.onopen = () => document.getElementById('status-indicator').style.background = "#4caf50";
            evtSource.onerror = () => document.getElementById('status-indicator').style.background = "#f44336";
            evtSource.onmessage = () => reloadData();

            async function reloadData() {
                try {
                    saveExpandedState();
                    const [dashRes, userRes] = await Promise.all([fetch('./api/structure'), fetch('./api/users')]);
                    currentDashboards = await dashRes.json();
                    currentUsers = await userRes.json();
                    renderApp();
                    restoreExpandedState();
                } catch(e) { console.error(e); }
            }
            
            function switchTab(tab) {
                activeTab = tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.innerText.toLowerCase().includes(tab)));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id.includes(tab)));
                renderApp();
            }
            
            function renderApp() {
                if (activeTab === 'dashboards') renderDashboardsView();
                else renderUsersView();
            }
            
            function renderDashboardsView() {
                const container = document.getElementById('tab-dashboards');
                container.innerHTML = currentDashboards.map((dash, dIdx) => \`
                    <div class="dashboard-card">
                        <div class="dashboard-header" onclick="toggleElement('dash-views-\${dIdx}', 'dash-toggle-\${dIdx}')">
                            <span class="toggle-icon collapsed" id="dash-toggle-\${dIdx}">▼</span>
                            <span>\${dash.title}</span>
                            <span class="badge">\${dash.url}</span>
                            <a href="\${haUrl}/\${dash.url}" target="_blank" class="btn" style="font-size:0.7em; margin-left:auto; text-decoration:none" onclick="event.stopPropagation()">Open ↗</a>
                        </div>
                        <div class="views-container collapsed" id="dash-views-\${dIdx}">
                            \${dash.views.map((view, vIdx) => \`
                                <div class="view-item">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div onclick="! \${view.isPublic} && toggleElement('users-\${dIdx}-\${vIdx}', 'vtg-\${dIdx}-\${vIdx}')" style="cursor:pointer; flex:1">
                                            <span class="toggle-icon \${view.isPublic ? '' : 'collapsed'}" id="vtg-\${dIdx}-\${vIdx}">\${view.isPublic ? '🔓' : '▼'}</span>
                                            \${view.title} <span style="opacity:0.5; font-size:0.9em">(\${view.path})</span>
                                        </div>
                                        <label class="switch"><input type="checkbox" \${view.isPublic ? 'checked' : ''} onchange="togglePublic('\${dash.id}', '\${dash.url}', '\${view.path}', this.checked)"><span class="slider"></span></label>
                                    </div>
                                    <div class="users-list \${view.isPublic ? 'hidden' : 'collapsed'}" id="users-\${dIdx}-\${vIdx}">
                                        \${currentUsers.map(user => \`
                                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px; border-radius:4px;">
                                                <input type="checkbox" \${view.allowedUserIds.includes(user.id) ? 'checked' : ''} onchange="updatePermission('\${dash.id}', '\${dash.url}', '\${view.path}', '\${user.id}', this.checked)"> \${user.name}
                                            </label>
                                        \`).join('')}
                                    </div>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
            }
            
            function renderUsersView() {
                const container = document.getElementById('tab-users');
                container.innerHTML = currentUsers.map((user, uIdx) => {
                    const totalViews = currentDashboards.reduce((acc, d) => acc + d.views.length, 0);
                    let userAccessCount = 0;

                    const groupedAccessHtml = currentDashboards.map((dash, dIdx) => {
                        const viewRows = dash.views.map(view => {
                            const hasAccess = view.isPublic || view.allowedUserIds.includes(user.id);
                            if (hasAccess) userAccessCount++;
                            return \`
                                <div class="access-item \${view.isPublic ? 'public' : 'private'}">
                                    <div>
                                        <div style="font-weight:600; font-size:0.9em">\${view.title}</div>
                                        <div style="font-size:0.75em; opacity:0.6">\${dash.url}/\${view.path}</div>
                                    </div>
                                    \${view.isPublic ? '<span class="badge" style="background:var(--success)">Public</span>' : \`
                                        <label class="switch">
                                            <input type="checkbox" \${hasAccess ? 'checked' : ''} onchange="updatePermission('\${dash.id}', '\${dash.url}', '\${view.path}', '\${user.id}', this.checked)">
                                            <span class="slider"></span>
                                        </label>
                                    \`}
                                </div>
                            \`;
                        }).join('');

                        return \`
                            <div class="user-dash-section">
                                <div class="user-dash-header" onclick="toggleElement('user-dash-content-\${uIdx}-\${dIdx}', 'user-dash-toggle-\${uIdx}-\${dIdx}')">
                                    <span class="toggle-icon collapsed" id="user-dash-toggle-\${uIdx}-\${dIdx}">▼</span>
                                    <span>\${dash.title}</span>
                                    <span class="badge">\${dash.views.length} views</span>
                                </div>
                                <div id="user-dash-content-\${uIdx}-\${dIdx}" class="access-list collapsed">
                                    \${viewRows}
                                </div>
                            </div>
                        \`;
                    }).join('');

                    return \`
                        <div class="user-card">
                            <div class="user-card-header" onclick="toggleElement('user-access-main-\${uIdx}', 'user-main-toggle-\${uIdx}')">
                                <span class="toggle-icon collapsed" id="user-main-toggle-\${uIdx}">▼</span>
                                <span>\${user.name}</span>
                                <span class="badge" style="background:var(--primary)">\${userAccessCount} / \${totalViews} Views</span>
                            </div>
                            <div id="user-access-main-\${uIdx}" class="access-list collapsed">
                                \${groupedAccessHtml}
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            function toggleElement(elId, iconId) {
                const el = document.getElementById(elId);
                const icon = document.getElementById(iconId);
                if (el) el.classList.toggle('collapsed');
                if (icon) icon.classList.toggle('collapsed');
            }

            async function togglePublic(dashId, dashUrl, viewPath, isPublic) {
                const res = await sendUpdate({ type: 'set_public', dashId, urlPath: dashUrl, viewPath, isPublic });
                if (res) reloadData();
            }

            function updatePermission(dashId, dashUrl, viewPath, userId, isAllowed) {
                sendUpdate({ type: 'set_user', dashId, urlPath: dashUrl, viewPath, userId, isAllowed }).then(res => {
                    if (res) reloadData();
                });
            }

            async function sendUpdate(payload) {
                try {
                    const res = await fetch('./api/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.success) {
                        const t = document.getElementById("toast");
                        t.className = "show";
                        setTimeout(() => t.className = "", 3000);
                        return true;
                    }
                    alert('Error: ' + data.error);
                } catch (e) { alert('Network Error'); }
                return false;
            }

            renderApp();
        </script>
    </body>
    </html>
    `;
};