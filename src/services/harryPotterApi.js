// API服务 - 与哈利波特后端对话系统通信 (WebSocket版本)
import { websocketService } from './websocket.js'

// HTTP API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.1.254:8000'
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// HTTP请求封装
const httpRequest = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  })
  
  // 检查401错误，自动跳转到登录页面
  if (response.status === 401) {
    console.warn('API返回401错误，用户未登录或token过期')
    // 清除本地存储的认证信息
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    // 跳转到登录页面
    window.location.href = '/login'
    throw new Error('HTTP 401: Unauthorized')
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// 获取角色列表 (HTTP)
export const getCharacters = async () => {
  try {
    const response = await httpRequest('/api/v1/characters')
    
    // 处理分页响应格式
    if (response && typeof response === 'object') {
      // 如果返回的是分页对象，提取items数组
      if (response.items && Array.isArray(response.items)) {
        return response.items
      }
      // 如果直接返回数组
      if (Array.isArray(response)) {
        return response
      }
    }
    
    // 兜底：返回空数组
    console.warn('角色列表格式异常:', response)
    return []
  } catch (error) {
    console.error('获取角色列表失败:', error)
    throw error
  }
}

// 选择角色 (HTTP)
export const selectCharacter = async (characterName) => {
  try {
    // 先获取角色列表找到角色ID
    const characters = await getCharacters()
    
    // 确保characters是数组
    if (!Array.isArray(characters)) {
      throw new Error('角色列表格式错误')
    }
    
    const character = characters.find(char => 
      char.name === characterName || 
      char.aliases?.includes(characterName)
    )
    
    if (!character) {
      throw new Error('角色不存在')
    }
    
    // 创建对话
    const conversation = await httpRequest(`/api/v1/chat/conversations/${character.id}`, {
      method: 'POST'
    })
    
    return {
      character: character,
      conversation: conversation
    }
  } catch (error) {
    console.error('选择角色失败:', error)
    throw error
  }
}

// 用户认证相关 (HTTP)
export const login = async (username, password) => {
  try {
    const response = await httpRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    
    // 保存token
    localStorage.setItem('auth_token', response.access_token)
    return response
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

export const logout = async () => {
  try {
    localStorage.removeItem('auth_token')
    return { message: '登出成功' }
  } catch (error) {
    console.error('登出失败:', error)
    throw error
  }
}

export const getUserInfo = async () => {
  try {
    const response = await httpRequest('/api/v1/auth/me')
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

// 获取特定对话的消息 (HTTP)
export const getConversationMessages = async (conversationId) => {
  try {
    const messages = await httpRequest(`/api/v1/chat/conversations/${conversationId}/messages`)
    return messages
  } catch (error) {
    console.error('获取对话消息失败:', error)
    throw error
  }
}

// 获取聊天历史 (HTTP)
export const getChatHistory = async () => {
  try {
    const conversations = await httpRequest('/api/v1/chat/conversations')
    
    // 转换数据格式以匹配前端期望
    const chatSessions = await Promise.all(conversations.map(async (conversation) => {
      // 获取对话消息
      const messages = await httpRequest(`/api/v1/chat/conversations/${conversation.id}/messages`)
      
      return {
        id: `session_${conversation.id}`,
        title: `与${conversation.character?.name || '未知角色'}的对话`,
        character: conversation.character?.name || '未知角色',
        startTime: conversation.created_at,
        lastMessageTime: conversation.updated_at,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: `msg_${msg.id}`,
          content: msg.content,
          type: msg.role === 'user' ? 'user' : 'assistant',
          timestamp: msg.created_at
        }))
      }
    }))
    
    return chatSessions
  } catch (error) {
    console.error('获取聊天历史失败:', error)
    throw error
  }
}

// 删除会话 (HTTP)
export const deleteConversation = async (conversationId) => {
  try {
    // 从session_前缀中提取真实的conversation ID
    const realConversationId = conversationId.replace('session_', '')
    
    const response = await httpRequest(`/api/v1/chat/conversations/${realConversationId}`, {
      method: 'DELETE'
    })
    
    return response
  } catch (error) {
    console.error('删除会话失败:', error)
    throw error
  }
}

// 发送消息（普通模式） - WebSocket
export const sendMessage = async (message, conversationId) => {
  return new Promise((resolve, reject) => {
    const requestId = `send_message_${Date.now()}`
    
    const handler = (data) => {
      if (data.requestId === requestId) {
        websocketService.offMessage('chat_response')
        if (data.success) {
          resolve(data.data)
        } else {
          reject(new Error(data.error))
        }
      }
    }
    
    websocketService.onMessage('chat_response', handler)
    
    const success = websocketService.send({
      type: 'send_message',
      requestId: requestId,
      message: message,
      conversationId: conversationId
    })
    
    if (!success) {
      websocketService.offMessage('chat_response')
      reject(new Error('WebSocket未连接'))
    }
    
    setTimeout(() => {
      websocketService.offMessage('chat_response')
      reject(new Error('请求超时'))
    }, 30000)
  })
}

// 发送消息（流式模式） - WebSocket
export const sendMessageStream = async (message, conversationId, onCancel = null) => {
  return new Promise((resolve, reject) => {
    let completeMessage = ''
    let audioUrl = null
    let isCancelled = false
    
    const handler = (data) => {
      if (data.type === 'text_stream') {
        if (!isCancelled) {
          completeMessage += data.content
          // 通知前端更新消息内容
          websocketService.notifyHandlers('message_update', {
            content: completeMessage,
            conversationId: conversationId
          })
        }
      } else if (data.type === 'audio') {
        audioUrl = data.url
        // 立即通知前端音频URL可用
        websocketService.notifyHandlers('audio_ready', {
          audioUrl: audioUrl,
          conversationId: conversationId
        })
      } else if (data.type === 'error') {
        websocketService.offMessage('text_stream', handler)
        websocketService.offMessage('audio', handler)
        websocketService.offMessage('error', handler)
        reject(new Error(data.error))
      }
    }
    
    // 监听消息类型
    websocketService.onMessage('text_stream', handler)
    websocketService.onMessage('audio', handler)
    websocketService.onMessage('error', handler)
    
    // 发送文本消息
    const success = websocketService.sendTextMessage(message, true) // 请求音频
    
    if (!success) {
      websocketService.offMessage('text_stream', handler)
      websocketService.offMessage('audio', handler)
      websocketService.offMessage('error', handler)
      reject(new Error('WebSocket未连接'))
    }
    
    if (onCancel) {
      onCancel(() => {
        isCancelled = true
        websocketService.offMessage('text_stream', handler)
        websocketService.offMessage('audio', handler)
        websocketService.offMessage('error', handler)
        reject(new Error('用户取消了流式响应'))
      })
    }
    
    // 设置超时
    setTimeout(() => {
      if (!isCancelled) {
        websocketService.offMessage('text_stream', handler)
        websocketService.offMessage('audio', handler)
        websocketService.offMessage('error', handler)
        resolve({
          message: completeMessage,
          audioUrl: audioUrl,
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        })
      }
    }, 30000) // 30秒超时
  })
}

// 检查连接状态
export const checkConnection = async () => {
  return new Promise((resolve) => {
    const status = websocketService.getConnectionStatus()
    resolve({
      connected: status.connected,
      status: status.connected ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  })
}

// 角色管理相关API
export const createCharacter = async (characterData) => {
  try {
    const response = await httpRequest('/api/v1/characters/', {
      method: 'POST',
      body: JSON.stringify(characterData)
    })
    return response
  } catch (error) {
    console.error('创建角色失败:', error)
    throw error
  }
}

export const updateCharacter = async (characterId, characterData) => {
  try {
    const response = await httpRequest(`/api/v1/characters/${characterId}`, {
      method: 'PUT',
      body: JSON.stringify(characterData)
    })
    return response
  } catch (error) {
    console.error('更新角色失败:', error)
    throw error
  }
}

export const deleteCharacter = async (characterId) => {
  try {
    const response = await httpRequest(`/api/v1/characters/${characterId}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    console.error('删除角色失败:', error)
    throw error
  }
}

export const getMyCharacters = async () => {
  try {
    const response = await httpRequest('/api/v1/characters/my')
    return response
  } catch (error) {
    console.error('获取我的角色失败:', error)
    throw error
  }
}

export const toggleCharacterVisibility = async (characterId, isPublic) => {
  try {
    const response = await httpRequest(`/api/v1/characters/${characterId}/toggle-visibility?is_public=${isPublic}`, {
      method: 'POST'
    })
    return response
  } catch (error) {
    console.error('切换角色可见性失败:', error)
    throw error
  }
}

export const cloneCharacter = async (characterId, newName = null) => {
  try {
    const url = newName 
      ? `/api/v1/characters/${characterId}/clone?new_name=${encodeURIComponent(newName)}`
      : `/api/v1/characters/${characterId}/clone`
    const response = await httpRequest(url, {
      method: 'POST'
    })
    return response
  } catch (error) {
    console.error('克隆角色失败:', error)
    throw error
  }
}

export const uploadCharacterAvatar = async (characterId, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/api/v1/characters/${characterId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('上传角色头像失败:', error)
    throw error
  }
}

export const uploadVoiceSample = async (characterId, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/api/v1/characters/${characterId}/voice-sample`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('上传音色样本失败:', error)
    throw error
  }
}

// 知识库管理相关API
export const uploadKnowledgeDocument = async (file, description = '', isPublic = true) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    formData.append('is_public', isPublic)
    
    const response = await fetch(`${API_BASE_URL}/api/v1/knowledge/upload`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('上传知识库文档失败:', error)
    throw error
  }
}

export const getPublicKnowledgeDocuments = async (skip = 0, limit = 20) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/public?skip=${skip}&limit=${limit}`)
    return response
  } catch (error) {
    console.error('获取公开知识库文档失败:', error)
    throw error
  }
}

export const getMyKnowledgeDocuments = async () => {
  try {
    const response = await httpRequest('/api/v1/knowledge/my')
    return response
  } catch (error) {
    console.error('获取我的知识库文档失败:', error)
    throw error
  }
}

export const linkKnowledgeToCharacter = async (characterId, documentId) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/characters/${characterId}/link/${documentId}`, {
      method: 'POST'
    })
    return response
  } catch (error) {
    console.error('关联知识库到角色失败:', error)
    throw error
  }
}

export const unlinkKnowledgeFromCharacter = async (characterId, documentId) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/characters/${characterId}/unlink/${documentId}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    console.error('解除知识库关联失败:', error)
    throw error
  }
}

export const getCharacterKnowledgeDocuments = async (characterId) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/characters/${characterId}/documents`)
    return response
  } catch (error) {
    console.error('获取角色知识库文档失败:', error)
    throw error
  }
}

export const deleteKnowledgeDocument = async (documentId) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/documents/${documentId}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    console.error('删除知识库文档失败:', error)
    throw error
  }
}

export const updateKnowledgeDocumentVisibility = async (documentId, isPublic) => {
  try {
    const response = await httpRequest(`/api/v1/knowledge/documents/${documentId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic })
    })
    return response
  } catch (error) {
    console.error('更新知识库文档可见性失败:', error)
    throw error
  }
}

// 导出WebSocket服务实例
export { websocketService }
export default websocketService