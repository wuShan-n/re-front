<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <Sidebar
      :characters="characters"
      :current-character="currentCharacter"
      :chat-sessions="chatSessions"
      :current-session-id="currentSessionId"
      @select-character="selectCharacterDirectly"
      @load-session="loadSessionHistory"
      @create-session="createNewSession"
      @logout="handleLogout"
      @delete-session="deleteSession"
      @manage-characters="goToCharacterManagement"
      @manage-knowledge="goToKnowledgeManagement"
      @manage-voice-samples="goToVoiceSampleManagement"
      @view-public-characters="goToPublicCharacters"
    />
    
    <!-- 主聊天区域 -->
    <div class="main-chat-area">
      <div class="chat-container">
    <!-- 聊天头部 -->
        <div class="chat-header">
      <div class="header-left">
            <h1 class="chat-title">魔法对话</h1>
            <div class="chat-subtitle">与 {{ currentCharacter || '未选择角色' }} 的对话</div>
      </div>
          <div class="header-right" v-if="currentCharacter">
            <div class="character-details">
              <div class="character-info-card">
                <div class="character-name">{{ getCurrentCharacterInfo()?.name || currentCharacter }}</div>
                <div class="character-description">{{ getCurrentCharacterInfo()?.description || '魔法世界的角色' }}</div>
                <div class="character-meta">
                  <span class="character-house" v-if="getCurrentCharacterInfo()?.house">
                    {{ getCurrentCharacterInfo()?.house }}
                  </span>
                  <span class="character-role" v-if="getCurrentCharacterInfo()?.role">
                    {{ getCurrentCharacterInfo()?.role }}
                  </span>
      </div>
              </div>
            </div>
          </div>
        </div>

    <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div 
            v-for="message in chatStore.messages" 
            :key="message.id"
          >
            <MessageItem
              :message="message"
              :playing-message-id="playingMessageId"
              @play-message="playMessage"
            />
          </div>
          
          <div v-if="chatStore.isLoading || isStreaming" class="loading-message">
            <el-icon class="loading-icon magic-icon" size="24" color="#D4AF37">
              <Loading />
            </el-icon>
            <span class="loading-text">
              {{ isStreaming ? 'AI正在回复中...' : 'AI正在思考中...' }}
            </span>
            <el-button 
              v-if="isStreaming" 
              type="danger" 
              size="small"
              @click="cancelStreamingResponse"
              class="cancel-button"
            >
              取消
            </el-button>
          </div>
      </div>

    <!-- 输入区域 -->
        <ChatInput
          v-model:inputText="inputText"
          :is-loading="chatStore.isLoading || isStreaming"
          :is-recording="chatStore.isRecording"
          @send-message="sendMessageToAPI"
          @toggle-recording="toggleRecording"
          />
        </div>
      </div>
    
    <!-- 角色选择对话框 -->
    <el-dialog
      v-model="showCharacterDialog"
      title="选择角色"
      width="600px"
      class="character-dialog"
      :before-close="handleCloseDialog"
    >
      <div class="character-grid">
        <div 
          v-for="character in characters"
          :key="character.id"
          :class="['character-card', { 'selected': selectedCharacter === character.name }]"
          @click="selectedCharacter = character.name"
        >
          <div class="character-avatar">
            <el-icon size="40" color="#D4AF37">
              <UserFilled />
            </el-icon>
          </div>
          <div class="character-info">
            <h3 class="character-name">{{ character.name }}</h3>
            <p class="character-description">{{ character.description }}</p>
            <div class="character-details">
              <span class="character-house">{{ character.house }}</span>
              <span class="character-role">{{ character.role }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmCharacterSelection"
            :disabled="!selectedCharacter"
          >
            确定选择
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { audioService } from '@/utils/audioService'
import { ElMessageBox, ElMessage } from 'element-plus'
import { selectCharacter, sendMessage, sendMessageStream, getCharacters, getChatHistory, deleteConversation, websocketService } from '@/services/harryPotterApi'
import { 
  Loading,
  UserFilled
} from '@element-plus/icons-vue'
import Sidebar from './Sidebar.vue'
import MessageItem from './MessageItem.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()
const router = useRouter()
const inputText = ref('')
const messagesContainer = ref(null)

// 流式响应相关状态
const currentCharacter = ref('')
const characters = ref([])
const chatSessions = ref([])
const currentSessionId = ref(null)
const sessionMessages = ref(new Map())
const currentConversationId = ref(null)
const isConnected = ref(false)
const playingMessageId = ref('')
const isStreaming = ref(false)
const streamingMessageId = ref(null)
const showCharacterDialog = ref(false)
const selectedCharacter = ref('')

// 初始化WebSocket连接
const initWebSocket = (conversationId = null) => {
  if (!conversationId) {
    return
  }
  
  // 先断开现有连接，避免重复连接
  websocketService.disconnect()
  
  // 重新注册监听器（因为disconnect会清空所有监听器）
  registerWebSocketListeners()
  
  // 监听连接状态变化
  websocketService.onMessage('connection', (data) => {
    isConnected.value = data.status === 'connected'
    
    // 连接成功后初始化角色列表和会话历史
    if (data.status === 'connected') {
      setTimeout(async () => {
        await initCharacters()
        await initChatHistory()
      }, 500)
    }
  })
  
  // 启动连接
  websocketService.connect(conversationId)
}

// 初始化角色列表
const initCharacters = async () => {
  try {
    // 检查用户是否已登录
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      return
    }
    
    // 如果已经有角色数据，不重复获取
    if (characters.value.length > 0) {
      return
    }
    
    const charactersData = await getCharacters()
    // 确保characters是数组
    characters.value = Array.isArray(charactersData) ? charactersData : []
  } catch (error) {
    characters.value = []
  }
}

