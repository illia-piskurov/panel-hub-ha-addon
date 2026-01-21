<script lang="ts">
    import { slide } from "svelte/transition";

    export let title: string = "";
    export let isOpen = false;
    export let bordered = false;
    export let disabled = false;
</script>

<div class="card-container" class:bordered class:disabled-card={disabled}>
    <div class="header" on:click={() => !disabled && (isOpen = !isOpen)}>
        <div class="title-row">
            {#if disabled}
                <span class="lock-icon">🔒</span>
            {:else}
                <span class="toggle-icon" class:collapsed={!isOpen}>▼</span>
            {/if}

            <span class="title-text">{title}</span>
            <slot name="header-meta"></slot>
        </div>

        <div class="header-actions" on:click|stopPropagation>
            <slot name="actions"></slot>
        </div>
    </div>

    {#if isOpen && !disabled}
        <div class="content" transition:slide={{ duration: 300 }}>
            <div class="content-inner">
                <slot></slot>
            </div>
        </div>
    {/if}
</div>

<style>
    .card-container {
        border-radius: 6px;
        margin: 0;
    }

    .card-container.bordered {
        background: var(--card-background-color, #2c2c2c);
        border: 1px solid var(--divider-color, #444);
        padding: 15px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
        color: var(--primary-text-color, #e1e1e1);
    }

    .bordered .header {
        border-bottom: 1px solid var(--divider-color, #444);
        padding-bottom: 10px;
        margin-bottom: 0;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }

    .title-text {
        font-weight: bold;
        font-size: 1.1em;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .disabled-card .header {
        cursor: default;
    }
    .toggle-icon {
        transition: transform 0.3s ease;
        font-size: 0.8em;
        display: inline-block;
        color: var(--secondary-text-color, #888);
        width: 1em;
        text-align: center;
    }
    .toggle-icon.collapsed {
        transform: rotate(-90deg);
    }
    .lock-icon {
        font-size: 0.8em;
        display: inline-block;
        color: var(--secondary-text-color, #888);
        width: 1em;
        text-align: center;
    }
    .content {
        overflow: hidden;
    }

    .content-inner {
        padding-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .content {
        overflow: hidden;
    }
    .content-inner {
        padding-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .card-container.bordered {
        background: var(--card-background-color, #2c2c2c);
        border: 1px solid var(--divider-color, #444);
        padding: 15px;
    }
    .bordered .header {
        border-bottom: 1px solid var(--divider-color, #444);
        padding-bottom: 10px;
        margin-bottom: 0;
    }
    .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    .title-text {
        font-weight: bold;
        font-size: 1.1em;
    }
    .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
</style>
