import request from './request'
import { Conversation, Message } from '@/types/chat'

export const chatAPI = {
    // 创建对话
    createConversation(characterId: number): Promise<Conversation> {
        return request.post(`/chat/conversations/${characterId}`)
    },

    // 获取对话列表
    getConversations(): Promise<Conversation[]> {
        return request.get('/chat/conversations')
    },

    // 获取对话消息
    getMessages(conversationId: number): Promise<Message[]> {
        return request.get(`/chat/conversations/${conversationId}/messages`)
    },

    // 删除对话
    deleteConversation(conversationId: number): Promise<{ message: string }> {
        return request.delete(`/chat/conversations/${conversationId}`)
    }
}