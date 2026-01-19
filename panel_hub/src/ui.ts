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
            .dashboard-card { background: var(--card-bg); border-radius: 8px; margin-bottom: 20px; padding: 15px; border: 1px solid var(--border); }
            .dashboard-header { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 10px; cursor: pointer; user-select: none; }
            .dashboard-header:hover { background: rgba(255,255,255,0.03); margin: -5px -15px 10px -15px; padding: 5px 15px 10px 15px; border-radius: 8px 8px 0 0; }
            .toggle-icon { transition: transform 0.3s; font-size: 0.8em; }
            .toggle-icon.collapsed { transform: rotate(-90deg); }
            .views-container { max-height: 5000px; overflow: hidden; transition: max-height 0.3s ease-out, opacity 0.3s; opacity: 1; }
            .views-container.collapsed { max-height: 0; opacity: 0; }
            .view-item { margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; }
            .view-header { display: flex; justify-content: space-between; align-items: center; }
            .view-title { font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; flex: 1; }
            .view-title:hover { opacity: 0.8; }
            .view-title.disabled { cursor: default; opacity: 0.6; }
            .view-title.disabled:hover { opacity: 0.6; }
            .users-list { margin-top: 10px; padding-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; transition: max-height 0.3s ease-out, opacity 0.3s; max-height: 2000px; overflow: hidden; }
            .users-list.hidden { display: none; }
            .users-list.collapsed { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; }
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
            .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--border); }
            .tab { padding: 10px 20px; cursor: pointer; background: transparent; border: none; color: var(--text); font-size: 1rem; border-bottom: 3px solid transparent; transition: all 0.2s; user-select: none; }
            .tab:hover { background: rgba(255,255,255,0.05); }
            .tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .user-card { background: var(--card-bg); border-radius: 8px; margin-bottom: 15px; padding: 15px; border: 1px solid var(--border); }
            .user-card-header { font-size: 1.1em; font-weight: bold; display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; padding: 5px; border-radius: 4px; }
            .user-card-header:hover { background: rgba(255,255,255,0.05); }
            .access-list { margin-top: 10px; padding-left: 10px; max-height: 3000px; overflow: hidden; transition: max-height 0.3s ease-out, opacity 0.3s; opacity: 1; }
            .access-list.collapsed { max-height: 0; opacity: 0; margin-top: 0; }
            .access-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-top: 5px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid var(--border); }
            .access-item.public { border-left-color: var(--success); }
            .access-item.private { border-left-color: #ff9800; }
            .access-item-info { display: flex; flex-direction: column; gap: 2px; }
            .access-item-title { font-weight: 600; }
            .access-item-path { font-size: 0.85em; opacity: 0.7; }
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

            function saveExpandedState() {
                expandedState = {};
                // Save dashboard states
                document.querySelectorAll('[id^="dash-views-"]').forEach(el => {
                    const dashIndex = el.id.replace('dash-views-', '');
                    expandedState['dash-' + dashIndex] = !el.classList.contains('collapsed');
                });
                // Save view states
                document.querySelectorAll('[id^="users-"]').forEach(el => {
                    if (!el.classList.contains('hidden')) {
                        expandedState['view-' + el.id] = !el.classList.contains('collapsed');
                    }
                });
                // Save user card states
                document.querySelectorAll('[id^="user-access-"]').forEach(el => {
                    const userIndex = el.id.replace('user-access-', '');
                    expandedState['user-' + userIndex] = !el.classList.contains('collapsed');
                });
            }

            function restoreExpandedState() {
                Object.keys(expandedState).forEach(key => {
                    if (key.startsWith('dash-')) {
                        const dashIndex = key.replace('dash-', '');
                        const el = document.getElementById('dash-views-' + dashIndex);
                        const icon = document.getElementById('dash-toggle-' + dashIndex);
                        if (el && expandedState[key]) {
                            el.classList.remove('collapsed');
                            if (icon) icon.classList.remove('collapsed');
                        }
                    } else if (key.startsWith('view-')) {
                        const viewId = key.replace('view-users-', '');
                        const el = document.getElementById('users-' + viewId);
                        if (el && !el.classList.contains('hidden') && expandedState[key]) {
                            el.classList.remove('collapsed');
                            const match = viewId.match(/(.+)-(.+)/);
                            if (match) {
                                const dashIndex = match[1].split('-')[0];
                                const viewIndex = match[2];
                                const icon = document.getElementById('view-toggle-' + dashIndex + '-' + viewIndex);
                                if (icon) icon.classList.remove('collapsed');
                            }
                        }
                    } else if (key.startsWith('user-')) {
                        const userIndex = key.replace('user-', '');
                        const el = document.getElementById('user-access-' + userIndex);
                        const icon = document.getElementById('user-toggle-' + userIndex);
                        if (el && expandedState[key]) {
                            el.classList.remove('collapsed');
                            if (icon) icon.classList.remove('collapsed');
                        }
                    }
                });
            }

            const statusInd = document.getElementById('status-indicator');
            const evtSource = new EventSource("./api/stream");
            
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

            async function reloadData() {
                try {
                    saveExpandedState();
                    const [dashRes, userRes] = await Promise.all([
                        fetch('./api/structure'),
                        fetch('./api/users')
                    ]);
                    currentDashboards = await dashRes.json();
                    currentUsers = await userRes.json();
                    renderApp();
                    restoreExpandedState();
                } catch(e) { console.error(e); }
            }
            
            function switchTab(tab) {
                activeTab = tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                event.target.classList.add('active');
                document.getElementById('tab-' + tab).classList.add('active');
                
                renderApp();
            }
            
            function renderApp() {
                if (activeTab === 'dashboards') {
                    renderDashboardsView();
                } else {
                    renderUsersView();
                }
            }
            
            function renderDashboardsView() {
                const container = document.getElementById('tab-dashboards');
                const html = currentDashboards.map((dash, dashIndex) => \`
                    <div class="dashboard-card">
                        <div class="dashboard-header" onclick="toggleDashboard('\${dashIndex}')">
                            <span class="toggle-icon collapsed" id="dash-toggle-\${dashIndex}">▼</span>
                            <span>\${dash.title}</span>
                            <span class="badge">\${dash.url}</span>
                            <a href="\${haUrl}/\${dash.url}" target="_blank" class="btn" style="font-size:0.8em; margin-left:auto; text-decoration:none" onclick="event.stopPropagation()">Open ↗</a>
                        </div>
                        <div class="views-container collapsed" id="dash-views-\${dashIndex}">
                            \${dash.views.map((view, viewIndex) => \`
                                <div class="view-item">
                                    <div class="view-header">
                                        <div class="view-title \${view.isPublic ? 'disabled' : ''}" onclick="\${view.isPublic ? '' : 'toggleViewUsers(' + dashIndex + ', ' + viewIndex + ')'}" style="\${view.isPublic ? 'cursor: default;' : ''}">
                                            <span class="toggle-icon \${view.isPublic ? '' : 'collapsed'}" id="view-toggle-\${dashIndex}-\${viewIndex}">\${view.isPublic ? '🔓' : '▼'}</span>
                                            <span>\${view.icon ? '👁️' : '#'}</span>
                                            \${view.title} <span style="font-weight:normal; opacity:0.6">(\${view.path})</span>
                                            \${view.isPublic ? '<span class="badge" style="background: var(--success); margin-left: 8px;">Public</span>' : ''}
                                        </div>
                                        <label class="switch" title="Public access">
                                            <input type="checkbox" \${view.isPublic ? 'checked' : ''} onchange="togglePublic('\${dash.id}', '\${dash.url}', '\${view.path}', this.checked)">
                                            <span class="slider"></span>
                                        </label>
                                    </div>
                                    <div class="users-list \${view.isPublic ? 'hidden' : 'collapsed'}" id="users-\${dash.id}-\${view.path}">
                                        \${view.isPublic ? 
                                            '<div style="padding: 10px; text-align: center; color: var(--success); font-weight: 600;">🔓 Public access - available to all users</div>' :
                                            currentUsers.map(user => \`
                                                <label class="user-checkbox">
                                                    <input type="checkbox" value="\${user.id}" \${view.allowedUserIds.includes(user.id) ? 'checked' : ''} onchange="updatePermission('\${dash.id}', '\${dash.url}', '\${view.path}', '\${user.id}', this.checked)">
                                                    \${user.name}
                                                </label>
                                            \`).join('')
                                        }
                                    </div>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
                container.innerHTML = html;
            }
            
            function renderUsersView() {
                const container = document.getElementById('tab-users');
                
                const userAccessMap = {};
                currentUsers.forEach(user => {
                    userAccessMap[user.id] = {
                        name: user.name,
                        role: user.role,
                        access: []
                    };
                });
                
                currentDashboards.forEach(dash => {
                    dash.views.forEach(view => {
                        const accessInfo = {
                            dashId: dash.id,
                            dashTitle: dash.title,
                            dashUrl: dash.url,
                            viewTitle: view.title,
                            viewPath: view.path,
                            icon: view.icon,
                            isPublic: view.isPublic,
                            hasAccess: false
                        };
                        
                        if (view.isPublic) {
                            Object.keys(userAccessMap).forEach(userId => {
                                userAccessMap[userId].access.push({ ...accessInfo, hasAccess: true });
                            });
                        } else {
                            view.allowedUserIds.forEach(userId => {
                                if (userAccessMap[userId]) {
                                    userAccessMap[userId].access.push({ ...accessInfo, hasAccess: true });
                                }
                            });
                            Object.keys(userAccessMap).forEach(userId => {
                                if (!view.allowedUserIds.includes(userId)) {
                                    userAccessMap[userId].access.push({ ...accessInfo, hasAccess: false });
                                }
                            });
                        }
                    });
                });
                
                const html = currentUsers.map((user, userIndex) => {
                    const userData = userAccessMap[user.id];
                    const accessCount = userData.access.filter(a => a.hasAccess).length;
                    const totalCount = currentDashboards.reduce((sum, d) => sum + d.views.length, 0);
                    
                    return \`
                        <div class="user-card">
                            <div class="user-card-header" onclick="toggleUserAccess('\${userIndex}')">
                                <span class="toggle-icon collapsed" id="user-toggle-\${userIndex}">▼</span>
                                <span>\${user.name}</span>
                                <span class="badge">\${user.role}</span>
                                <span class="badge" style="background: var(--primary);">\${accessCount}/\${totalCount} views</span>
                            </div>
                            <div class="access-list collapsed" id="user-access-\${userIndex}">
                                \${userData.access.map(item => \`
                                    <div class="access-item \${item.isPublic ? 'public' : (item.hasAccess ? 'private' : '')}">
                                        <div class="access-item-info">
                                            <div class="access-item-title">
                                                <span>\${item.icon ? '👁️' : '#'}</span>
                                                \${item.dashTitle} / \${item.viewTitle}
                                            </div>
                                            <div class="access-item-path">\${item.dashUrl}/\${item.viewPath}</div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            \${item.isPublic ? 
                                                '<span class="badge" style="background: var(--success);">Public</span>' :
                                                \`<label class="switch" title="Toggle access">
                                                    <input type="checkbox" \${item.hasAccess ? 'checked' : ''} 
                                                        onchange="updatePermission('\${item.dashId}', '\${item.dashUrl}', '\${item.viewPath}', '\${user.id}', this.checked)">
                                                    <span class="slider"></span>
                                                </label>\`
                                            }
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }).join('');
                
                container.innerHTML = html;
            }
            
            function toggleUserAccess(userIndex) {
                const container = document.getElementById('user-access-' + userIndex);
                const icon = document.getElementById('user-toggle-' + userIndex);
                container.classList.toggle('collapsed');
                icon.classList.toggle('collapsed');
            }
            
            function toggleDashboard(dashIndex) {
                const container = document.getElementById('dash-views-' + dashIndex);
                const icon = document.getElementById('dash-toggle-' + dashIndex);
                container.classList.toggle('collapsed');
                icon.classList.toggle('collapsed');
            }
            
            function toggleViewUsers(dashIndex, viewIndex) {
                const icon = document.getElementById('view-toggle-' + dashIndex + '-' + viewIndex);
                icon.classList.toggle('collapsed');
                
                const viewItem = icon.closest('.view-item');
                const usersList = viewItem.querySelector('.users-list');
                if (usersList && !usersList.classList.contains('hidden')) {
                    usersList.classList.toggle('collapsed');
                }
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
                    if (isPublic) {
                        userList.classList.add('hidden');
                        userList.classList.remove('collapsed');
                    } else {
                        userList.classList.remove('hidden');
                        userList.classList.add('collapsed');
                    }
                } else {
                    reloadData();
                }
            }

            function updatePermission(dashId, dashUrl, viewPath, userId, isAllowed) {
                sendUpdate({ type: 'set_user', dashId, urlPath: dashUrl, viewPath, userId, isAllowed }).then(success => {
                    if (success) {
                        reloadData();
                    }
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