// 初始化会话历史
const initChatHistory = async () => {
  try {
    // 检查用户是否已登录
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      return
    }
    
    // 如果已经有会话数据，不重复获取
    if (chatSessions.value.length > 0) {
      return
    }
    
    const history = await getChatHistory()
    chatSessions.value = history
    
    // 将历史消息存储到 sessionMessages Map 中
    history.forEach(session => {
      if (session.messages && session.messages.length > 0) {
        sessionMessages.value.set(session.id, session.messages)
      }
    })
  } catch (error) {
    // 静默处理错误
  }
}

// 直接选择角色（从侧边栏）
const selectCharacterDirectly = async (characterIdentifier) => {
  // 总是调用API，让API内部判断是否需要创建新会话
  await selectCharacterAPI(characterIdentifier)
}

// 播放消息
const playMessage = async (message) => {
  try {
    // 如果当前正在播放这条消息，则停止播放
    if (playingMessageId.value === message.id) {
      audioService.stopAudio()
      playingMessageId.value = ''
      return
    }
    
    // 如果正在播放其他消息，先停止
    if (playingMessageId.value) {
      audioService.stopAudio()
    }
    
    // 开始播放当前消息
    playingMessageId.value = message.id
    
    // 只使用后端音频URL
    if (message.audioUrl) {
      await audioService.playAudio(message.audioUrl, message.id)
    } else {
      ElMessage.warning('该消息暂无音频文件')
      playingMessageId.value = ''
    }
    
  } catch (error) {
    playingMessageId.value = ''
    // 不要显示错误消息，避免干扰用户体验
    // ElMessage.error('音频播放失败，请检查网络连接')
  }
}

// 选择角色API调用
const selectCharacterAPI = async (characterIdentifier) => {
  try {
    // 检查是否是同一个角色
    if (currentCharacter.value === characterIdentifier) {
      // 如果是同一个角色，检查是否已有对话
      if (currentConversationId.value) {
        // 已有对话，不需要创建新对话，直接返回
        return
      }
      // 如果没有对话ID，继续创建新对话
    }
    
    // 如果当前有会话内容，保存并创建新会话
    if (currentSessionId.value && chatStore.messages.length > 0) {
      // 更新当前会话的消息计数
      const currentSession = chatSessions.value.find(s => s.id === currentSessionId.value)
      if (currentSession) {
        currentSession.messageCount = chatStore.messages.length
      }
      
      // 保存当前会话的消息
      sessionMessages.value.set(currentSessionId.value, [...chatStore.messages])
      
      // 清空当前消息
      chatStore.clearMessages()
      
      // 重置当前会话
      currentSessionId.value = null
    }

    // 调用后端API选择角色（只有不同角色或没有对话时才调用）
    const result = await selectCharacter(characterIdentifier)
    
    // 更新当前角色和对话ID
    currentCharacter.value = result.character.name
    currentConversationId.value = result.conversation.id
    
    // 连接WebSocket
    initWebSocket(currentConversationId.value)
    
  } catch (error) {
    console.error('选择角色失败:', error)
    ElMessage.error('选择角色失败，请重试')
  }
}

