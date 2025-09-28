// 语音服务工具类 - 增强版
export class VoiceService {
  constructor() {
    this.recognition = null
    this.synthesis = null
    this.isSupported = false
    this.isRecording = false
    this.isSpeaking = false
    this.currentUtterance = null
    
    // 语音识别配置
    this.recognitionConfig = {
      continuous: false,
      interimResults: true,
      lang: 'zh-CN',
      maxAlternatives: 1
    }
    
    // 语音合成配置
    this.synthesisConfig = {
      lang: 'zh-CN',
      rate: 0.9,
      pitch: 1,
      volume: 1,
      voice: null
    }
    
    this.initSpeechRecognition()
    this.initSpeechSynthesis()
  }

  // 初始化语音识别
  initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      // 应用配置
      Object.assign(this.recognition, this.recognitionConfig)
      
      // 事件监听器
      this.recognition.onstart = () => {
        this.isRecording = true
        console.log('语音识别开始')
      }
      
      this.recognition.onend = () => {
        this.isRecording = false
        console.log('语音识别结束')
      }
      
      this.recognition.onerror = (event) => {
        this.isRecording = false
        console.error('语音识别错误:', event.error)
      }
      
      this.isSupported = true
    } else {
      console.warn('浏览器不支持语音识别')
    }
  }

  // 初始化语音合成
  initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      
      // 等待语音列表加载
      if (this.synthesis.getVoices().length === 0) {
        this.synthesis.addEventListener('voiceschanged', () => {
          this.selectBestVoice()
        })
      } else {
        this.selectBestVoice()
      }
    } else {
      console.warn('浏览器不支持语音合成')
    }
  }

  // 选择最佳语音
  selectBestVoice() {
    const voices = this.synthesis.getVoices()
    const chineseVoices = voices.filter(voice => 
      voice.lang.startsWith('zh') || voice.lang.includes('Chinese')
    )
    
    if (chineseVoices.length > 0) {
      // 优先选择中文语音
      this.synthesisConfig.voice = chineseVoices[0]
      console.log('选择语音:', this.synthesisConfig.voice.name)
    } else if (voices.length > 0) {
      // 如果没有中文语音，选择默认语音
      this.synthesisConfig.voice = voices[0]
      console.log('使用默认语音:', this.synthesisConfig.voice.name)
    }
  }

  // 开始录音 - 增强版
  startRecording(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('浏览器不支持语音识别'))
        return
      }

      if (this.isRecording) {
        reject(new Error('正在录音中，请先停止当前录音'))
        return
      }

      // 合并配置
      const config = { ...this.recognitionConfig, ...options }
      Object.assign(this.recognition, config)

      // 设置事件处理器
      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // 如果有最终结果，返回
        if (finalTranscript) {
          resolve({
            transcript: finalTranscript,
            confidence: event.results[event.results.length - 1][0].confidence,
            isFinal: true
          })
        } else if (interimTranscript && options.onInterimResult) {
          // 返回临时结果
          options.onInterimResult({
            transcript: interimTranscript,
            confidence: 0,
            isFinal: false
          })
        }
      }

      this.recognition.onerror = (event) => {
        this.isRecording = false
        reject(new Error(`语音识别错误: ${event.error}`))
      }

      this.recognition.onend = () => {
        this.isRecording = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        reject(new Error(`启动语音识别失败: ${error.message}`))
      }
    })
  }

  // 停止录音
  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop()
      this.isRecording = false
    }
  }

  // 播放语音 - 增强版
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('浏览器不支持语音合成'))
        return
      }

      // 停止当前播放
      this.stopSpeaking()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 应用配置
      Object.assign(utterance, this.synthesisConfig, options)

      // 事件监听
      utterance.onstart = () => {
        this.isSpeaking = true
        console.log('开始播放语音')
      }

      utterance.onend = () => {
        this.isSpeaking = false
        this.currentUtterance = null
        console.log('语音播放结束')
        resolve()
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        this.currentUtterance = null
        console.error('语音播放错误:', event.error)
        reject(new Error(`语音播放错误: ${event.error}`))
      }

      utterance.onpause = () => {
        console.log('语音播放暂停')
      }

      utterance.onresume = () => {
        console.log('语音播放恢复')
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    })
  }

  // 停止播放
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.isSpeaking = false
      this.currentUtterance = null
    }
  }

  // 暂停播放
  pauseSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause()
    }
  }

  // 恢复播放
  resumeSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.resume()
    }
  }

  // 检查是否支持语音功能
  isVoiceSupported() {
    return this.isSupported && this.synthesis
  }

  // 获取支持的语音列表
  getAvailableVoices() {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  // 设置语音识别语言
  setRecognitionLanguage(lang) {
    this.recognitionConfig.lang = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  // 设置语音合成语言
  setSynthesisLanguage(lang) {
    this.synthesisConfig.lang = lang
  }

  // 设置语音合成参数
  setSynthesisConfig(config) {
    Object.assign(this.synthesisConfig, config)
  }

  // 设置语音识别参数
  setRecognitionConfig(config) {
    Object.assign(this.recognitionConfig, config)
  }

  // 获取当前状态
  getStatus() {
    return {
      isRecording: this.isRecording,
      isSpeaking: this.isSpeaking,
      isSupported: this.isSupported,
      recognitionConfig: this.recognitionConfig,
      synthesisConfig: this.synthesisConfig
    }
  }

  // 销毁实例
  destroy() {
    this.stopRecording()
    this.stopSpeaking()
    this.recognition = null
    this.synthesis = null
  }
}
