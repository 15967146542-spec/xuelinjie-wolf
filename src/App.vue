<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="app-layout">
    <Navbar />
    <main class="page-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 0%, #172554 0%, #0b1120 40%, #030712 100%);
  color: #f8fafc;
}

.page-container {
  flex: 1;
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 48px 20px;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .page-container {
    padding: 16px 12px 40px 12px;
  }
}
</style>
