<template>
  <div class="public-characters">
    <div class="page-header">
      <h1 class="page-title">公开角色</h1>
      <p class="page-subtitle">浏览和克隆其他用户创建的公开角色</p>
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="goBack"
        class="back-button"
      >
        返回聊天
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索角色名称或描述..."
        :prefix-icon="Search"
        @input="handleSearch"
        class="search-input"
      />
      <el-select
        v-model="selectedHouse"
        placeholder="选择学院"
        @change="handleFilter"
        class="house-filter"
        clearable
      >
        <el-option label="全部学院" value="" />
        <el-option label="格兰芬多" value="格兰芬多" />
        <el-option label="斯莱特林" value="斯莱特林" />
        <el-option label="拉文克劳" value="拉文克劳" />
        <el-option label="赫奇帕奇" value="赫奇帕奇" />
      </el-select>
    </div>

    <!-- 角色列表 -->
    <div class="characters-grid">
      <div 
        v-for="character in filteredCharacters" 
        :key="character.id"
        class="character-card"
      >
        <div class="character-avatar">
          <img 
            :src="character.avatar_url || '/头像.ico'" 
            :alt="character.name"
            @error="handleImageError"
          />
        </div>
        <div class="character-info">
          <h3 class="character-name">{{ character.name }}</h3>
          <p class="character-description">{{ character.description }}</p>
          <div class="character-meta">
            <span class="character-house" v-if="character.house">
              {{ character.house }}
            </span>
            <span class="character-role" v-if="character.role">
              {{ character.role }}
            </span>
            <span class="creator-info">
              创建者: {{ character.creator?.username || '未知' }}
            </span>
          </div>
        </div>
        <div class="character-actions">
          <el-button 
            type="success" 
            size="small" 
            @click="cloneCharacter(character)"
            :icon="CopyDocument"
            :loading="cloningCharacterId === character.id"
          >
            克隆
          </el-button>
          <el-button 
            type="primary" 
            size="small" 
            @click="viewCharacterDetails(character)"
            :icon="View"
          >
            详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredCharacters.length === 0" class="empty-state">
      <el-icon size="64" color="#8c939d"><UserFilled /></el-icon>
      <p>暂无公开角色</p>
      <p>请尝试调整搜索条件</p>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCharacters"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>

    <!-- 角色详情对话框 -->
    <el-dialog
      v-model="showCharacterDetails"
      :title="selectedCharacter?.name"
      width="600px"
      class="character-details-dialog"
    >
      <div v-if="selectedCharacter" class="character-details">
        <div class="details-header">
          <img 
            :src="selectedCharacter.avatar_url || '/头像.ico'" 
            :alt="selectedCharacter.name"
            class="details-avatar"
            @error="handleImageError"
          />
          <div class="details-info">
            <h3 class="details-name">{{ selectedCharacter.name }}</h3>
            <p class="details-description">{{ selectedCharacter.description }}</p>
            <div class="details-meta">
              <span class="details-house" v-if="selectedCharacter.house">
                {{ selectedCharacter.house }}
              </span>
              <span class="details-role" v-if="selectedCharacter.role">
                {{ selectedCharacter.role }}
              </span>
              <span class="details-creator">
                创建者: {{ selectedCharacter.creator?.username || '未知' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="details-content">
          <h4>角色详情</h4>
          <div class="detail-item">
            <span class="detail-label">TTS引擎:</span>
            <span class="detail-value">{{ selectedCharacter.tts_engine }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">音色ID:</span>
            <span class="detail-value">{{ selectedCharacter.voice_id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">知识库:</span>
            <span class="detail-value">{{ selectedCharacter.use_knowledge_base ? '已启用' : '未启用' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间:</span>
            <span class="detail-value">{{ formatTime(selectedCharacter.created_at) }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showCharacterDetails = false">关闭</el-button>
        <el-button 
          type="success" 
          @click="cloneSelectedCharacter"
          :loading="cloningCharacterId === selectedCharacter?.id"
        >
          克隆角色
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search, CopyDocument, View, UserFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { 
  getCharacters,
  cloneCharacter as cloneCharacterAPI
} from '@/services/harryPotterApi'

// 路由
const router = useRouter()

// 响应式数据
const characters = ref([])
const searchQuery = ref('')
const selectedHouse = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const totalCharacters = ref(0)
const cloningCharacterId = ref(null)
const showCharacterDetails = ref(false)
const selectedCharacter = ref(null)

// 计算属性
const filteredCharacters = computed(() => {
  let filtered = characters.value

  // 按学院筛选
  if (selectedHouse.value) {
    filtered = filtered.filter(char => char.house === selectedHouse.value)
  }

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(char => 
      char.name.toLowerCase().includes(query) ||
      char.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(totalCharacters.value / pageSize.value)
})

// 加载公开角色
const loadPublicCharacters = async () => {
  try {
    const response = await getCharacters(currentPage.value, pageSize.value, searchQuery.value, false)
    characters.value = response.items || response
    totalCharacters.value = response.total || characters.value.length
  } catch (error) {
    ElMessage.error('加载公开角色失败')
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadPublicCharacters()
}

// 筛选处理
const handleFilter = () => {
  // 筛选在客户端进行，不需要重新加载
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadPublicCharacters()
}

// 克隆角色
const cloneCharacter = async (character) => {
  try {
    cloningCharacterId.value = character.id
    
    const result = await ElMessageBox.prompt('请输入新角色名称', '克隆角色', {
      confirmButtonText: '克隆',
      cancelButtonText: '取消',
      inputValue: `${character.name} (副本)`,
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '请输入角色名称'
        }
        return true
      }
    })
    
    const newName = result.value.trim()
    await cloneCharacterAPI(character.id, newName)
    ElMessage.success('角色克隆成功')
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('克隆角色失败')
    }
  } finally {
    cloningCharacterId.value = null
  }
}

// 查看角色详情
const viewCharacterDetails = (character) => {
  selectedCharacter.value = character
  showCharacterDetails.value = true
}

// 克隆选中的角色
const cloneSelectedCharacter = async () => {
  if (selectedCharacter.value) {
    await cloneCharacter(selectedCharacter.value)
    showCharacterDetails.value = false
  }
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
  loadPublicCharacters()
})
</script>

<style scoped>
* {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}

/* 禁用所有按钮的点击效果 */
:deep(.el-button) {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}

:deep(.el-button:active) {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}

:deep(.el-button:focus) {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}

/* 禁用卡片内所有元素的动画 */
.character-card * {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}
.public-characters {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-image: url('/哈利波特背景.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
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

.search-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: center;
}

.search-input {
  width: 400px;
}

.house-filter {
  width: 200px;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 0;
  margin-bottom: 30px;
}

.character-card {
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(212, 175, 55, 0.8);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.character-card:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: #D4AF37;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.character-avatar {
  text-align: center;
  margin-bottom: 15px;
}

.character-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #D4AF37;
  object-fit: cover;
}

.character-info {
  text-align: center;
  margin-bottom: 15px;
}

.character-name {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 18px;
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
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.character-house,
.character-role,
.creator-info {
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.creator-info {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.character-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.pagination {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
}

.character-details-dialog :deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
}

.details-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.details-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #D4AF37;
  object-fit: cover;
}

.details-info {
  flex: 1;
}

.details-name {
  color: #654321;
  font-family: var(--font-magic-title);
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.details-description {
  color: #654321;
  font-family: var(--font-magic-body);
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 15px 0;
}

.details-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.details-house,
.details-role,
.details-creator {
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 500;
}

.details-creator {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.details-content h4 {
  color: #654321;
  font-family: var(--font-magic-title);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.detail-label {
  color: #654321;
  font-weight: 600;
}

.detail-value {
  color: #D4AF37;
  font-weight: 500;
}
</style>
