import { defineStore } from 'pinia'
import { authAPI } from '@/api/auth'
import { User, TokenResponse } from '@/types'

interface AuthState {
    token: string | null
    user: User | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: localStorage.getItem('token') || null,
        user: null,
    }),

    getters: {
        isLoggedIn: (state): boolean => !!state.token,
    },

    actions: {
        async login(credentials: { username: string; password: string }): Promise<TokenResponse> {
            try {
                const response = await authAPI.login(credentials)
                this.token = response.access_token
                localStorage.setItem('token', this.token)
                return response
            } catch (error) {
                throw error
            }
        },

        async register(userData: { username: string; email: string; password: string }): Promise<User> {
            try {
                const response = await authAPI.register(userData)
                return response
            } catch (error) {
                throw error
            }
        },

        logout(): void {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
        }
    }
})