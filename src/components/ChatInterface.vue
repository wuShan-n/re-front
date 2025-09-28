<template>
  <div class="chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <h1>AI 语音助手</h1>
      <button @click="clearChat" class="clear-btn">清空对话</button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-for="message in chatStore.messages" :key="message.id" class="message" :class="message.type">
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
        <div class="message-actions" v-if="message.type === 'assistant'">
          <button @click="speakMessage(message.content)" class="speak-btn" :disabled="chatStore.isPlaying">
            {{ chatStore.isPlaying ? '播放中...' : '🔊' }}
          </button>
        </div>
      </div>
      
      <!-- 加载指示器 -->
      <div v-if="chatStore.isLoading" class="message assistant">
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          @keydown.enter.prevent="sendMessage"
          placeholder="输入消息或点击麦克风进行语音输入..."
          class="text-input"
          :disabled="chatStore.isLoading"
        ></textarea>
        <div class="input-actions">
          <button
            @click="toggleRecording"
            class="voice-btn"
            :class="{ recording: chatStore.isRecording }"
            :disabled="chatStore.isLoading"
          >
            {{ chatStore.isRecording ? '🎤 录音中...' : '🎤' }}
          </button>
          <button
            @click="sendMessage"
            class="send-btn"
            :disabled="!inputText.trim() || chatStore.isLoading"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { VoiceService } from '@/utils/voiceService'

const chatStore = useChatStore()
const inputText = ref('')
const messagesContainer = ref(null)
const voiceService = new VoiceService()

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || chatStore.isLoading) return

  const userMessage = inputText.value.trim()
  inputText.value = ''
  
  // 添加用户消息
  chatStore.addMessage(userMessage, 'user')
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 模拟AI回复
  await simulateAIResponse(userMessage)
}

// 模拟AI回复
const simulateAIResponse = async (userMessage) => {
  chatStore.setLoading(true)
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 简单的回复逻辑
  let response = ''
  if (userMessage.includes('你好') || userMessage.includes('hello')) {
    response = '你好！我是AI语音助手，很高兴为您服务！'
  } else if (userMessage.includes('天气')) {
    response = '抱歉，我暂时无法获取实时天气信息。建议您查看天气应用或网站获取准确的天气预报。'
  } else if (userMessage.includes('时间')) {
    response = `现在的时间是 ${new Date().toLocaleString('zh-CN')}`
  } else if (userMessage.includes('帮助')) {
    response = '我可以和您进行对话，支持语音输入和语音播放。您可以问我任何问题，我会尽力回答！'
  } else {
    response = `我理解您说的是："${userMessage}"。这是一个很有趣的话题！虽然我是AI助手，但我还在学习中，可能无法完全理解所有问题。请告诉我更多信息，我会尽力帮助您。`
  }
  
  chatStore.addMessage(response, 'assistant')
  chatStore.setLoading(false)
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
}

// 切换录音状态
const toggleRecording = () => {
  if (chatStore.isRecording) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录音
const startRecording = () => {
  chatStore.setRecording(true)
  voiceService.startRecording(
    (transcript) => {
      inputText.value = transcript
      chatStore.setRecording(false)
    },
    (error) => {
      console.error('录音错误:', error)
      chatStore.setRecording(false)
      alert('录音失败: ' + error)
    }
  )
}

// 停止录音
const stopRecording = () => {
  voiceService.stopRecording()
  chatStore.setRecording(false)
}

// 播放消息语音
const speakMessage = (text) => {
  chatStore.setPlaying(true)
  voiceService.speak(text, () => {
    chatStore.setPlaying(false)
  })
}

// 清空聊天
const clearChat = () => {
  chatStore.clearMessages()
  voiceService.stopSpeaking()
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 监听消息变化，自动滚动
watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

onMounted(() => {
  // 添加欢迎消息
  chatStore.addMessage('您好！我是AI语音助手，支持文字和语音输入。请告诉我您需要什么帮助？', 'assistant')
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #f7f7f8;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  background: white;
  padding: 16px 20px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.message-actions {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.speak-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.speak-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.speak-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.input-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-input {
  width: 100%;
  min-height: 60px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  resize: none;
  outline: none;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.text-input:focus {
  border-color: #667eea;
}

.text-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-btn {
  background: #f0f0f0;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.voice-btn.recording {
  background: #ff4757;
  color: white;
  animation: pulse 1.5s infinite;
}

.voice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
    border-radius: 0;
  }
  
  .message {
    max-width: 90%;
  }
  
  .chat-header {
    padding: 16px;
  }
  
  .chat-header h1 {
    font-size: 20px;
  }
  
  .messages-container {
    padding: 16px;
  }
  
  .input-container {
    padding: 16px;
  }
}
</style>
