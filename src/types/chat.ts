import { Character } from './character'

export interface Message {
    id: number
    role: 'user' | 'assistant'
    content: string
    audio_url?: string
    retrieved_context: any[]
    created_at: string
}

export interface Conversation {
    id: number
    character: Character
    messages: Message[]
    created_at: string
    updated_at: string
}

// WebSocket消息类型
export interface WSMessage {
    type: 'text' | 'audio' | 'text_stream' | 'transcription' | 'history' | 'error' | 'audio_error'
    content?: string
    data?: string
    url?: string
    messages?: Message[]
    is_corrected?: boolean
    message?: string
    need_audio?: boolean
}