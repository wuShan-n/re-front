// Mock.js 模拟数据服务 (WebSocket版本)
import Mock from 'mockjs'

// 设置延迟时间
Mock.setup({
  timeout: '200-600'
})

// 模拟WebSocket连接
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    
    // 模拟连接延迟
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' })
      }
    }, 100)
  }
  
  send(data) {
    const message = JSON.parse(data)
    
    // 模拟处理延迟
    setTimeout(() => {
      this.handleMessage(message)
    }, Mock.Random.integer(200, 600))
  }
  
  handleMessage(message) {
    let response = null
    
    switch (message.type) {
      case 'ping':
        response = { type: 'pong' }
        break
        
      case 'get_characters':
        response = {
          type: 'characters_response',
          requestId: message.requestId,
          success: true,
          data: mockCharacters
        }
        break
        
      case 'select_character':
        const character = mockCharacters.find(c => c.name === message.characterName)
        response = {
          type: 'select_character_response',
          requestId: message.requestId,
          success: !!character,
          data: character || null,
          error: character ? null : '角色不存在'
        }
        break
        
      case 'send_message':
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
        // 使用第一个角色作为默认角色
        const defaultCharacter = mockCharacters[0]
        response = {
          type: 'chat_response',
          requestId: message.requestId,
          success: true,
          data: {
            id: Mock.mock('@id'),
            character: defaultCharacter ? defaultCharacter.name : '哈利·波特',
            message: randomResponse,
            timestamp: new Date().toISOString(),
            type: 'character',
            audioUrl: `https://t2u169tyn.hn-bkt.clouddn.com/audio/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3?e=${Math.floor(Date.now() / 1000) + 3600}&token=mock_token`
          }
        }
        break
        
      case 'text':
        // 处理文本消息，触发流式响应
        this.handleStreamResponse(message)
        break
        
      case 'audio':
        // 处理语音消息
        // 模拟语音转录
        setTimeout(() => {
          this.sendMessage({
            type: 'transcription',
            text: '这是模拟的语音转录文本',
            conversationId: message.conversationId || '1'
          })
        }, 1000)
        
        // 模拟AI回复
        setTimeout(() => {
          this.handleStreamResponse({
            message: '我听到了您的语音消息，让我来回复您...',
            conversationId: message.conversationId || '1'
          })
        }, 2000)
        break
        
      case 'send_message_stream':
        // 流式响应需要特殊处理，不能直接返回response
        this.handleStreamResponse(message)
        return // 直接返回，不发送response
        
      case 'cancel_stream':
        // 处理取消流式调用
        this.handleCancelStream(message)
        return // 直接返回，不发送response
        
      case 'login':
        response = {
          type: 'login_response',
          requestId: message.requestId,
          success: true,
          data: {
            id: Mock.mock('@id'),
            username: message.username,
            name: message.username,
            token: Mock.mock('@string("lower", 32)'),
            avatar: '/头像.ico'
          }
        }
        break
        
      case 'logout':
        response = {
          type: 'logout_response',
          requestId: message.requestId,
          success: true,
          data: null
        }
        break
        
      case 'get_user_info':
        response = {
          type: 'user_info_response',
          requestId: message.requestId,
          success: true,
          data: {
            id: Mock.mock('@id'),
            username: 'testuser',
            name: '测试用户',
            avatar: '/头像.ico'
          }
        }
        break
        
      case 'get_chat_history':
        response = {
          type: 'chat_history_response',
          requestId: message.requestId,
          success: true,
          data: mockChatHistory
        }
        break
        
      case 'clear_chat_history':
        response = {
          type: 'clear_chat_history_response',
          requestId: message.requestId,
          success: true,
          data: null
        }
        break
        
      default:
        response = {
          type: 'error',
          requestId: message.requestId,
          success: false,
          error: '未知的消息类型'
        }
    }
    
    if (response && this.onmessage) {
      this.onmessage({ data: JSON.stringify(response) })
    }
  }
  
  close(code = 1000, reason = '') {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code, reason })
    }
  }
  
  // 处理流式响应
  handleStreamResponse(message) {
    // 现在使用conversationId而不是character
    const { conversationId } = message
    
    // 根据conversationId找到对应的角色
    // 这里简化处理，使用第一个角色作为默认角色
    const characterData = mockCharacters[0] // 使用第一个角色作为默认
    
    if (!characterData) {
      this.sendMessage({
        type: 'chat_stream_error',
        requestId: message.requestId,
        error: '角色不存在'
      })
      return
    }
    
    // 模拟流式响应
    setTimeout(() => {
      // 模拟分块发送 - 使用新的消息格式
      const fullResponse = `作为${characterData.name}，我想说：${message.message}。这让我想起了我在${characterData.house}学院的经历...`
      const words = fullResponse.split(' ')
      const chunkSize = 3
      let chunkIndex = 0
      
      const sendChunk = () => {
        if (chunkIndex < words.length) {
          const chunk = words.slice(chunkIndex, chunkIndex + chunkSize).join(' ') + ' '
          this.sendMessage({
            type: 'text_stream',
            content: chunk,
            conversationId: conversationId
          })
          chunkIndex += chunkSize
          setTimeout(sendChunk, 500) // 每500ms发送一个块
        } else {
          // 发送流式响应结束信号
          this.sendMessage({
            type: 'stream_end',
            conversationId: conversationId
          })
          
          // 发送音频URL - 使用一个有效的测试音频URL
          this.sendMessage({
            type: 'audio',
            url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            conversationId: conversationId
          })
        }
      }
      
      setTimeout(sendChunk, 1000) // 1秒后开始发送块
    }, 500)
  }
  
  // 发送消息到客户端
  sendMessage(data) {
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({ data: JSON.stringify(data) })
      }, 100)
    }
  }
  
  // 处理取消流式调用
  handleCancelStream(message) {
    // 发送取消确认
    this.sendMessage({
      type: 'chat_stream_cancel',
      requestId: message.requestId,
      data: {
        message: '流式响应已取消',
        timestamp: new Date().toISOString()
      }
    })
  }
}

