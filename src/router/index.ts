import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/characters'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/characters',
        name: 'CharacterList',
        component: () => import('@/views/character/CharacterList.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/characters/create',
        name: 'CharacterCreate',
        component: () => import('@/views/character/CharacterCreate.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/characters/:id',
        name: 'CharacterDetail',
        component: () => import('@/views/character/CharacterDetail.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/chat/:conversationId',
        name: 'ChatRoom',
        component: () => import('@/views/chat/ChatRoom.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/knowledge',
        name: 'KnowledgeList',
        component: () => import('@/views/knowledge/KnowledgeList.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        next('/login')
    } else if (!to.meta.requiresAuth && authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
        next('/characters')
    } else {
        next()
    }
})

export default router