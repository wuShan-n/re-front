import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/components/auth/LoginPage.vue'
import RegisterPage from '@/components/auth/RegisterPage.vue'
import ChatInterface from '@/components/chat/ChatInterface.vue'
import CharacterManagement from '@/components/management/CharacterManagement.vue'
import KnowledgeManagement from '@/components/management/KnowledgeManagement.vue'
import VoiceSampleManagement from '@/components/management/VoiceSampleManagement.vue'
import PublicCharacters from '@/components/management/PublicCharacters.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterPage,
      meta: { requiresGuest: true }
    },
    {
      path: '/chat',
      name: 'Chat',
      component: ChatInterface,
      meta: { requiresAuth: true }
    },
    {
      path: '/characters',
      name: 'CharacterManagement',
      component: CharacterManagement,
      meta: { requiresAuth: true }
    },
    {
      path: '/knowledge',
      name: 'KnowledgeManagement',
      component: KnowledgeManagement,
      meta: { requiresAuth: true }
    },
    {
      path: '/voice-samples',
      name: 'VoiceSampleManagement',
      component: VoiceSampleManagement,
      meta: { requiresAuth: true }
    },
    {
      path: '/public-characters',
      name: 'PublicCharacters',
      component: PublicCharacters,
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
    return
  }
  
  // 检查是否已登录用户访问登录页
  if (to.meta.requiresGuest && authStore.isLoggedIn) {
    next('/chat')
    return
  }
  
  next()
})

export default router