// MockWebSocket类定义完成

// 模拟角色数据
export const mockCharacters = [
  {
    id: 1,
    name: '哈利·波特',
    description: '一位年轻的巫师，以其勇敢和击败伏地魔的命运而闻名于魔法世界。人格类型为ISFP-9w8-964，是内在感觉、感知、情感倾向的性格。具有强烈的情感表达欲望，能够迅速适应环境，具有独特的审美和创造性。',
    aliases: ['救世主', '大难不死的男孩'],
    role: '学生',
    house: '格兰芬多',
    avatar: '/头像.ico',
    personality: '勇敢、忠诚、有正义感',
    abilities: ['魁地奇', '黑魔法防御术', '蛇佬腔']
  },
  {
    id: 2,
    name: '赫敏·格兰杰',
    description: '聪明绝顶的麻瓜出身女巫，格兰芬多的学霸，知识渊博。她拥有出色的学习能力和逻辑思维，是三人组中的智囊。在魔法世界中以勤奋和智慧著称，经常帮助朋友们解决各种难题。',
    aliases: ['万事通', '格兰杰小姐'],
    role: '学生',
    house: '格兰芬多',
    avatar: '/头像.ico',
    personality: '聪明、勤奋、有原则',
    abilities: ['魔咒学', '变形术', '魔药学']
  },
  {
    id: 3,
    name: '罗恩·韦斯莱',
    description: '忠诚的朋友，格兰芬多的守门员',
    aliases: ['罗恩', '韦斯莱'],
    role: '学生',
    house: '格兰芬多',
    avatar: '/头像.ico',
    personality: '忠诚、幽默、有时缺乏自信',
    abilities: ['魁地奇', '巫师棋', '魔咒学']
  },
  {
    id: 4,
    name: '阿不思·邓布利多',
    description: '霍格沃茨的校长，最伟大的白巫师，拥有无与伦比的智慧和魔法力量。他深谋远虑，总是为大局着想，是魔法世界的守护者。他的智慧和仁慈使他成为所有巫师的榜样。',
    aliases: ['邓布利多教授', '校长'],
    role: '校长',
    house: '格兰芬多',
    avatar: '/头像.ico',
    personality: '睿智、仁慈、深谋远虑',
    abilities: ['高级魔法', '凤凰社', '预言']
  },
  {
    id: 5,
    name: '西弗勒斯·斯内普',
    description: '魔药学教授，双面间谍',
    aliases: ['斯内普教授', '混血王子'],
    role: '教授',
    house: '斯莱特林',
    avatar: '/头像.ico',
    personality: '复杂、深沉、忠诚',
    abilities: ['魔药学', '大脑封闭术', '黑魔法']
  },
  {
    id: 6,
    name: '米勒娃·麦格',
    description: '变形术教授，格兰芬多院长',
    aliases: ['麦格教授', '院长'],
    role: '教授',
    house: '格兰芬多',
    avatar: '/头像.ico',
    personality: '严格、公正、关爱学生',
    abilities: ['变形术', '魁地奇', '决斗']
  }
]

