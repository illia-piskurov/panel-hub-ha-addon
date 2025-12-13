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
                    const [dashRes, userRes] = await Promise.all([
                        fetch('./api/structure'),
                        fetch('./api/users')
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
