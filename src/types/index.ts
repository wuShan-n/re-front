// 通用响应类型
export interface ApiResponse<T = any> {
    code?: number
    message?: string
    data?: T
}

// 分页响应
export interface PaginationResponse<T> {
    items: T[]
    total: number
    page: number
    per_page: number
}

// 用户类型
export interface User {
    id: number
    username: string
    email: string
    created_at: string
}

// Token响应
export interface TokenResponse {
    access_token: string
    token_type: string
}