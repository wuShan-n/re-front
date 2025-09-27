import request from './request'
import { User, TokenResponse } from '@/types'

interface LoginData {
    username: string
    password: string
}

interface RegisterData {
    username: string
    email: string
    password: string
}

export const authAPI = {
    // 登录
    login(data: LoginData): Promise<TokenResponse> {
        return request.post('/auth/login', data)
    },

    // 注册
    register(data: RegisterData): Promise<User> {
        return request.post('/auth/register', data)
    },

    // 获取当前用户信息
    getCurrentUser(): Promise<User> {
        return request.get('/auth/me')
    }
}