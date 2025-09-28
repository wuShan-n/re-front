import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const isLoading = ref(false)
  const isRecording = ref(false)
  const isPlaying = ref(false)

  // 添加消息
  const addMessage = (content, type = 'user', id = null, audioUrl = null) => {
    const message = {
      id: id || String(Date.now() + Math.random()),
      content,
      type, // 'user' 或 'assistant'
      timestamp: new Date(),
      audioUrl // 添加音频URL字段
    }
    messages.value.push(message)
  }

  // 更新消息内容
  const updateMessage = (messageId, newContent = null, audioUrl = null) => {
    const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex > -1) {
      const message = messages.value[messageIndex]
      if (newContent !== null) {
        message.content = newContent
      }
      if (audioUrl !== null) {
        message.audioUrl = audioUrl
      }
      // 强制触发响应式更新
      messages.value = [...messages.value]
    }
  }

  // 删除消息
  const removeMessage = (messageId) => {
    const index = messages.value.findIndex(msg => msg.id === messageId)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  // 设置加载状态
  const setLoading = (loading) => {
    isLoading.value = loading
  }

  // 设置录音状态
  const setRecording = (recording) => {
    isRecording.value = recording
  }

  // 设置播放状态
  const setPlaying = (playing) => {
    isPlaying.value = playing
  }

  // 清空聊天记录
  const clearMessages = () => {
    messages.value = []
  }

  // 设置消息列表
  const setMessages = (newMessages) => {
    messages.value = newMessages
  }

  return {
    messages,
    isLoading,
    isRecording,
    isPlaying,
    addMessage,
    updateMessage,
    removeMessage,
    setLoading,
    setRecording,
    setPlaying,
    clearMessages,
    setMessages
  }
})
