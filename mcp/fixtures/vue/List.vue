<template>
    <section class="list">
        <header class="flex items-center justify-between gap-[10px]">
            <h2 class="text-[15px] font-semibold">Customers</h2>
            <button class="h-9 rounded-control bg-indigo-600 px-3 text-white">Add customer</button>
        </header>
        <ul>
            <li v-for="customer in customers" :key="customer.id" class="row">
                <span>{{ customer.name }}</span>
                <span class="meta">{{ customer.email }}</span>
            </li>
        </ul>
    </section>
</template>

<script setup>
defineProps({ customers: Array });
</script>

<style scoped>
.row {
    border-bottom: 2px solid #e5e7eb;
}

.meta {
    color: #9ca3af;
}
</style>