// 模拟聊天历史数据
export const mockChatHistory = [
  {
    id: 'session_1',
    title: '与哈利·波特的对话',
    character: '哈利·波特',
    startTime: '2024-01-15T10:00:00Z',
    lastMessageTime: '2024-01-15T10:30:00Z',
    messageCount: 5,
    messages: [
      {
        id: 'msg_1',
        content: '你好，哈利！',
        type: 'user',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: 'msg_2',
        content: '你好！很高兴见到你！',
        type: 'assistant',
        timestamp: '2024-01-15T10:00:05Z'
      },
      {
        id: 'msg_3',
        content: '你能告诉我一些关于霍格沃茨的事情吗？',
        type: 'user',
        timestamp: '2024-01-15T10:15:00Z'
      },
      {
        id: 'msg_4',
        content: '当然！霍格沃茨是世界上最棒的魔法学校...',
        type: 'assistant',
        timestamp: '2024-01-15T10:15:10Z'
      },
      {
        id: 'msg_5',
        content: '谢谢你的介绍！',
        type: 'user',
        timestamp: '2024-01-15T10:30:00Z'
      }
    ]
  },
  {
    id: 'session_2',
    title: '与赫敏·格兰杰的对话',
    character: '赫敏·格兰杰',
    startTime: '2024-01-14T14:00:00Z',
    lastMessageTime: '2024-01-14T14:45:00Z',
    messageCount: 3,
    messages: [
      {
        id: 'msg_6',
        content: '赫敏，你能帮我学习魔咒学吗？',
        type: 'user',
        timestamp: '2024-01-14T14:00:00Z'
      },
      {
        id: 'msg_7',
        content: '当然可以！魔咒学需要大量的练习和理论知识...',
        type: 'assistant',
        timestamp: '2024-01-14T14:00:15Z'
      },
      {
        id: 'msg_8',
        content: '我会努力学习的！',
        type: 'user',
        timestamp: '2024-01-14T14:45:00Z'
      }
    ]
  },
  {
    id: 'session_3',
    title: '与阿不思·邓布利多的对话',
    character: '阿不思·邓布利多',
    startTime: '2024-01-13T09:00:00Z',
    lastMessageTime: '2024-01-13T09:20:00Z',
    messageCount: 2,
    messages: [
      {
        id: 'msg_9',
        content: '邓布利多教授，关于魔法世界的未来，您有什么看法？',
        type: 'user',
        timestamp: '2024-01-13T09:00:00Z'
      },
      {
        id: 'msg_10',
        content: '魔法世界的未来需要年轻一代的智慧和勇气...',
        type: 'assistant',
        timestamp: '2024-01-13T09:20:00Z'
      }
    ]
  }
]

// 模拟聊天回复
export const mockResponses = [
  '这是一个很有趣的问题！',
  '让我想想...',
  '根据我的经验，我认为...',
  '这让我想起了我在霍格沃茨的经历...',
  '你说得对，这确实很重要。',
  '我完全同意你的观点！',
  '这让我想起了我的朋友们...',
  '在魔法世界里，这样的事情经常发生。'
]

// 保存原始fetch函数
const originalFetch = window.fetch

// 模拟HTTP请求
const mockFetch = async (url, options = {}) => {
  // 只拦截本地API请求
          if (url.includes('172.16.1.254:8000')) {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    
    // 模拟响应延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    // 根据路径和请求方法返回不同的模拟数据
    const method = options.method || 'GET'
    
    if (method === 'POST' && path.startsWith('/chat/conversations/') && path.endsWith('/messages') === false) {
      // 创建新对话的POST请求
      const characterId = path.split('/').pop()
      const character = mockCharacters.find(char => char.id == characterId)
      
      if (character) {
        const newConversation = {
          id: Date.now(), // 使用时间戳作为ID
          character: {
            id: character.id,
            name: character.name
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return new Response(JSON.stringify(newConversation), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({ error: 'Character not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    if (method === 'DELETE' && path.startsWith('/chat/conversations/')) {
      // 删除对话的DELETE请求
      const conversationId = path.split('/').pop()
      
      // 模拟删除操作 - 从mockChatHistory中移除对应会话
      const sessionIndex = mockChatHistory.findIndex(session => 
        session.id === `session_${conversationId}`
      )
      
      if (sessionIndex !== -1) {
        mockChatHistory.splice(sessionIndex, 1)
        return new Response(JSON.stringify({ message: 'Conversation deleted successfully' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    switch (path) {
      case '/characters/':
        return new Response(JSON.stringify(mockCharacters), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      
      case '/chat/conversations':
        return new Response(JSON.stringify(mockChatHistory.map(session => ({
          id: session.id.replace('session_', ''),
          character: { name: session.character },
          created_at: session.startTime,
          updated_at: session.lastMessageTime
        }))), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      
      case '/chat/conversations/1/messages':
        return new Response(JSON.stringify(mockChatHistory[0].messages.map(msg => ({
          id: msg.id.replace('msg_', ''),
          content: msg.content,
          role: msg.type === 'user' ? 'user' : 'assistant',
          created_at: msg.timestamp
        }))), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      
      case '/chat/conversations/2/messages':
        return new Response(JSON.stringify(mockChatHistory[1].messages.map(msg => ({
          id: msg.id.replace('msg_', ''),
          content: msg.content,
          role: msg.type === 'user' ? 'user' : 'assistant',
          created_at: msg.timestamp
        }))), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      
      case '/chat/conversations/3/messages':
        return new Response(JSON.stringify(mockChatHistory[2].messages.map(msg => ({
          id: msg.id.replace('msg_', ''),
          content: msg.content,
          role: msg.type === 'user' ? 'user' : 'assistant',
          created_at: msg.timestamp
        }))), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      
      default:
        // 对于其他请求，返回404
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
    }
  }
  
  // 对于非API请求，使用原始fetch
  return originalFetch(url, options)
}

// 立即初始化Mock服务
const originalWebSocket = window.WebSocket
window.WebSocket = MockWebSocket
window.fetch = mockFetch

// 导出初始化函数（保持兼容性）
export const initMockServices = () => {
  // Mock服务已经在文件加载时初始化
}
