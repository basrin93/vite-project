<template>
  <div id="app">
    <nav class="app-nav">

      

      

      <router-link 
        to="/deals5" 
        class="nav-link"
        :class="{ active: $route.name === 'Deals5' }"
      >
        📋 Управление сделками 5
      </router-link>
      
      <router-link 
        to="/deals6" 
        class="nav-link"
        :class="{ active: $route.name === 'Deals6' }"
      >
        📋 Управление сделками 6
      </router-link>

      <router-link 
        to="/deals4" 
        class="nav-link"
        :class="{ active: $route.name === 'Deals4' }"
      >
        📋 Управление сделками 4
      </router-link>

      <router-link 
        to="/deals3" 
        class="nav-link"
        :class="{ active: $route.name === 'Deals3' }"
      >
        📋 Управление сделками X
      </router-link>

    </nav>

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.app-nav {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.nav-link {
  padding: 12px 24px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-link.active {
  background: #3b82f6;
  color: white;
}
</style>