// 音频播放服务 - 支持后端音频URL播放
export class AudioService {
  constructor() {
    this.currentAudio = null
    this.isPlaying = false
    this.currentMessageId = null
  }

  // 播放音频
  async playAudio(audioUrl, messageId = null) {
    try {
      // 停止当前播放
      this.stopAudio()

      // 验证音频URL
      if (!audioUrl) {
        throw new Error('音频URL为空')
      }

      console.log('尝试播放音频:', audioUrl)

      // 创建新的音频对象
      this.currentAudio = new Audio(audioUrl)
      this.currentMessageId = messageId
      this.isPlaying = true

      // 设置事件监听器
      this.currentAudio.onloadstart = () => {
        console.log('开始加载音频:', audioUrl)
      }

      this.currentAudio.oncanplay = () => {
        console.log('音频可以播放')
      }

      this.currentAudio.onplay = () => {
        console.log('开始播放音频')
        this.isPlaying = true
      }

      this.currentAudio.onended = () => {
        console.log('音频播放结束')
        this.isPlaying = false
        this.currentMessageId = null
        this.currentAudio = null
        // 通知外部播放完成
        if (this.onPlayEnd) {
          this.onPlayEnd(messageId)
        }
      }

      this.currentAudio.onerror = (error) => {
        console.error('音频播放错误:', error)
        console.error('音频URL:', audioUrl)
        console.error('音频对象状态:', {
          readyState: this.currentAudio.readyState,
          networkState: this.currentAudio.networkState,
          error: this.currentAudio.error
        })
        this.isPlaying = false
        this.currentMessageId = null
        this.currentAudio = null
        // 通知外部播放错误
        if (this.onPlayError) {
          this.onPlayError(messageId, error)
        }
        throw new Error('音频播放失败')
      }

      this.currentAudio.onpause = () => {
        console.log('音频播放暂停')
        this.isPlaying = false
      }

      // 开始播放
      await this.currentAudio.play()

    } catch (error) {
      console.error('播放音频失败:', error)
      this.isPlaying = false
      this.currentMessageId = null
      this.currentAudio = null
      throw error
    }
  }

  // 停止播放
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPlaying = false
    this.currentMessageId = null
  }

  // 暂停播放
  pauseAudio() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause()
    }
  }

  // 恢复播放
  resumeAudio() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play()
    }
  }

  // 检查是否正在播放指定消息
  isPlayingMessage(messageId) {
    return this.isPlaying && this.currentMessageId === messageId
  }

  // 检查是否正在播放
  isCurrentlyPlaying() {
    return this.isPlaying
  }

  // 获取当前播放的消息ID
  getCurrentMessageId() {
    return this.currentMessageId
  }
}

// 创建单例实例
export const audioService = new AudioService()