// 创建新会话（手动触发）
const createNewSession = () => {
  // 保存当前会话的消息
  if (currentSessionId.value && chatStore.messages.length > 0) {
    // 更新当前会话的消息计数
    const currentSession = chatSessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession) {
      currentSession.messageCount = chatStore.messages.length
    }
    
    // 保存当前会话的消息
    sessionMessages.value.set(currentSessionId.value, [...chatStore.messages])
  }
  
  // 清空当前消息
  chatStore.clearMessages()
  
  // 重置当前会话
  currentSessionId.value = null
  
  // 显示提示
  ElMessage.success('已创建新会话，可以开始新的对话了！')
}

// 自动创建新会话（用户发送第一条消息时）
const autoCreateNewSession = (userMessage) => {
  if (!currentSessionId.value) {
    const sessionId = `session_${Date.now()}`
    const sessionTitle = userMessage 
      ? userMessage.substring(0, 20) + (userMessage.length > 20 ? '...' : '')
      : '新对话'
    
    const newSession = {
      id: sessionId,
      title: sessionTitle,
      startTime: new Date().toISOString(),
      messageCount: 0
    }
    
    chatSessions.value.unshift(newSession)
    currentSessionId.value = sessionId
  }
}

// 加载会话历史
const loadSessionHistory = (sessionId) => {
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (!session) return
  
  // 保存当前会话
  if (currentSessionId.value && chatStore.messages.length > 0) {
    const currentSession = chatSessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession) {
      currentSession.messageCount = chatStore.messages.length
    }
    sessionMessages.value.set(currentSessionId.value, [...chatStore.messages])
  }
  
  // 加载选中的会话
  currentSessionId.value = sessionId
  
  // 优先从后端数据中获取消息，如果没有则从本地Map获取
  let messages = []
  if (session.messages && session.messages.length > 0) {
    messages = session.messages
  } else {
    messages = sessionMessages.value.get(sessionId) || []
  }
  
  chatStore.setMessages(messages)
}

// 更新当前会话的消息计数
const updateCurrentSessionCount = () => {
  if (currentSessionId.value) {
    const currentSession = chatSessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession) {
      currentSession.messageCount = chatStore.messages.length
    }
  }
}

// 获取当前角色的详细信息
const getCurrentCharacterInfo = () => {
  if (!currentCharacter.value || !Array.isArray(characters.value)) return null
  return characters.value.find(char => 
    char.name === currentCharacter.value || 
    char.id === currentCharacter.value
  )
}

