import request from './request'
import { KnowledgeDocument, KnowledgeUploadResponse } from '@/types/api'

interface LinkKnowledgeParams {
    characterId: number
    documentId: number
}

export const knowledgeAPI = {
    // 上传知识库文档
    upload(file: File, description?: string, isPublic?: boolean): Promise<KnowledgeUploadResponse> {
        const formData = new FormData()
        formData.append('file', file)
        if (description) formData.append('description', description)
        if (isPublic !== undefined) formData.append('is_public', String(isPublic))
        return request.post('/knowledge/upload', formData)
    },

    // 获取公开知识库文档
    getPublicDocuments(skip = 0, limit = 20): Promise<KnowledgeDocument[]> {
        return request.get('/knowledge/public', { params: { skip, limit } })
    },

    // 获取我的知识库文档
    getMyDocuments(): Promise<KnowledgeDocument[]> {
        return request.get('/knowledge/my')
    },

    // 关联知识库到角色
    linkToCharacter({ characterId, documentId }: LinkKnowledgeParams): Promise<{ message: string }> {
        return request.post(`/knowledge/characters/${characterId}/link/${documentId}`)
    },

    // 解除知识库与角色的关联
    unlinkFromCharacter({ characterId, documentId }: LinkKnowledgeParams): Promise<{ message: string }> {
        return request.delete(`/knowledge/characters/${characterId}/unlink/${documentId}`)
    },

    // 获取角色关联的知识库文档
    getCharacterDocuments(characterId: number): Promise<KnowledgeDocument[]> {
        return request.get(`/knowledge/characters/${characterId}/documents`)
    },

    // 删除知识库文档
    deleteDocument(documentId: number): Promise<{ message: string }> {
        return request.delete(`/knowledge/documents/${documentId}`)
    },

    // 更新文档可见性
    updateVisibility(documentId: number, isPublic: boolean): Promise<any> {
        return request.put(`/knowledge/documents/${documentId}/visibility`, null, {
            params: { is_public: isPublic }
        })
    }
}