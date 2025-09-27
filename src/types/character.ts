import { User } from './index'

export enum TTSEngineType {
    EDGE_TTS = 'edge_tts',
    INDEXTTS2 = 'indextts2'
}

export interface TTSConfig {
    voice_audio_url?: string
    emo_audio_url?: string
    emo_text?: string
    emotion_vector?: number[]
    emo_alpha?: number
    use_random?: boolean
}

export interface Character {
    id: number
    name: string
    description: string
    avatar_url?: string
    voice_id: string
    prompt_template: string
    settings: Record<string, any>
    use_knowledge_base: boolean
    knowledge_search_k: number
    tts_engine: string
    tts_config: TTSConfig
    is_public: boolean
    created_by?: number
    creator?: User
    created_at: string
    updated_at?: string
}

export interface CharacterDetail extends Character {
    knowledge_documents_count?: number
    conversations_count?: number
    can_edit?: boolean
    can_delete?: boolean
}

export interface CharacterCreate {
    name: string
    description: string
    avatar_url?: string
    voice_id?: string
    prompt_template: string
    settings?: Record<string, any>
    use_knowledge_base?: boolean
    knowledge_search_k?: number
    tts_engine?: TTSEngineType
    tts_config?: TTSConfig
}

export interface CharacterUpdate extends Partial<CharacterCreate> {
    is_public?: boolean
}