// 发送消息到API
const sendMessageToAPI = async () => {
  if (!inputText.value.trim()) return

  const message = inputText.value.trim()
  inputText.value = ''
  
  // 检查WebSocket连接状态
  const connectionStatus = websocketService.getConnectionStatus()
  if (!connectionStatus.connected) {
    if (currentConversationId.value) {
      initWebSocket(currentConversationId.value)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      ElMessage.error('请先选择一个角色开始对话')
      return
    }
  }
  
  // 如果是第一条消息，自动创建新会话
  if (!currentSessionId.value) {
    autoCreateNewSession(message)
  }
  
  // 添加用户消息
  chatStore.addMessage(message, 'user')
  updateCurrentSessionCount()
  
  try {
    // 创建AI消息占位符
    const aiMessageId = `ai_${Date.now()}`
    chatStore.addMessage('正在思考...', 'assistant', aiMessageId)
    
    // 设置流式响应状态
    streamingMessageId.value = aiMessageId
    isStreaming.value = true
    
    // 发送消息
    const success = websocketService.sendTextMessage(message, true)
    
    if (!success) {
      throw new Error('WebSocket未连接')
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    if (streamingMessageId.value) {
      chatStore.updateMessage(streamingMessageId.value, '抱歉，我暂时无法回复您的消息。请稍后再试。')
    } else {
      chatStore.addMessage('抱歉，我暂时无法回复您的消息。请稍后再试。', 'assistant')
    }
    streamingMessageId.value = null
    isStreaming.value = false
  }
}

// 取消流式调用
const cancelStreamingResponse = () => {
  if (streamingMessageId.value) {
    streamingMessageId.value = null
    isStreaming.value = false
    ElMessage.info('已取消回复')
  }
}

// 语音录制切换
const toggleRecording = () => {
  // 防止快速重复点击
  if (window.isTogglingRecording) {
    return
  }
  
  window.isTogglingRecording = true
  
  try {
    if (chatStore.isRecording === true) {
    stopRecording()
  } else {
    startRecording()
    }
  } finally {
    // 延迟重置标志，防止快速重复点击
    setTimeout(() => {
      window.isTogglingRecording = false
    }, 500)
  }
}

// 开始录音 - 录制音频文件发送给后端
const startRecording = async () => {
  // 防止重复调用
  if (chatStore.isRecording) {
    return
  }
  
  try {
    // 检查WebSocket连接状态
    const connectionStatus = websocketService.getConnectionStatus()
    
    if (!connectionStatus.connected) {
      if (currentConversationId.value) {
        initWebSocket(currentConversationId.value)
        // 等待连接建立，但不要阻塞录音开始
        setTimeout(() => {
          // WebSocket连接状态检查
        }, 1000)
      } else {
        ElMessage.error('请先选择一个角色开始对话')
        return
      }
    }

    // 获取麦克风权限 - 根据后端要求优化音频参数
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // 降低到16kHz，更适合语音识别
        channelCount: 1, // 单声道
        sampleSize: 16 // 16位采样
      } 
    })
    
    // 创建MediaRecorder - 根据后端支持的格式优化
    let mimeType = 'audio/webm'
    
    // 检查浏览器支持的音频格式，按后端支持顺序选择
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus' // 优先使用WebM+Opus，压缩率高
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4' // MP4格式，后端支持M4A
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      mimeType = 'audio/wav' // WAV格式，无压缩
    }
    
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 64000 // 降低比特率到64kbps，适合语音
    })
    
    const audioChunks = []
    let recordingStartTime = Date.now()
    let actualRecordingStartTime = null // 实际开始录音的时间
    let hasReceivedData = false // 是否已接收到音频数据
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
        
        // 第一次接收到数据时记录实际开始时间
        if (!hasReceivedData) {
          actualRecordingStartTime = Date.now()
          hasReceivedData = true
        }
      }
    }
    
    mediaRecorder.onstop = async () => {
      // 清除超时定时器
      if (window.recordingTimeout) {
        clearTimeout(window.recordingTimeout)
        window.recordingTimeout = null
      }
      
      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop())
      
      // 检查录音数据
      if (audioChunks.length === 0) {
        chatStore.setRecording(false)
        ElMessage.warning('录音时间太短，请重新录音')
        return
      }
      
      // 创建音频Blob
      const audioBlob = new Blob(audioChunks, { type: mimeType })
      
      // 检查Blob大小
      if (audioBlob.size === 0) {
        chatStore.setRecording(false)
        ElMessage.warning('录音数据为空，请重新录音')
        return
      }
      
      // 计算实际录音时长（从开始接收数据算起）
      const actualDuration = actualRecordingStartTime ? 
        (Date.now() - actualRecordingStartTime) / 1000 : 
        (Date.now() - recordingStartTime) / 1000
      
      if (actualDuration < 0.5) { // 使用实际时间，0.5秒
        chatStore.setRecording(false)
        ElMessage.warning('录音时间太短，请至少录制0.5秒')
        return
      }
      
      // 转换为ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      // 发送音频数据给后端
      try {
        await sendAudioToBackend(arrayBuffer, mimeType)
      } catch (error) {
        ElMessage.error('发送语音消息失败')
      } finally {
        // 无论发送成功与否，都要重置录音状态
      chatStore.setRecording(false)
      }
    }
    
    mediaRecorder.onerror = (event) => {
      console.error('录音错误:', event.error)
      chatStore.setRecording(false)
      ElMessage.error('录音失败，请重试')
    }
    
    // 开始录音，添加时间间隔确保数据收集
    mediaRecorder.start(100) // 每100ms收集一次数据
    chatStore.setRecording(true)
    
    // 提示用户录音已开始
    ElMessage.success('开始录音，请说话...')
    
    // 设置超时机制，防止onstop事件不触发
    window.recordingTimeout = setTimeout(() => {
      if (window.currentMediaRecorder && window.currentMediaRecorder.state === 'recording') {
        try {
          window.currentMediaRecorder.stop()
  } catch (error) {
          console.error('超时强制停止录音时出错:', error)
        }
      }
    chatStore.setRecording(false)
    }, 30000) // 30秒超时
    
    // 存储MediaRecorder引用，用于停止录音
    window.currentMediaRecorder = mediaRecorder
    
  } catch (error) {
    console.error('启动录音失败:', error)
    chatStore.setRecording(false)
    ElMessage.error('无法访问麦克风，请检查权限设置')
  }
}

