// WebSocket服务 - 与哈利波特后端对话系统通信
import { ElMessage } from 'element-plus'

class WebSocketService {
  constructor() {
    this.ws = null
    // 使用conversationId构建WebSocket URL
        this.baseUrl = import.meta.env.DEV ? 'ws://172.16.1.254:8000/ws' : 'wss://your-domain.com/ws'
    this.conversationId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.heartbeatInterval = null
    this.messageHandlers = new Map()
    this.isConnected = false
    this.lastReconnectMessage = null // 防止重复显示重连消息
    this.isReconnecting = false // 防止重复重连
  }

  // 连接WebSocket
  connect(conversationId = null) {
    if (!conversationId) {
      console.error('WebSocket连接需要conversationId')
      return false
    }
    
    // 如果已经有相同会话的连接，直接返回
    if (this.conversationId === conversationId && this.isConnected) {
      return true
    }
    
    // 先断开现有连接
    this.disconnect()
    
    this.conversationId = conversationId
    const wsUrl = `${this.baseUrl}/${conversationId}`
    
    
    try {
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      
      // 设置连接超时
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket连接超时')
          this.ws.close()
          this.handleError(new Error('连接超时'))
        }
      }, 10000) // 10秒超时
      
      return true
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.handleError(error)
      return false
    }
  }

  // 连接打开
  handleOpen(event) {
    this.isConnected = true
    this.reconnectAttempts = 0
    this.isReconnecting = false // 重置重连状态
    this.lastReconnectMessage = null // 清除重连消息标记

    // 清除连接超时
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    // 启动心跳
    this.startHeartbeat()

    // 通知连接成功
    this.notifyHandlers('connection', { status: 'connected' })
    
    
    // 如果是重连成功，显示成功提示
    if (this.reconnectAttempts > 0) {
      ElMessage.success('后端连接已恢复')
    }
  }

  // 处理消息
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      
      // 处理错误消息
      if (data.error) {
        console.error('WebSocket错误:', data.error)
        this.notifyHandlers('error', data)
        return
      }
      
      // 根据消息类型分发处理
      switch (data.type) {
        case 'history':
          this.notifyHandlers('history', data)
          break
        case 'text_stream':
          this.notifyHandlers('text_stream', data)
          break
        case 'message_update':
          this.notifyHandlers('message_update', data)
          break
        case 'transcription':
          this.notifyHandlers('transcription', data)
          break
        case 'audio':
          this.notifyHandlers('audio', data)
          break
        case 'audio_response':
          this.notifyHandlers('audio_response', data)
          break
        case 'stream_end':
          this.notifyHandlers('stream_end', data)
          break
        case 'pong':
          return
        default:
          // 检查是否是音频响应（即使类型不是audio_response）
          if (data.audioUrl || data.audio_url || data.url || 
              (typeof data === 'string' && data.includes('http')) ||
              (data.data && typeof data.data === 'string' && data.data.includes('http'))) {
            this.notifyHandlers('audio_response', data)
          } else {
            this.notifyHandlers('message', data)
          }
      }
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
      this.notifyHandlers('error', { error: '消息解析失败' })
    }
  }

  // 连接关闭
  handleClose(event) {
    this.isConnected = false
    this.stopHeartbeat()
    
    // 通知连接断开
    this.notifyHandlers('connection', { status: 'disconnected' })
    
    // 如果不是正常关闭且没有在重连中，尝试重连
    if (event.code !== 1000 && !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnect()
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // 重连次数达到上限，显示错误提示
      ElMessage.error('后端连接失败，请检查网络连接')
    }
  }

  // 连接错误
  handleError(error) {
    console.error('WebSocket连接错误:', error)
    this.isConnected = false
    this.stopHeartbeat()
    
    // 通知连接错误
    this.notifyHandlers('connection', { status: 'error', error })
    
    // 只有在重连次数达到上限时才显示错误提示
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      ElMessage.error('后端连接失败，请检查网络连接')
    } else if (this.reconnectAttempts === 0) {
      // 首次连接失败时也显示提示
      ElMessage.warning('无法连接到后端服务器，请检查网络连接')
    }
  }

  // 重连
  reconnect() {
    // 防止重复重连
    if (this.isReconnecting) {
      return
    }
    
    this.isReconnecting = true
    this.reconnectAttempts++
    
    // 只在第一次重连时显示提示，避免重复显示
    if (this.reconnectAttempts === 1) {
      this.lastReconnectMessage = ElMessage.info('连接已断开，正在尝试重连...')
    }
    
    setTimeout(() => {
      this.isReconnecting = false
      this.connect(this.conversationId)
    }, this.reconnectInterval)
  }

  // 发送消息
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify(data)
        this.ws.send(message)
        return true
      } catch (error) {
        console.error('发送消息时出错:', error)
        return false
      }
    } else {
      console.warn('WebSocket未连接，无法发送消息:', data.type)
      return false
    }
  }

  // 发送文本消息
  sendTextMessage(content, needAudio = false) {
    const message = {
      type: 'text',
      content: content,
      need_audio: needAudio
    }
    return this.send(message)
  }

  // 发送音频消息
  sendAudioMessage(audioData, mimeType = 'audio/webm') {
    try {
      // 将ArrayBuffer转换为Base64字符串
      const base64Audio = this.arrayBufferToBase64(audioData)
      
      // 从mimeType中提取格式信息
      let format = 'webm'
      if (mimeType.includes('webm')) {
        format = 'webm'
      } else if (mimeType.includes('mp4')) {
        format = 'mp4'
      } else if (mimeType.includes('wav')) {
        format = 'wav'
      }
      
      const message = {
        type: 'audio',
        data: base64Audio,
        format: format,
        mimeType: mimeType,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString(),
        size: audioData.byteLength // 添加音频大小信息
      }
      
      
      return this.send(message)
    } catch (error) {
      console.error('发送音频消息失败:', error)
      return false
    }
  }

  // 将ArrayBuffer转换为Base64
  arrayBufferToBase64(buffer) {
    try {
      // 使用更高效的方式转换ArrayBuffer为Base64
      const bytes = new Uint8Array(buffer)
      let binary = ''
      const chunkSize = 8192 // 分块处理，避免内存问题
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode.apply(null, chunk)
      }
      
      return btoa(binary)
    } catch (error) {
      console.error('ArrayBuffer转Base64失败:', error)
      throw error
    }
  }

  // 启动心跳
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
      }
    }, 30000) // 30秒心跳
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 注册消息处理器
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler)
  }

  // 移除消息处理器
  offMessage(type) {
    this.messageHandlers.delete(type)
  }

  // 通知所有处理器
  notifyHandlers(type, data) {
    this.messageHandlers.forEach((handler, handlerType) => {
      if (handlerType === type || handlerType === '*') {
        handler(data)
      }
    })
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '用户主动断开')
      this.ws = null
    }
    this.isConnected = false
    this.stopHeartbeat()
    // 不清空监听器，保持监听器注册
    // this.messageHandlers.clear()
    
    // 清除连接超时
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
    }
  }
}

// 创建单例实例
const websocketService = new WebSocketService()

export { websocketService }
export default websocketService
