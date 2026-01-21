<script lang="ts">
    import type { AppDashboardInfo } from "./types";

    import CollapseCard from "./components/CollapseCard.svelte";
    import Switch from "./components/Switch.svelte";
    import Badge from "./components/Badge.svelte";

    export let dashboards: AppDashboardInfo[];
    export let users: any[];

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

<div class="users-list-container">
    {#each users as user (user.id)}
        {@const stats = getStats(user.id)}

        <CollapseCard title={user.name} bordered={true}>
            <svelte:fragment slot="header-meta">
                <Badge variant="primary"
                    >{stats.count} / {stats.total} Views</Badge
                >
            </svelte:fragment>

            {#each dashboards as dash}
                <div class="dash-section-wrapper">
                    <CollapseCard title={dash.title}>
                        <svelte:fragment slot="header-meta">
                            <Badge>{dash.views.length} views</Badge>
                        </svelte:fragment>

                        {#each dash.views as view}
                            {@const allowed = isAllowed(view, user.id)}

                            <div
                                class="access-row"
                                class:public={view.isPublic}
                                class:private={!view.isPublic}
                            >
                                <div class="info-col">
                                    <div class="view-title">{view.title}</div>
                                    <div class="view-path">
                                        {dash.url}/{view.path}
                                    </div>
                                </div>

                                {#if view.isPublic}
                                    <Badge variant="success">Public</Badge>
                                {:else}
                                    <Switch
                                        checked={allowed}
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
                                {/if}
                            </div>
                        {/each}
                    </CollapseCard>
                </div>
            {/each}
        </CollapseCard>
    {/each}
</div>

<style>
    .users-list-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .dash-section-wrapper {
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.01);
        padding: 4px 8px;
    }

    .access-row {
        margin: 0;
        border-left: 3px solid #444;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0 4px 4px 0;
    }

    .access-row.public {
        border-left-color: #4caf50;
    }
    .access-row.private {
        border-left-color: #03a9f4;
    }

    .info-col {
        display: flex;
        flex-direction: column;
    }

    .view-title {
        font-weight: 600;
        font-size: 0.9em;
    }
    .view-path {
        font-size: 0.75em;
        opacity: 0.6;
    }
</style>