// 停止录音
const stopRecording = () => {
  // 清除超时定时器
  if (window.recordingTimeout) {
    clearTimeout(window.recordingTimeout)
    window.recordingTimeout = null
  }
  
  if (window.currentMediaRecorder) {
    if (window.currentMediaRecorder.state === 'recording') {
      try {
        window.currentMediaRecorder.stop()
  } catch (error) {
        // 强制重置状态
        chatStore.setRecording(false)
      }
    } else {
      chatStore.setRecording(false)
    }
  } else {
    chatStore.setRecording(false)
  }
}

// 发送音频数据给后端
const sendAudioToBackend = async (audioData, mimeType = 'audio/webm') => {
  try {
    // 检查音频数据
    if (!audioData || audioData.byteLength === 0) {
      ElMessage.error('录音数据无效')
      return
    }
    
    // 检查音频数据大小是否合理
    if (audioData.byteLength < 1000) { // 小于1KB
      ElMessage.warning('录音数据太小，可能录音时间过短')
      return
    }
    
    if (audioData.byteLength > 50 * 1024 * 1024) { // 大于50MB
      ElMessage.error('录音文件过大，请重新录制')
      return
    }
    
    // 创建音频Blob URL用于播放用户语音
    const audioBlob = new Blob([audioData], { type: mimeType })
    const audioUrl = URL.createObjectURL(audioBlob)
    
    // 添加用户语音消息到聊天记录（包含音频URL）
    const userMessageId = String(Date.now() + Math.random())
    chatStore.addMessage('🎤 语音消息', 'user', userMessageId, audioUrl)
    
    // 创建AI回复消息占位符
    const aiMessageId = String(Date.now() + Math.random() + 1)
    chatStore.addMessage('🎵 AI正在处理语音消息，请稍候...', 'assistant', aiMessageId)
    streamingMessageId.value = aiMessageId
    isStreaming.value = true
    
    // 根据音频文件大小动态调整超时时间
    const audioSizeKB = audioData.byteLength / 1024
    let timeoutDuration = 120000 // 默认120秒（2分钟）
    
    if (audioSizeKB < 100) {
      timeoutDuration = 60000 // 小于100KB，60秒
    } else if (audioSizeKB < 500) {
      timeoutDuration = 90000 // 100-500KB，90秒
    } else if (audioSizeKB < 1000) {
      timeoutDuration = 120000 // 500KB-1MB，120秒
    } else {
      timeoutDuration = 180000 // 大于1MB，180秒（3分钟）
    }
    
    // 添加进度更新机制
    let progressCounter = 0
    const progressInterval = setInterval(() => {
      if (streamingMessageId.value === aiMessageId) {
        progressCounter++
        const dots = '.'.repeat((progressCounter % 3) + 1)
        chatStore.updateMessage(aiMessageId, `🎵 AI正在处理语音消息，请稍候${dots}`)
      } else {
        clearInterval(progressInterval)
      }
    }, 2000) // 每2秒更新一次进度
    
    // 设置超时机制，防止AI一直思考
    const timeoutId = setTimeout(() => {
      if (streamingMessageId.value === aiMessageId) {
        clearInterval(progressInterval)
        streamingMessageId.value = null
        isStreaming.value = false
        chatStore.updateMessage(aiMessageId, '抱歉，AI处理语音消息时间过长，请稍后再试。')
        // 清理监听器
        websocketService.offMessage('audio_response', handleAudioResponse)
        websocketService.offMessage('audio', handleAudioResponse)
        websocketService.offMessage('message', handleGenericMessage)
      }
    }, timeoutDuration)
    
    // 监听音频消息的响应
    const handleAudioResponse = (data) => {
      // 检查是否是当前对话的响应
      const isCurrentConversation = data.conversationId === currentConversationId.value || 
                                   !data.conversationId || 
                                   data.conversationId === currentConversationId.value
      
      if (isCurrentConversation) {
        // 处理文本响应
        if (data.text) {
          chatStore.updateMessage(aiMessageId, data.text)
        }
        
        // 处理音频响应 - 支持多种数据格式
        let audioUrl = null
        if (data.audioUrl) {
          audioUrl = data.audioUrl
        } else if (data.audio_url) {
          audioUrl = data.audio_url
        } else if (data.url) {
          audioUrl = data.url
        } else if (typeof data === 'string' && data.includes('http')) {
          // 如果直接返回URL字符串
          audioUrl = data
        } else if (data.data && typeof data.data === 'string' && data.data.includes('http')) {
          // 如果URL在data字段中
          audioUrl = data.data
        }
        
        if (audioUrl) {
          chatStore.updateMessage(aiMessageId, null, audioUrl)
        }
        
        // 响应完成
        if (data.complete || audioUrl) {
          clearTimeout(timeoutId)
          clearInterval(progressInterval)
          streamingMessageId.value = null
          isStreaming.value = false
          websocketService.offMessage('audio_response', handleAudioResponse)
          websocketService.offMessage('audio', handleAudioResponse)
          websocketService.offMessage('message', handleGenericMessage)
        }
      }
    }
    
    // 检查WebSocket连接状态
    const connectionStatus = websocketService.getConnectionStatus()
    
    if (!connectionStatus.connected) {
      ElMessage.error('WebSocket未连接，无法发送语音消息')
      // 尝试重新连接
      if (currentConversationId.value) {
        initWebSocket(currentConversationId.value)
        // 等待连接建立
        setTimeout(() => {
          const newStatus = websocketService.getConnectionStatus()
          if (newStatus.connected) {
            ElMessage.success('WebSocket重新连接成功')
          } else {
            ElMessage.error('WebSocket重新连接失败')
          }
        }, 2000)
      }
      // 清理资源
      chatStore.removeMessage(aiMessageId)
      streamingMessageId.value = null
      isStreaming.value = false
      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      websocketService.offMessage('audio_response', handleAudioResponse)
      websocketService.offMessage('audio', handleAudioResponse)
      websocketService.offMessage('message', handleAllMessages)
      websocketService.offMessage('message', handleGenericMessage)
      return
    }
    
    // 注册响应监听器
    websocketService.onMessage('audio_response', handleAudioResponse)
    websocketService.onMessage('audio', handleAudioResponse) // 也监听audio类型
    
    // 添加通用消息监听器，记录所有收到的消息
    const handleAllMessages = (data) => {
      // 静默处理所有消息
    }
    websocketService.onMessage('message', handleAllMessages)
    
    // 也监听通用消息，以防后端返回的消息类型不是audio_response
    const handleGenericMessage = (data) => {
      // 检查是否是音频响应
      if (data.audioUrl || data.audio_url || data.url || 
          (typeof data === 'string' && data.includes('http')) ||
          (data.data && typeof data.data === 'string' && data.data.includes('http'))) {
        handleAudioResponse(data)
      }
    }
    websocketService.onMessage('message', handleGenericMessage)
    
    // 通过WebSocket发送音频数据
    const success = websocketService.sendAudioMessage(audioData, mimeType)
    
    if (success) {
      ElMessage.success('语音消息已发送')
    } else {
      ElMessage.error('发送语音消息失败')
      // 如果发送失败，移除AI消息占位符
      chatStore.removeMessage(aiMessageId)
      streamingMessageId.value = null
      isStreaming.value = false
      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      websocketService.offMessage('audio_response', handleAudioResponse)
      websocketService.offMessage('audio', handleAudioResponse)
      websocketService.offMessage('message', handleAllMessages)
      websocketService.offMessage('message', handleGenericMessage)
    }
  } catch (error) {
    console.error('发送音频数据失败:', error)
    ElMessage.error('发送语音消息失败')
    // 如果发送失败，移除AI消息占位符
    if (streamingMessageId.value) {
      chatStore.removeMessage(streamingMessageId.value)
      streamingMessageId.value = null
      isStreaming.value = false
    }
  } finally {
    isStreaming.value = false
    streamingMessageId.value = null
    streamingContent.value = ''
    cancelStreaming.value = null
  }
}


