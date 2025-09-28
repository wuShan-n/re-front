<template>
  <div class="voice-sample-management">
    <div class="page-header">
      <h1 class="page-title">音色样本管理</h1>
      <p class="page-subtitle">为角色上传和管理音色样本</p>
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="goBack"
        class="back-button"
      >
        返回聊天
      </el-button>
    </div>

    <!-- 角色选择 -->
    <div class="character-selector">
      <el-select 
        v-model="selectedCharacterId" 
        placeholder="选择角色"
        @change="loadCharacterInfo"
        class="character-select"
      >
        <el-option
          v-for="character in characters"
          :key="character.id"
          :label="character.name"
          :value="character.id"
        />
      </el-select>
    </div>

    <!-- 角色信息 -->
    <div v-if="selectedCharacter" class="character-info-card">
      <div class="character-avatar">
        <img 
          :src="selectedCharacter.avatar_url || '/头像.ico'" 
          :alt="selectedCharacter.name"
          @error="handleImageError"
        />
      </div>
      <div class="character-details">
        <h3 class="character-name">{{ selectedCharacter.name }}</h3>
        <p class="character-description">{{ selectedCharacter.description }}</p>
        <div class="character-meta">
          <span class="tts-engine">TTS引擎: {{ selectedCharacter.tts_engine }}</span>
          <span class="voice-id">音色ID: {{ selectedCharacter.voice_id }}</span>
        </div>
      </div>
    </div>

    <!-- 音色样本上传 -->
    <div v-if="selectedCharacter" class="voice-upload-section">
      <h3 class="section-title">上传音色样本</h3>
      <p class="section-description">
        上传音频文件来定制角色的音色。支持 WAV、MP3、WEBM、M4A 格式。
        上传后系统会自动切换到 IndexTTS2 引擎。
      </p>
      
      <el-upload
        class="voice-uploader"
        drag
        :before-upload="beforeVoiceUpload"
        :http-request="uploadVoiceSample"
        :show-file-list="false"
        accept=".wav,.mp3,.webm,.m4a"
      >
        <el-icon class="el-icon--upload"><Microphone /></el-icon>
        <div class="el-upload__text">
          将音频文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 WAV、MP3、WEBM、M4A 格式，文件大小不超过 50MB
          </div>
        </template>
      </el-upload>
    </div>

    <!-- 上传历史 -->
    <div v-if="selectedCharacter && voiceSamples.length > 0" class="voice-samples-section">
      <h3 class="section-title">音色样本历史</h3>
      <div class="voice-samples-list">
        <div 
          v-for="sample in voiceSamples" 
          :key="sample.id"
          class="voice-sample-card"
        >
          <div class="sample-info">
            <h4 class="sample-name">{{ sample.filename || '音色样本' }}</h4>
            <p class="sample-meta">
              <span class="sample-size">{{ formatFileSize(sample.size) }}</span>
              <span class="sample-date">{{ formatTime(sample.created_at) }}</span>
            </p>
          </div>
          <div class="sample-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="playSample(sample)"
              :icon="VideoPlay"
            >
              播放
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteSample(sample)"
              :icon="Delete"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="selectedCharacter && voiceSamples.length === 0" class="empty-state">
      <el-icon size="64" color="#8c939d"><Microphone /></el-icon>
      <p>该角色暂无音色样本</p>
      <p>请上传音频文件来定制音色</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Microphone, VideoPlay, Delete } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { 
  getMyCharacters,
  uploadVoiceSample as uploadVoiceSampleAPI
} from '@/services/harryPotterApi'

// 路由
const router = useRouter()

// 响应式数据
const characters = ref([])
const selectedCharacterId = ref(null)
const selectedCharacter = ref(null)
const voiceSamples = ref([])
const uploading = ref(false)

// 加载角色列表
const loadCharacters = async () => {
  try {
    characters.value = await getMyCharacters()
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

// 加载角色信息
const loadCharacterInfo = async () => {
  if (!selectedCharacterId.value) return
  
  try {
    const character = characters.value.find(c => c.id === selectedCharacterId.value)
    selectedCharacter.value = character
    
    // 这里可以添加加载音色样本历史的逻辑
    // voiceSamples.value = await getVoiceSamples(selectedCharacterId.value)
  } catch (error) {
    ElMessage.error('加载角色信息失败')
  }
}

// 上传前检查
const beforeVoiceUpload = (file) => {
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/mp4']
  const isAllowedType = allowedTypes.includes(file.type) || 
    file.name.toLowerCase().match(/\.(wav|mp3|webm|m4a)$/)
  const isLt50M = file.size / 1024 / 1024 < 50

  if (!isAllowedType) {
    ElMessage.error('只支持 WAV、MP3、WEBM、M4A 格式的音频文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }
  return true
}

// 上传音色样本
const uploadVoiceSample = async (options) => {
  try {
    uploading.value = true
    
    const response = await uploadVoiceSampleAPI(selectedCharacterId.value, options.file)
    
    ElMessage.success('音色样本上传成功')
    
    // 更新角色信息
    await loadCharacterInfo()
    
    // 这里可以添加刷新音色样本列表的逻辑
    // await loadVoiceSamples()
    
  } catch (error) {
    ElMessage.error('上传音色样本失败')
  } finally {
    uploading.value = false
  }
}

// 播放音色样本
const playSample = (sample) => {
  // 这里可以添加播放音频的逻辑
  ElMessage.info('播放功能待实现')
}

// 删除音色样本
const deleteSample = async (sample) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除音色样本"${sample.filename}"吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 这里可以添加删除音色样本的API调用
    // await deleteVoiceSample(sample.id)
    
    ElMessage.success('音色样本删除成功')
    await loadCharacterInfo()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除音色样本失败')
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = '/头像.ico'
}

// 返回聊天界面
const goBack = () => {
  router.push('/chat')
}

// 组件挂载时加载数据
onMounted(() => {
  loadCharacters()
})
</script>

<style scoped>
* {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}
.voice-sample-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.back-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  font-weight: 600;
}

.page-title {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
}

.page-subtitle {
  color: #FFFFFF;
  font-family: var(--font-magic-body);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  text-align: center;
}

.character-selector {
  margin-bottom: 30px;
  text-align: center;
}

.character-select {
  width: 300px;
}

.character-info-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.character-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #D4AF37;
  object-fit: cover;
}

.character-details {
  flex: 1;
}

.character-name {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.character-description {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 10px 0;
}

.character-meta {
  display: flex;
  gap: 15px;
}

.tts-engine,
.voice-id {
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.voice-upload-section,
.voice-samples-section {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.section-description {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.voice-uploader .el-upload-dragger {
  width: 100%;
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed #D4AF37;
  border-radius: 10px;
}

.voice-uploader .el-icon--upload {
  font-size: 48px;
  color: #D4AF37;
  margin-bottom: 16px;
}

.voice-uploader .el-upload__text {
  color: #F7F3E9;
  font-size: 16px;
}

.voice-uploader .el-upload__tip {
  color: #8c939d;
  font-size: 14px;
  margin-top: 10px;
}

.voice-samples-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.voice-sample-card {
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sample-info {
  flex: 1;
}

.sample-name {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.sample-meta {
  color: #D4AF37;
  font-size: 12px;
  margin: 0;
}

.sample-meta span {
  margin-right: 15px;
}

.sample-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8c939d;
}

.empty-state p {
  margin: 10px 0;
  font-family: var(--font-magic-body);
}
</style>
