<template>
  <div class="knowledge-management">
    <div class="page-header">
      <h1 class="page-title">知识库管理</h1>
      <p class="page-subtitle">为角色创建和管理知识库</p>
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="goBack"
        class="back-button"
      >
        返回聊天
      </el-button>
    </div>

    <!-- 标签页切换 -->
    <div class="tab-container">
      <el-tabs v-model="currentTab" @tab-change="handleTabChange">
        <el-tab-pane label="角色知识库" name="character">
          <!-- 角色选择 -->
          <div class="character-selector">
            <el-select 
              v-model="selectedCharacterId" 
              placeholder="选择角色"
              @change="loadCharacterKnowledgeDocuments"
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

          <!-- 操作按钮 -->
          <div class="action-bar" v-if="selectedCharacterId">
            <el-button 
              type="primary" 
              :icon="Upload" 
              @click="showUploadDialog = true"
              class="upload-button"
            >
              上传文档
            </el-button>
            <el-button 
              type="success" 
              :icon="Link" 
              @click="showLinkDialog = true"
              class="link-button"
            >
              关联文档
            </el-button>
          </div>

          <!-- 知识库文档列表 -->
          <div class="knowledge-list" v-if="selectedCharacterId">
            <div 
              v-for="document in knowledgeDocuments" 
              :key="document.id"
              class="knowledge-card"
            >
              <div class="document-info">
                <h3 class="document-title">{{ document.title }}</h3>
                <p class="document-meta">
                  <span class="document-type">{{ document.source_type }}</span>
                  <span class="created-time">{{ formatTime(document.created_at) }}</span>
                </p>
                <p class="document-description" v-if="document.description">
                  {{ document.description }}
                </p>
              </div>
              <div class="document-actions">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="unlinkDocument(document)"
                  :icon="Close"
                >
                  解除关联
                </el-button>
              </div>
            </div>
            
            <div v-if="knowledgeDocuments.length === 0" class="empty-state">
              <el-icon size="64" color="#8c939d"><Document /></el-icon>
              <p>该角色暂无关联的知识库文档</p>
              <p>请上传文档或关联现有文档</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的文档" name="my">
          <div class="action-bar">
            <el-button 
              type="primary" 
              :icon="Upload" 
              @click="showUploadDialog = true"
              class="upload-button"
            >
              上传文档
            </el-button>
          </div>

          <div class="knowledge-list">
            <div 
              v-for="document in myDocuments" 
              :key="document.id"
              class="knowledge-card"
            >
              <div class="document-info">
                <h3 class="document-title">{{ document.title }}</h3>
                <p class="document-meta">
                  <span class="document-type">{{ document.source_type }}</span>
                  <span class="visibility">{{ document.is_public ? '公开' : '私有' }}</span>
                  <span class="created-time">{{ formatTime(document.created_at) }}</span>
                </p>
                <p class="document-description" v-if="document.description">
                  {{ document.description }}
                </p>
              </div>
              <div class="document-actions">
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="toggleVisibility(document)"
                  :icon="document.is_public ? Lock : Unlock"
                >
                  {{ document.is_public ? '设为私有' : '设为公开' }}
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteDocument(document)"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </div>
            
            <div v-if="myDocuments.length === 0" class="empty-state">
              <el-icon size="64" color="#8c939d"><Document /></el-icon>
              <p>暂无知识库文档</p>
              <p>请上传文档</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="公开文档" name="public">
          <div class="knowledge-list">
            <div 
              v-for="document in publicDocuments" 
              :key="document.id"
              class="knowledge-card"
            >
              <div class="document-info">
                <h3 class="document-title">{{ document.title }}</h3>
                <p class="document-meta">
                  <span class="document-type">{{ document.source_type }}</span>
                  <span class="creator">创建者: {{ document.creator?.username || '未知' }}</span>
                  <span class="created-time">{{ formatTime(document.created_at) }}</span>
                </p>
                <p class="document-description" v-if="document.description">
                  {{ document.description }}
                </p>
              </div>
              <div class="document-actions">
                <el-button 
                  type="success" 
                  size="small" 
                  @click="linkToCharacter(document)"
                  :icon="Link"
                >
                  关联到角色
                </el-button>
              </div>
            </div>
            
            <div v-if="publicDocuments.length === 0" class="empty-state">
              <el-icon size="64" color="#8c939d"><Document /></el-icon>
              <p>暂无公开的知识库文档</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 上传文档对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传知识库文档"
      width="500px"
      class="upload-dialog"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文档描述">
          <el-input 
            v-model="uploadForm.description" 
            placeholder="请输入文档描述（可选）"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="可见性">
          <el-switch
            v-model="uploadForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          />
        </el-form-item>
      </el-form>
      
      <el-upload
        class="upload-dragger"
        drag
        :before-upload="beforeUpload"
        :http-request="uploadDocument"
        :show-file-list="false"
        accept=".pdf,.txt,.docx"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、TXT、DOCX 格式，文件大小不超过 10MB
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Edit, Delete, Document, UploadFilled, ArrowLeft, Link, Close, Lock, Unlock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { 
  getCharacters,
  uploadKnowledgeDocument,
  getMyKnowledgeDocuments,
  getPublicKnowledgeDocuments,
  linkKnowledgeToCharacter,
  unlinkKnowledgeFromCharacter,
  getCharacterKnowledgeDocuments,
  deleteKnowledgeDocument
} from '@/services/harryPotterApi'

