<script lang="ts">
    export let variant: "default" | "success" | "primary" = "default";
</script>

<span class="badge {variant}">
    <slot />
</span>

<style>
    .badge {
        font-size: 0.75em;
        padding: 2px 6px;
        border-radius: 4px;
        background: #444;
        font-weight: normal;
        color: #e1e1e1;
    }
    .badge.success {
        background: #4caf50;
        color: white;
    }
    .badge.primary {
        background: #03a9f4;
        color: white;
    }
</style>
