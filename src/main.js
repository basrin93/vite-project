import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import DealManager3 from './components/DealManager3/DealManager3.vue'
import DealManager4 from './components/DealManager4/DealManager4.vue'
import DealManager5 from './components/DealManager5/DealManager5.vue'
import DealManager6 from './components/DealManager6/DealManager6.vue'


const routes = [
    { path: '/deals3', name: 'Deals3', component: DealManager3 },
    { path: '/deals4', name: 'Deals4', component: DealManager4 },
    { path: '/deals5', name: 'Deals5', component: DealManager5 },
    { path: '/deals6', name: 'Deals6', component: DealManager6 },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')