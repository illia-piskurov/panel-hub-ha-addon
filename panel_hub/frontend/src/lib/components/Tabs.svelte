<script lang="ts">
export let items: { value: string; label: string }[] = [];
export let active: string;
</script>

<div class="tabs">
    {#each items as item}
        <button
            class="tab"
            class:active={active === item.value}
            on:click={() => (active = item.value)}
        >
            {item.label}
        </button>
    {/each}
</div>

<style>
    .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #444;
    }

    .tab {
        padding: 10px 20px;
        cursor: pointer;
        background: transparent;
        border: none;
        color: #e1e1e1;
        font-size: 1rem;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
    }

    .tab:hover {
        color: white;
    }

    .tab.active {
        color: #03a9f4;
        border-bottom-color: #03a9f4;
        font-weight: bold;
    }
</style>
