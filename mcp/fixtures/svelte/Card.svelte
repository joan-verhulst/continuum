<script>
export let title;
export let meta;
</script>

<!-- One invoice in the grid of recent invoices. -->
<article class="card">
    <h2 class="title">{title}</h2>
    <p class="meta">{meta}</p>
    <button>Open</button>
</article>

<style>
    .card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 13px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .title {
        font-size: 15px;
        font-weight: 600;
    }

    .meta {
        color: #9ca3af;
    }

    button {
        height: 36px;
        padding: 0 12px;
    }
</style>
