<script lang="ts">
    import { slide } from "svelte/transition";
    import type { AppDashboardInfo } from "./types";

    export let dashboards: AppDashboardInfo[];
    export let users: any[];

    let expandedUsers = new Set<string>();
    let expandedUserDashboards = new Set<string>();

    function toggleUser(id: string) {
        if (expandedUsers.has(id)) expandedUsers.delete(id);
        else expandedUsers.add(id);
        expandedUsers = expandedUsers;
    }

    function toggleUserDash(key: string) {
        if (expandedUserDashboards.has(key)) expandedUserDashboards.delete(key);
        else expandedUserDashboards.add(key);
        expandedUserDashboards = expandedUserDashboards;
    }

    function getStats(userId: string) {
        let count = 0;
        let total = 0;
        dashboards.forEach((d) => {
            d.views.forEach((v) => {
                total++;
                if (v.isPublic || v.allowedUserIds.includes(userId)) count++;
            });
        });
        return { count, total };
    }

    function isAllowed(view: any, userId: string) {
        return view.isPublic || view.allowedUserIds.includes(userId);
    }

    async function sendUpdate(payload: any) {
        try {
            const res = await fetch("./api/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) window.refreshData();
        } catch (e) {}
    }
</script>

{#each users as user (user.id)}
    {@const stats = getStats(user.id)}
    <div class="user-card">
        <div class="user-header" on:click={() => toggleUser(user.id)}>
            <span
                class="toggle-icon"
                class:collapsed={!expandedUsers.has(user.id)}>▼</span
            >
            <span>{user.name}</span>
            <span class="badge stats">{stats.count} / {stats.total} Views</span>
        </div>

        {#if expandedUsers.has(user.id)}
            <div class="access-list" transition:slide|local>
                {#each dashboards as dash}
                    <div class="user-dash-section">
                        <div
                            class="user-dash-header"
                            on:click={() =>
                                toggleUserDash(`${user.id}-${dash.id}`)}
                        >
                            <span
                                class="toggle-icon"
                                class:collapsed={!expandedUserDashboards.has(
                                    `${user.id}-${dash.id}`,
                                )}>▼</span
                            >
                            {dash.title}
                            <span class="badge">{dash.views.length} views</span>
                        </div>

                        {#if expandedUserDashboards.has(`${user.id}-${dash.id}`)}
                            <div class="views-list" transition:slide|local>
                                {#each dash.views as view}
                                    {@const allowed = isAllowed(view, user.id)}
                                    <div
                                        class="access-item"
                                        class:public={view.isPublic}
                                        class:private={!view.isPublic}
                                    >
                                        <div>
                                            <div class="view-title">
                                                {view.title}
                                            </div>
                                            <div class="view-path">
                                                {dash.url}/{view.path}
                                            </div>
                                        </div>
                                        {#if view.isPublic}
                                            <span class="badge public-badge"
                                                >Public</span
                                            >
                                        {:else}
                                            <label class="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={allowed}
                                                    on:change={(e) =>
                                                        sendUpdate({
                                                            type: "set_user",
                                                            dashId: dash.id,
                                                            urlPath: dash.url,
                                                            viewPath: view.path,
                                                            userId: user.id,
                                                            isAllowed:
                                                                e.currentTarget
                                                                    .checked,
                                                        })}
                                                />
                                                <span class="slider"></span>
                                            </label>
                                        {/if}
                                    </div>
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
    .user-card {
        background: #2c2c2c;
        border-radius: 8px;
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #444;
    }
    .user-header {
        font-size: 1.2em;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding-bottom: 10px;
        border-bottom: 1px solid #444;
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
    .stats {
        background: #03a9f4;
        color: white;
    }
    .access-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 10px;
    }
    .user-dash-section {
        margin-top: 0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        overflow: hidden;
    }
    .user-dash-header {
        background: rgba(255, 255, 255, 0.03);
        padding: 8px 12px;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }
    .user-dash-header:hover {
        background: rgba(255, 255, 255, 0.08);
    }
    .views-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-bottom: 4px;
    }

    .access-item {
        margin: 0 8px;
        border-left: 3px solid #444;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: rgba(255, 255, 255, 0.02);
    }
    .access-item.public {
        border-left-color: #4caf50;
    }
    .access-item.private {
        border-left-color: #03a9f4;
    }
    .public-badge {
        background: #4caf50;
        color: white;
    }
    .view-title {
        font-weight: 600;
        font-size: 0.9em;
    }
    .view-path {
        font-size: 0.75em;
        opacity: 0.6;
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