// 处理登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 清除用户数据
    authStore.logout()
    
    // 跳转到登录页
    router.push('/login')
    
  } catch (error) {
    // 用户取消
  }
}

// 删除会话
const deleteSession = async (sessionId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    
    // 调用删除API
    await deleteConversation(sessionId)
    
    // 如果删除的是当前会话，清空当前会话
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      currentConversationId.value = null
      chatStore.clearMessages()
    }
    
    // 重新加载会话历史
    await initChatHistory()
    
    ElMessage.success('会话删除成功')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除会话失败，请稍后重试')
    }
  }
}

// 跳转到角色管理
const goToCharacterManagement = () => {
  router.push('/characters')
}

// 跳转到知识库管理
const goToKnowledgeManagement = () => {
  router.push('/knowledge')
}

// 跳转到音色样本管理
const goToVoiceSampleManagement = () => {
  router.push('/voice-samples')
}

// 跳转到公开角色
const goToPublicCharacters = () => {
  router.push('/public-characters')
}

// 确认角色选择
const confirmCharacterSelection = async () => {
  if (selectedCharacter.value) {
    await selectCharacterAPI(selectedCharacter.value)
    showCharacterDialog.value = false
    selectedCharacter.value = ''
  }
}

// 关闭对话框
const handleCloseDialog = () => {
  showCharacterDialog.value = false
  selectedCharacter.value = ''
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
  })
}

