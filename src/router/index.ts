import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'

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
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: 'characters',
                name: 'CharacterList',
                component: () => import('@/views/character/CharacterList.vue')
            },
            {
                path: 'characters/create',
                name: 'CharacterCreate',
                component: () => import('@/views/character/CharacterCreate.vue')
            },
            {
                path: 'characters/:id',
                name: 'CharacterDetail',
                component: () => import('@/views/character/CharacterDetail.vue')
            },
            {
                path: 'characters/:id/edit',
                name: 'CharacterEdit',
                component: () => import('@/views/character/CharacterCreate.vue'),
                props: { isEdit: true }
            },
            {
                path: 'conversations',
                name: 'ConversationList',
                component: () => import('@/views/chat/ConversationList.vue')
            },
            {
                path: 'chat/:conversationId',
                name: 'ChatRoom',
                component: () => import('@/views/chat/ChatRoom.vue')
            },
            {
                path: 'knowledge',
                name: 'KnowledgeList',
                component: () => import('@/views/knowledge/KnowledgeList.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
        next('/login')
    } else if (!to.meta.requiresAuth && authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
        next('/characters')
    } else {
        next()
    }
})

export default router