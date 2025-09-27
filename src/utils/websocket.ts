import { ElMessage } from 'element-plus'
import { WSMessage } from '@/types/chat'

type MessageHandler = (data: WSMessage) => void

class WebSocketManager {
    private ws: WebSocket | null = null
    private messageHandlers: Map<string, MessageHandler> = new Map()
    private reconnectAttempts: number = 0
    private maxReconnectAttempts: number = 5
    private reconnectTimeout: number | null = null

    connect(conversationId: number, token: string): void {
        const wsUrl = `ws://localhost:8000/ws/${conversationId}?token=${token}`

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
            console.log('WebSocket connected')
            this.reconnectAttempts = 0
        }

        this.ws.onmessage = (event: MessageEvent) => {
            const data: WSMessage = JSON.parse(event.data)
            this.handleMessage(data)
        }

        this.ws.onerror = (error: Event) => {
            console.error('WebSocket error:', error)
            ElMessage.error('连接错误')
        }

        this.ws.onclose = () => {
            console.log('WebSocket disconnected')
            this.attemptReconnect(conversationId, token)
        }
    }

    private handleMessage(data: WSMessage): void {
        const handler = this.messageHandlers.get(data.type)
        if (handler) {
            handler(data)
        }
    }

    on(type: string, handler: MessageHandler): void {
        this.messageHandlers.set(type, handler)
    }

    off(type: string): void {
        this.messageHandlers.delete(type)
    }

    send(data: WSMessage): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data))
        }
    }

    private attemptReconnect(conversationId: number, token: string): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            this.reconnectTimeout = window.setTimeout(() => {
                this.connect(conversationId, token)
            }, 1000 * this.reconnectAttempts)
        }
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
        this.messageHandlers.clear()
    }
}

export default new WebSocketManager()