// 监听消息变化，自动滚动到底部
watch(() => chatStore.messages.length, () => {
    scrollToBottom()
})

// 注册WebSocket监听器
const registerWebSocketListeners = () => {
  // 监听文本流式响应
  websocketService.onMessage('text_stream', (data) => {
    if (streamingMessageId.value) {
      // 获取当前消息
      const messageIndex = chatStore.messages.findIndex(msg => msg.id === streamingMessageId.value)
      if (messageIndex > -1) {
        // 累积内容
        const currentContent = chatStore.messages[messageIndex].content
        const newContent = currentContent === '正在思考...' ? data.content : currentContent + data.content
        
        // 更新消息
        chatStore.messages[messageIndex].content = newContent
        // 强制触发响应式更新
        chatStore.messages = [...chatStore.messages]
      }
    }
  })
  
  // 监听音频响应
  websocketService.onMessage('audio', (data) => {
    if (streamingMessageId.value && data.url) {
      const messageIndex = chatStore.messages.findIndex(msg => msg.id === streamingMessageId.value)
      if (messageIndex > -1) {
        chatStore.messages[messageIndex].audioUrl = data.url
        chatStore.messages = [...chatStore.messages]
        // 收到音频响应，清理流式状态
        streamingMessageId.value = null
        isStreaming.value = false
      }
    }
  })
  
  // 监听音频响应
  websocketService.onMessage('audio_response', (data) => {
    if (streamingMessageId.value) {
      const messageIndex = chatStore.messages.findIndex(msg => msg.id === streamingMessageId.value)
      if (messageIndex > -1) {
        if (data.text) {
          chatStore.messages[messageIndex].content = data.text
        }
        if (data.audioUrl || data.audio_url || data.url) {
          chatStore.messages[messageIndex].audioUrl = data.audioUrl || data.audio_url || data.url
        }
        chatStore.messages = [...chatStore.messages]
        // 收到音频响应，清理流式状态
        streamingMessageId.value = null
        isStreaming.value = false
      }
    }
  })
}

