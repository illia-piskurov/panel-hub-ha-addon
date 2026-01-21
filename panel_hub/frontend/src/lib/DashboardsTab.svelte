<script lang="ts">
    import Badge from "./components/Badge.svelte";

    import CollapseCard from "./components/CollapseCard.svelte";
    import Switch from "./components/Switch.svelte";
    import type { AppDashboardInfo, UpdatePayload } from "./types";

    export let dashboards: AppDashboardInfo[];
    export let users: any[];
    export let haUrl: string;

    async function sendUpdate(payload: UpdatePayload) {
        console.log("Update:", payload);
    }
</script>

<div class="list-container">
    {#each dashboards as dash (dash.id)}
        <CollapseCard title={dash.title} bordered={true}>
            <svelte:fragment slot="header-meta">
                <Badge>{dash.url}</Badge>
            </svelte:fragment>

            <svelte:fragment slot="actions">
                <a href="{haUrl}/{dash.url}" target="_blank" class="link-btn"
                    >Open ↗</a
                >
            </svelte:fragment>

            {#each dash.views as view (view.path)}
                <div class="view-item-wrapper">
                    <CollapseCard title={view.title}>
                        <svelte:fragment slot="header-meta">
                            <span class="path-text">({view.path})</span>
                        </svelte:fragment>

                        <svelte:fragment slot="actions">
                            <Switch
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
                        </svelte:fragment>

                        {#if !view.isPublic}
                            <div class="users-grid">
                                {#each users as user (user.id)}
                                    <label class="user-row">
                                        <Switch
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
                                        <span class="user-name"
                                            >{user.name}</span
                                        >
                                    </label>
                                {/each}
                            </div>
                        {/if}
                    </CollapseCard>
                </div>
            {/each}
        </CollapseCard>
    {/each}
</div>

<style>
    .list-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .link-btn {
        text-decoration: none;
        font-size: 0.7em;
        background: var(--secondary-background-color, #2c2c2c);
        border: 1px solid var(--divider-color, #444);
        color: var(--primary-text-color, #e1e1e1);
        padding: 4px 8px;
        border-radius: 4px;
    }

    .path-text {
        opacity: 0.5;
        font-size: 0.9em;
        font-weight: normal;
    }

    .view-item-wrapper {
        background: var(
            --secondary-background-color,
            rgba(255, 255, 255, 0.05)
        );
        border-radius: 6px;
        padding: 8px 12px;
    }
    .users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        width: 100%;
        margin-top: 10px;
    }
    .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 6px;
        background: var(
            --secondary-background-color,
            rgba(255, 255, 255, 0.03)
        );
        border-radius: 4px;
    }
    .user-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
