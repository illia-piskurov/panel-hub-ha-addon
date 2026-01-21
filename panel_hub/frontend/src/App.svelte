<script lang="ts">
    import { onMount } from "svelte";
    import Tabs from "./lib/components/Tabs.svelte";
    import DashboardsTab from "./lib/DashboardsTab.svelte";
    import type { AppDashboardInfo } from "./lib/types";
    import UsersTab from "./lib/UsersTab.svelte";

    let activeTab = "dashboards";
    const tabItems = [
        { value: "dashboards", label: "By Dashboards" },
        { value: "users", label: "By Users" },
    ];
    let dashboards: AppDashboardInfo[] = [];
    let users: any[] = [];
    let haUrl = "";
    let toastVisible = false;
    let isConnected = false;

    async function loadData() {
        try {
            const [dashRes, userRes, configRes] = await Promise.all([
                fetch("./api/structure"),
                fetch("./api/users"),
                fetch("./api/config"),
            ]);
            dashboards = await dashRes.json();
            users = await userRes.json();
            const config = await configRes.json();
            haUrl = config.haUrl;
        } catch (e) {
            console.error("Failed to load data", e);
        }
    }

    async function reloadData() {
        try {
            const [dashRes, userRes] = await Promise.all([
                fetch("./api/structure"),
                fetch("./api/users"),
            ]);
            dashboards = await dashRes.json();
            users = await userRes.json();
        } catch (e) {
            console.error(e);
        }
    }

    (window as any).showToast = () => {
        toastVisible = true;
        setTimeout(() => (toastVisible = false), 3000);
    };
    (window as any).refreshData = reloadData;

    onMount(() => {
        loadData();

        const evtSource = new EventSource("./api/stream");
        evtSource.onopen = () => (isConnected = true);
        evtSource.onerror = () => (isConnected = false);
        evtSource.onmessage = () => reloadData();

        return () => evtSource.close();
    });
</script>

<main>
    <div class="header-bar">
        <h1>Lovelace Access Control</h1>
        <div class="status">
            <span
                class="indicator"
                style="background: {isConnected ? '#4caf50' : '#f44336'}"
            ></span>
            <span>Real-time Sync</span>
        </div>
    </div>

    <Tabs items={tabItems} bind:active={activeTab} />

    {#if activeTab === "dashboards"}
        <DashboardsTab {dashboards} {users} {haUrl} />
    {:else if activeTab === "users"}
        <UsersTab {dashboards} {users} />
    {/if}

    <div id="toast" class:show={toastVisible}>Changes saved</div>
</main>

<style>
    :root {
        --primary-color: #03a9f4;
        --primary-background-color: #fafafa;
        --secondary-background-color: #e5e5e5;
        --card-background-color: #ffffff;

        --primary-text-color: #212121;
        --secondary-text-color: #727272;
        --divider-color: #e0e0e0;

        --disabled-text-color: #bdbdbd;
    }
    @media (prefers-color-scheme: dark) {
        :root {
            --primary-color: #03a9f4;
            --primary-background-color: #111111;
            --secondary-background-color: #1c1c1c;
            --card-background-color: #2c2c2c;

            --primary-text-color: #e1e1e1;
            --secondary-text-color: #888888;
            --divider-color: #444444;

            --disabled-text-color: #6f6f6f;
        }
    }
    :global(body) {
        font-family: Roboto, "Segoe UI", sans-serif;
        background-color: var(--primary-background-color);
        color: var(--primary-text-color);
        margin: 0;
        padding: 20px;
        transition:
            background-color 0.3s,
            color 0.3s;
    }
    .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    h1 {
        margin: 0;
        color: var(--primary-color);
    }
    .status {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 0.8em;
        color: #888;
    }
    .indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        transition: background 0.3s;
    }

    #toast {
        visibility: hidden;
        min-width: 250px;
        background-color: var(--card-background-color);
        color: var(--primary-text-color);
        text-align: center;
        border-radius: 4px;
        padding: 16px;
        position: fixed;
        z-index: 100;
        right: 30px;
        bottom: 30px;
        border-left: 5px solid #4caf50;
        opacity: 0;
        transition:
            opacity 0.5s,
            bottom 0.5s;
    }
    #toast.show {
        visibility: visible;
        opacity: 1;
        bottom: 30px;
    }
    .status span {
        color: var(--secondary-text-color);
    }
</style>