// 组件挂载时初始化
onMounted(async () => {
  // 设置音频播放回调
  audioService.onPlayEnd = (messageId) => {
    if (playingMessageId.value === messageId) {
      playingMessageId.value = ''
    }
  }
  
  audioService.onPlayError = (messageId, error) => {
    if (playingMessageId.value === messageId) {
      playingMessageId.value = ''
    }
  }
  
  // 初始化角色列表和聊天历史
  await initCharacters()
  await initChatHistory()
})
</script>

<style scoped>
/* 分栏布局 */
.app-layout {
  display: flex;
  height: 100vh;
  background-image: url('/images/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 主聊天区域 */
.main-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  overflow: hidden;
}

/* 聊天头部 */
.chat-header {
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: #F7F3E9;
  padding: 20px 30px;
  border-bottom: 2px solid #D4AF37;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.header-right {
  flex: 0 0 auto;
  margin-left: 20px;
  max-width: 50%;
}

.chat-title {
  font-family: var(--font-magic-title);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 5px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.chat-subtitle {
  font-family: var(--font-magic-body);
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* 角色详细信息卡片 */
.character-details {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.character-info-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  min-width: 200px;
  max-width: 300px;
  width: auto;
  display: inline-block;
  vertical-align: top;
}

.character-info-card .character-name {
  font-family: var(--font-magic-title);
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
  margin: 0 0 4px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.character-info-card .character-description {
  font-family: var(--font-magic-body);
  font-size: 12px;
  color: #F7F3E9;
  margin: 0 0 6px 0;
  opacity: 0.9;
  white-space: pre-line;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.character-info-card .character-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.character-info-card .character-house,
.character-info-card .character-role {
  background: rgba(212, 175, 55, 0.2);
  color: #FFD700;
  padding: 2px 6px;
  border-radius: 8px;
  font-family: var(--font-magic-body);
  font-size: 10px;
  font-weight: 500;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

/* 消息容器 */
.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.messages-container::-webkit-scrollbar {
  display: none;
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.cancel-button {
  margin-left: auto;
  background: linear-gradient(135deg, #dc3545, #c82333);
  border: none;
  color: white;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #D4AF37;
  font-family: var(--font-magic-body);
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 角色选择对话框 */
.character-dialog :deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  contain: layout;
}

.character-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(212, 175, 55, 0.1);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  min-height: 80px;
  position: relative;
  will-change: background-color, border-color, box-shadow;
}

.character-card:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: #D4AF37;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
}

.character-card.selected {
  background: rgba(212, 175, 55, 0.3);
  border-color: #D4AF37;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
}

.character-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.character-info {
  flex: 1;
}

.character-name {
  color: #654321;
  font-family: var(--font-magic-title);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.character-description {
  color: #8B4513;
  font-family: var(--font-magic-body);
  font-size: 14px;
  margin: 0 0 8px 0;
  line-height: 1.4;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.character-details {
  display: flex;
  gap: 10px;
}

.character-house,
.character-role {
  background: rgba(212, 175, 55, 0.2);
  color: #8B4513;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: var(--font-magic-body);
  font-size: 12px;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .main-chat-area {
    padding: 10px;
  }
  
  .chat-header {
    padding: 15px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    margin-left: 0;
    width: 100%;
  }
  
  .character-info-card {
    min-width: auto;
    width: 100%;
  }
  
  .chat-title {
    font-size: 20px;
  }
  
  .messages-container {
    padding: 15px;
  }
  
  .character-grid {
    grid-template-columns: 1fr;
  }
}
</style>