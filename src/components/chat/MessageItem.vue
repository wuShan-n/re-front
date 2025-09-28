<template>
  <div class="message" :class="message.type">
    <div class="message-content">
      <div class="message-bubble" :class="`magic-message-${message.type}`">
        <div class="message-text">
          <div v-if="isVoiceMessage()" class="voice-message">
            <el-icon class="voice-icon" size="16">
              <Microphone />
            </el-icon>
            <span class="voice-text">{{ message.content }}</span>
          </div>
          <div v-else v-html="renderMarkdown(message.content)"></div>
        </div>
        <div class="message-actions">
          <el-button
            @click="$emit('play-message', message)"
            :icon="getPlayIcon(message.id)"
            :type="isPlaying(message.id) ? 'danger' : 'default'"
            :class="['play-button', { 'is-playing': isPlaying(message.id) }]"
            circle
            size="small"
            :title="isPlaying(message.id) ? '停止播放' : '播放消息'"
          />
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { VideoPlay as Play, VideoPause as Stop, Microphone } from '@element-plus/icons-vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  playingMessageId: {
    type: String,
    default: null
  }
})

defineEmits(['play-message'])

// 检查是否是语音消息
const isVoiceMessage = () => {
  return props.message.content.includes('🎤') || props.message.content.includes('语音消息')
}

// 检查消息是否正在播放
const isPlaying = (messageId) => {
  return props.playingMessageId === messageId
}

// 获取播放按钮图标
const getPlayIcon = (messageId) => {
  return isPlaying(messageId) ? Stop : Play
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 简单的Markdown渲染函数
const renderMarkdown = (text) => {
  if (!text) return ''
  
  return text
    // 加粗文本 **text** 或 *text*
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 代码块 `code`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 换行处理
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message.system {
  align-items: center;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 15px 20px;
  border-radius: 20px;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.message-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.magic-message-user {
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: #F7F3E9;
  border: 2px solid #D4AF37;
}

.magic-message-assistant {
  background: rgba(255, 255, 255, 0.95);
  color: #654321;
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.message-text {
  font-family: var(--font-magic-body);
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

/* 语音消息样式 */
.voice-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  margin: 0;
}

.voice-icon {
  color: #D4AF37;
  flex-shrink: 0;
}

.voice-text {
  color: #8B4513;
  font-weight: 500;
}

.message-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.play-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(212, 175, 55, 0.3);
}

.play-button:hover {
  background: linear-gradient(135deg, #FFD700, #D4AF37);
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(212, 175, 55, 0.4);
}

.play-button.is-playing {
  background: linear-gradient(135deg, #DC143C, #B22222);
  color: #FFFFFF;
  animation: pulse-play 1s ease-in-out infinite;
}

@keyframes pulse-play {
  0%, 100% {
    box-shadow: 0 2px 6px rgba(220, 20, 60, 0.3);
  }
  50% {
    box-shadow: 0 3px 10px rgba(220, 20, 60, 0.6);
  }
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  font-family: var(--font-magic-body);
}

/* Markdown样式 */
.message-text strong {
  font-weight: 700;
  color: #D4AF37;
}

.message-text em {
  font-style: italic;
  color: #8B4513;
}

.message-text code {
  background: rgba(212, 175, 55, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #654321;
  border: 1px solid rgba(212, 175, 55, 0.2);
}
</style>
