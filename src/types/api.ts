// API请求配置
export interface RequestConfig {
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    params?: Record<string, any>
    data?: any
    headers?: Record<string, string>
}

// 知识库相关类型
export interface KnowledgeDocument {
    id: number
    title: string
    description?: string
    source_type: string
    source_url?: string
    is_public: boolean
    created_by?: number
    creator?: any
    created_at: string
    updated_at: string
}

export interface KnowledgeUploadResponse {
    id: number
    title: string
    description?: string
    source_url: string
    is_public: boolean
    chunks_count: number
}