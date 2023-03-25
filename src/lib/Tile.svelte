<script>
    export let value;
    export let shown = false;
</script>

<div>
    {#if shown}
        {value}
    {/if}
</div>
