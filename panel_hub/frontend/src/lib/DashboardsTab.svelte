<script lang="ts">
    import { slide } from "svelte/transition";
    import type { AppDashboardInfo, UpdatePayload } from "./types";

    export let dashboards: AppDashboardInfo[];
    export let users: any[];
    export let haUrl: string;

    let expandedDashboards = new Set<string>();
    let expandedViews = new Set<string>();

    function toggleDash(id: string) {
        if (expandedDashboards.has(id)) expandedDashboards.delete(id);
        else expandedDashboards.add(id);
        expandedDashboards = expandedDashboards;
    }

    function toggleView(key: string) {
        if (expandedViews.has(key)) expandedViews.delete(key);
        else expandedViews.add(key);
        expandedViews = expandedViews;
    }

    async function sendUpdate(payload: UpdatePayload) {
        try {
            const res = await fetch("./api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                window.showToast();
                window.refreshData();
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Network Error");
        }
    }
</script>

{#each dashboards as dash (dash.id)}
    <div class="dashboard-card">
        <div class="dashboard-header" on:click={() => toggleDash(dash.id)}>
            <span
                class="toggle-icon"
                class:collapsed={!expandedDashboards.has(dash.id)}>▼</span
            >
            <span>{dash.title}</span>
            <span class="badge">{dash.url}</span>
            <a
                href="{haUrl}/{dash.url}"
                target="_blank"
                class="btn link-btn"
                on:click|stopPropagation>Open ↗</a
            >
        </div>

        {#if expandedDashboards.has(dash.id)}
            <div class="views-container" transition:slide|local>
                {#each dash.views as view (view.path)}
                    <div class="view-item">
                        <div class="view-header">
                            <div
                                class="title-area"
                                on:click={() =>
                                    !view.isPublic &&
                                    toggleView(`${dash.id}-${view.path}`)}
                            >
                                <span
                                    class="toggle-icon"
                                    class:collapsed={!expandedViews.has(
                                        `${dash.id}-${view.path}`,
                                    )}
                                    style:visibility={view.isPublic
                                        ? "hidden"
                                        : "visible"}
                                >
                                    ▼
                                </span>
                                {view.title}
                                <span class="path">({view.path})</span>
                            </div>

                            <label class="switch">
                                <input
                                    type="checkbox"
                                    checked={view.isPublic}
                                    on:change={(e) =>
                                        sendUpdate({
                                            type: "set_public",
                                            dashId: dash.id,
                                            urlPath: dash.url,
                                            viewPath: view.path,
                                            isPublic: e.currentTarget.checked,
                                        })}
                                />
                                <span class="slider"></span>
                            </label>
                        </div>

                        {#if !view.isPublic && expandedViews.has(`${dash.id}-${view.path}`)}
                            <div class="users-list" transition:slide|local>
                                {#each users as user (user.id)}
                                    <label class="user-row">
                                        <input
                                            type="checkbox"
                                            checked={view.allowedUserIds.includes(
                                                user.id,
                                            )}
                                            on:change={(e) =>
                                                sendUpdate({
                                                    type: "set_user",
                                                    dashId: dash.id,
                                                    urlPath: dash.url,
                                                    viewPath: view.path,
                                                    userId: user.id,
                                                    isAllowed:
                                                        e.currentTarget.checked,
                                                })}
                                        />
                                        {user.name}
                                    </label>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/each}

<style>
    .dashboard-card {
        background: #2c2c2c;
        border-radius: 8px;
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #444;
    }
    .dashboard-header {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 10px;
        cursor: pointer;
        user-select: none;
        border-bottom: 1px solid #444;
    }
    .dashboard-header:hover {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px 8px 0 0;
    }
    .toggle-icon {
        transition: transform 0.3s ease;
        font-size: 0.8em;
        display: inline-block;
    }
    .toggle-icon.collapsed {
        transform: rotate(-90deg);
    }
    .badge {
        font-size: 0.75em;
        padding: 2px 6px;
        border-radius: 4px;
        background: #444;
        font-weight: normal;
    }
    .link-btn {
        margin-left: auto;
        text-decoration: none;
        font-size: 0.7em;
        background: #2c2c2c;
        border: 1px solid #444;
        color: #e1e1e1;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .view-item {
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        margin: 0;
    }
    .views-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
    }
    .view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .title-area {
        cursor: pointer;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .path {
        opacity: 0.5;
        font-size: 0.9em;
    }

    .users-list {
        margin-top: 10px;
        padding-left: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px;
    }
    .user-row {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px;
    }
    .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
        flex-shrink: 0;
    }
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #555;
        transition: 0.4s;
        border-radius: 20px;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }
    input:checked + .slider {
        background-color: #03a9f4;
    }
    input:checked + .slider:before {
        transform: translateX(20px);
    }
</style>
