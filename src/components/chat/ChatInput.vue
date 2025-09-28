<template>
  <div class="input-container">
    <div class="input-wrapper">
      <textarea
        :value="inputText"
        @input="$emit('update:inputText', $event.target.value)"
        @keydown.enter.exact="$emit('send-message')"
        @keydown.shift.enter="handleShiftEnter"
        placeholder="输入您的魔法咒语或点击魔杖进行语音施法... (Enter发送，Shift+Enter换行)"
        :disabled="isLoading"
        class="text-input magic-textarea"
        rows="3"
      ></textarea>
      <div class="input-actions">
        <!-- 发送按钮 -->
        <el-button
          @click="$emit('send-message')"
          type="primary"
          :disabled="!inputText.trim() || isLoading"
          :loading="isLoading"
          :icon="ChatDotRound"
          class="send-button"
          circle
          :title="'发送消息'"
        />
        
        <!-- 语音输入按钮 -->
        <el-button
          @click="$emit('toggle-recording')"
          :type="isRecording ? 'danger' : 'default'"
          :icon="isRecording ? VideoPause : Microphone"
          :class="['voice-button', { 'is-recording': isRecording }]"
          circle
          :title="isRecording ? '停止录音' : '开始录音'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'
import { ChatDotRound, VideoPause, Microphone } from '@element-plus/icons-vue'

const props = defineProps({
  inputText: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isRecording: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message', 'toggle-recording', 'update:inputText'])

// 处理Shift+Enter（允许换行）
const handleShiftEnter = (event) => {
  event.preventDefault()
  const textarea = event.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = props.inputText
  
  // 在光标位置插入换行符
  const newValue = value.substring(0, start) + '\n' + value.substring(end)
  
  // 通过emit更新父组件的值
  emit('update:inputText', newValue)
  
  // 设置光标位置
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
    textarea.focus()
  })
}
</script>

<style scoped>
.input-container {
  padding: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.magic-textarea {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 15px;
  color: #654321;
  font-family: var(--font-magic-body);
  font-size: 16px;
  padding: 15px;
  resize: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 80px;
  outline: none;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.magic-textarea::-webkit-scrollbar {
  display: none;
}

.magic-textarea:focus {
  border-color: #8B4513;
  box-shadow: 0 0 20px rgba(139, 69, 19, 0.3);
}

.magic-textarea:disabled {
  background: rgba(255, 255, 255, 0.5);
  color: rgba(101, 67, 33, 0.5);
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.send-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  font-weight: 600;
  width: 50px;
  height: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.send-button:hover {
  background: linear-gradient(135deg, #FFD700, #D4AF37);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.send-button:disabled {
  background: rgba(212, 175, 55, 0.3);
  color: rgba(44, 24, 16, 0.5);
  transform: none;
  box-shadow: none;
}

.voice-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: 3px solid #D4AF37;
  color: #8B4513;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  font-weight: 600;
  animation: pulse 2s ease-in-out infinite;
  width: 50px;
  height: 50px;
}

.voice-button:hover {
  background: linear-gradient(135deg, #FFD700, #D4AF37);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
}

.voice-button.is-recording {
  background: linear-gradient(135deg, #DC143C, #B22222);
  border-color: #DC143C;
  color: #FFFFFF;
  animation: pulse-recording 1s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(220, 20, 60, 0.6);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-recording {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(220, 20, 60, 0.6);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(220, 20, 60, 0.8);
  }
}
</style>