// 路由
const router = useRouter()

// 响应式数据
const characters = ref([])
const selectedCharacterId = ref(null)
const knowledgeDocuments = ref([])
const myDocuments = ref([])
const publicDocuments = ref([])
const showUploadDialog = ref(false)
const showLinkDialog = ref(false)
const currentTab = ref('character') // character, my, public

// 表单数据
const uploadForm = reactive({
  description: '',
  isPublic: true
})

// 加载角色列表
const loadCharacters = async () => {
  try {
    characters.value = await getCharacters()
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

// 加载角色知识库文档
const loadCharacterKnowledgeDocuments = async () => {
  if (!selectedCharacterId.value) return
  
  try {
    knowledgeDocuments.value = await getCharacterKnowledgeDocuments(selectedCharacterId.value)
  } catch (error) {
    ElMessage.error('加载角色知识库文档失败')
  }
}

// 加载我的文档
const loadMyDocuments = async () => {
  try {
    myDocuments.value = await getMyKnowledgeDocuments()
  } catch (error) {
    ElMessage.error('加载我的文档失败')
  }
}

// 加载公开文档
const loadPublicDocuments = async () => {
  try {
    publicDocuments.value = await getPublicKnowledgeDocuments()
  } catch (error) {
    ElMessage.error('加载公开文档失败')
  }
}

// 标签页切换
const handleTabChange = (tabName) => {
  if (tabName === 'my') {
    loadMyDocuments()
  } else if (tabName === 'public') {
    loadPublicDocuments()
  }
}

// 上传文档
const uploadDocument = async (options) => {
  try {
    await uploadKnowledgeDocument(
      options.file, 
      uploadForm.description, 
      uploadForm.isPublic
    )
    ElMessage.success('文档上传成功')
    showUploadDialog.value = false
    uploadForm.description = ''
    uploadForm.isPublic = true
    
    // 刷新当前标签页的数据
    if (currentTab.value === 'my') {
      await loadMyDocuments()
    } else if (currentTab.value === 'public') {
      await loadPublicDocuments()
    }
  } catch (error) {
    ElMessage.error('上传文档失败')
  }
}

// 解除文档关联
const unlinkDocument = async (document) => {
  try {
    await ElMessageBox.confirm(
      `确定要解除文档"${document.title}"的关联吗？`,
      '确认解除关联',
      {
        confirmButtonText: '解除关联',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await unlinkKnowledgeFromCharacter(selectedCharacterId.value, document.id)
    ElMessage.success('解除关联成功')
    await loadCharacterKnowledgeDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('解除关联失败')
    }
  }
}

// 删除文档
const deleteDocument = async (document) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档"${document.title}"吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await deleteKnowledgeDocument(document.id)
    ElMessage.success('文档删除成功')
    await loadMyDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除文档失败')
    }
  }
}

// 切换文档可见性
const toggleVisibility = async (document) => {
  try {
    const newVisibility = !document.is_public
    await updateKnowledgeDocumentVisibility(document.id, newVisibility)
    ElMessage.success(`文档已设为${newVisibility ? '公开' : '私有'}`)
    await loadMyDocuments()
  } catch (error) {
    ElMessage.error('更新文档可见性失败')
  }
}

// 关联文档到角色
const linkToCharacter = async (document) => {
  if (!selectedCharacterId.value) {
    ElMessage.warning('请先选择角色')
    return
  }
  
  try {
    await linkKnowledgeToCharacter(selectedCharacterId.value, document.id)
    ElMessage.success('文档关联成功')
    await loadCharacterKnowledgeDocuments()
  } catch (error) {
    ElMessage.error('关联文档失败')
  }
}

// 上传前检查
const beforeUpload = (file) => {
  const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const isAllowedType = allowedTypes.includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isAllowedType) {
    ElMessage.error('只支持 PDF、TXT、DOCX 格式的文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
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
.knowledge-card * {
  transform: none !important;
  transition: none !important;
  animation: none !important;
}
.knowledge-management {
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

.character-selector {
  margin-bottom: 30px;
  text-align: center;
}

.character-select {
  width: 300px;
}

.action-bar {
  margin-bottom: 30px;
  text-align: center;
}

.upload-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  font-weight: 600;
  margin-right: 10px;
}

.manual-button {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  border: none;
  color: #fff;
  font-weight: 600;
}

.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 0;
}

.knowledge-card {
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(212, 175, 55, 0.8);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.knowledge-card:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: #D4AF37;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.document-info {
  margin-bottom: 15px;
}

.document-title {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.document-meta {
  color: #D4AF37;
  font-size: 12px;
  margin: 0 0 10px 0;
}

.document-meta span {
  margin-right: 15px;
}

.document-content {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.document-actions {
  text-align: right;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #8c939d;
}

.empty-state p {
  margin: 10px 0;
  font-family: var(--font-magic-body);
}

.upload-dragger {
  width: 100%;
}

.upload-dragger .el-upload-dragger {
  width: 100%;
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed #D4AF37;
  border-radius: 10px;
}

.upload-dragger .el-icon--upload {
  font-size: 48px;
  color: #D4AF37;
  margin-bottom: 16px;
}

.upload-dragger .el-upload__text {
  color: #F7F3E9;
  font-size: 16px;
}

.upload-dragger .el-upload__tip {
  color: #8c939d;
  font-size: 14px;
  margin-top: 10px;
}
</style>

