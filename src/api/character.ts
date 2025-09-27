import request from './request'
import { Character, CharacterDetail, CharacterCreate, CharacterUpdate } from '@/types/character'
import { PaginationResponse } from '@/types'

interface CharacterListParams {
    page?: number
    per_page?: number
    search?: string
    include_private?: boolean
}

export const characterAPI = {
    // 获取角色列表
    getList(params?: CharacterListParams): Promise<PaginationResponse<Character>> {
        return request.get('/characters/', { params })
    },

    // 获取我的角色
    getMyCharacters(): Promise<Character[]> {
        return request.get('/characters/my')
    },

    // 获取角色详情
    getDetail(id: number): Promise<CharacterDetail> {
        return request.get(`/characters/${id}`)
    },

    // 创建角色
    create(data: CharacterCreate): Promise<CharacterDetail> {
        return request.post('/characters/', data)
    },

    // 更新角色
    update(id: number, data: CharacterUpdate): Promise<CharacterDetail> {
        return request.put(`/characters/${id}`, data)
    },

    // 删除角色
    delete(id: number): Promise<{ message: string }> {
        return request.delete(`/characters/${id}`)
    },

    // 切换可见性
    toggleVisibility(id: number, isPublic: boolean): Promise<any> {
        return request.post(`/characters/${id}/toggle-visibility`, null, { params: { is_public: isPublic } })
    },

    // 上传头像
    uploadAvatar(id: number, file: File): Promise<{ avatar_url: string }> {
        const formData = new FormData()
        formData.append('file', file)
        return request.post(`/characters/${id}/avatar`, formData)
    },

    // 上传音色样本
    uploadVoiceSample(id: number, file: File): Promise<any> {
        const formData = new FormData()
        formData.append('file', file)
        return request.post(`/characters/${id}/voice-sample`, formData)
    }
}