<script lang="ts">
    export let checked = false;
</script>

<label class="switch">
    <input type="checkbox" {checked} on:change />
    <span class="slider"></span>
</label>

<style>
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
        background-color: var(--disabled-text-color, #555);
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
        background-color: var(--primary-background-color, #fff);
        transition: 0.4s;
        border-radius: 50%;
    }
    input:checked + .slider {
        background-color: var(--primary-color, #03a9f4);
    }
    input:checked + .slider:before {
        transform: translateX(20px);
    }
</style>
