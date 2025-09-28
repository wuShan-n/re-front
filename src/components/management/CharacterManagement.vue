<template>
  <div class="character-management">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <p class="page-subtitle">创建和管理魔法世界的角色</p>
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="goBack"
        class="back-button"
      >
        返回聊天
      </el-button>
    </div>

    <!-- 创建角色按钮 -->
    <div class="action-bar">
      <el-button 
        type="primary" 
        :icon="Plus" 
        @click="showCreateDialog = true"
        class="create-button"
      >
        创建新角色
      </el-button>
    </div>

    <!-- 角色列表 -->
    <div class="character-grid">
      <div 
        v-for="character in characters" 
        :key="character.id"
        class="character-card"
      >
        <div class="character-avatar">
          <img 
            :src="getAvatarUrl(character)" 
            :alt="character.name"
            loading="lazy"
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
          </div>
        </div>
        <div class="character-actions">
          <el-button 
            type="primary" 
            size="small" 
            @click="editCharacter(character)"
            :icon="Edit"
          >
            编辑
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            @click="cloneCharacter(character)"
            :icon="CopyDocument"
          >
            克隆
          </el-button>
          <el-button 
            type="warning" 
            size="small" 
            @click="toggleVisibility(character)"
            :icon="character.is_public ? Lock : Unlock"
          >
            {{ character.is_public ? '设为私有' : '设为公开' }}
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="deleteCharacter(character)"
            :icon="Delete"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingCharacter ? '编辑角色' : '创建角色'"
      width="600px"
      class="character-dialog"
    >
      <el-form
        ref="characterForm"
        :model="characterForm"
        :rules="characterRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="characterForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="characterForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        
        <el-form-item label="学院" prop="house">
          <el-select v-model="characterForm.house" placeholder="选择学院">
            <el-option label="格兰芬多" value="格兰芬多" />
            <el-option label="斯莱特林" value="斯莱特林" />
            <el-option label="拉文克劳" value="拉文克劳" />
            <el-option label="赫奇帕奇" value="赫奇帕奇" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-input v-model="characterForm.role" placeholder="如：学生、教授、管理员" />
        </el-form-item>
        
        <el-form-item label="性格特点" prop="personality">
          <el-input 
            v-model="characterForm.personality" 
            type="textarea" 
            :rows="2"
            placeholder="描述角色的性格特点"
          />
        </el-form-item>
        
        <el-form-item label="能力技能" prop="abilities">
          <el-input 
            v-model="characterForm.abilities" 
            type="textarea" 
            :rows="2"
            placeholder="描述角色的能力技能"
          />
        </el-form-item>
        
        <el-form-item label="别名" prop="aliases">
          <el-input v-model="characterForm.aliases" placeholder="用逗号分隔多个别名" />
        </el-form-item>
        
        <el-form-item label="可见性" prop="is_public">
          <el-switch
            v-model="characterForm.is_public"
            active-text="公开"
            inactive-text="私有"
          />
        </el-form-item>
        
        <el-form-item label="头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="uploadAvatar"
          >
            <img v-if="characterForm.avatar_url" :src="characterForm.avatar_url" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveCharacter"
          :loading="saving"
        >
          {{ editingCharacter ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, ArrowLeft, CopyDocument, Lock, Unlock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { 
  getMyCharacters, 
  createCharacter, 
  updateCharacter, 
  deleteCharacter as deleteCharacterAPI,
  uploadCharacterAvatar,
  cloneCharacter as cloneCharacterAPI,
  toggleCharacterVisibility
} from '@/services/harryPotterApi'

// 路由
const router = useRouter()

// 响应式数据
const characters = ref([])
const showCreateDialog = ref(false)
const editingCharacter = ref(null)
const saving = ref(false)

// 表单数据
const characterForm = reactive({
  name: '',
  description: '',
  house: '',
  role: '',
  personality: '',
  abilities: '',
  aliases: '',
  avatar_url: '',
  is_public: true
})

// 表单验证规则
const characterRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ]
}

// 加载角色列表
const loadCharacters = async () => {
  try {
    const data = await getMyCharacters()
    // 检查数据是否真的发生了变化
    if (JSON.stringify(characters.value) !== JSON.stringify(data)) {
      characters.value = data
    }
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

// 编辑角色
const editCharacter = (character) => {
  editingCharacter.value = character
  Object.assign(characterForm, {
    name: character.name,
    description: character.description,
    house: character.house,
    role: character.role,
    personality: character.personality,
    abilities: character.abilities,
    aliases: character.aliases?.join(', ') || '',
    avatar_url: character.avatar_url,
    is_public: character.is_public
  })
  showCreateDialog.value = true
}

// 克隆角色
const cloneCharacter = async (character) => {
  try {
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
    await loadCharacters()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('克隆角色失败')
    }
  }
}

// 切换角色可见性
const toggleVisibility = async (character) => {
  try {
    const newVisibility = !character.is_public
    const action = newVisibility ? '公开' : '私有'
    
    await ElMessageBox.confirm(
      `确定要将角色"${character.name}"设为${action}吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await toggleCharacterVisibility(character.id, newVisibility)
    ElMessage.success(`角色已设为${action}`)
    await loadCharacters()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('切换角色可见性失败')
    }
  }
}

// 保存角色
const saveCharacter = async () => {
  try {
    saving.value = true
    
    const characterData = {
      ...characterForm,
      aliases: characterForm.aliases ? characterForm.aliases.split(',').map(s => s.trim()) : []
    }
    
    if (editingCharacter.value) {
      await updateCharacter(editingCharacter.value.id, characterData)
      ElMessage.success('角色更新成功')
    } else {
      await createCharacter(characterData)
      ElMessage.success('角色创建成功')
    }
    
    showCreateDialog.value = false
    await loadCharacters()
  } catch (error) {
    ElMessage.error('保存角色失败')
  } finally {
    saving.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  showCreateDialog.value = false
  editingCharacter.value = null
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(characterForm, {
    name: '',
    description: '',
    house: '',
    role: '',
    personality: '',
    abilities: '',
    aliases: '',
    avatar_url: '',
    is_public: true
  })
}

// 头像上传前检查
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 上传头像
const uploadAvatar = async (options) => {
  try {
    const response = await uploadCharacterAvatar(editingCharacter.value?.id || 'new', options.file)
    characterForm.avatar_url = response.avatar_url
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

// 处理图片加载错误
// 获取头像URL，确保始终返回有效URL
const getAvatarUrl = (character) => {
  if (character.avatar_url && character.avatar_url.trim() !== '') {
    return character.avatar_url
  }
  return '/头像.ico'
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
/* 强制禁用所有动画和变换 */
*, *::before, *::after {
  transform: none !important;
  transition: none !important;
  animation: none !important;
  transform-origin: initial !important;
  will-change: auto !important;
}

/* 禁用所有按钮的点击效果 */
:deep(.el-button),
:deep(.el-button:active),
:deep(.el-button:focus),
:deep(.el-button:hover),
:deep(.el-button:visited) {
  transform: none !important;
  transition: none !important;
  animation: none !important;
  transform-origin: initial !important;
  will-change: auto !important;
}

/* 禁用卡片内所有元素的动画 */
.character-card,
.character-card *,
.character-card *::before,
.character-card *::after {
  transform: none !important;
  transition: none !important;
  animation: none !important;
  transform-origin: initial !important;
  will-change: auto !important;
}

/* 禁用Element Plus组件的所有动画 */
:deep(.el-card),
:deep(.el-card__body),
:deep(.el-card__header),
:deep(.el-icon),
:deep(.el-tag),
:deep(.el-switch) {
  transform: none !important;
  transition: none !important;
  animation: none !important;
  transform-origin: initial !important;
  will-change: auto !important;
}
.character-management {
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

.action-bar {
  margin-bottom: 30px;
  text-align: right;
}

.create-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  font-weight: 600;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 0;
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
  margin-bottom: 8px;
}

.character-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #D4AF37;
  object-fit: cover;
}

.character-info {
  text-align: center;
  margin-bottom: 8px;
}

.character-name {
  color: #FFD700;
  font-family: var(--font-magic-title);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.character-description {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 12px;
  line-height: 1.3;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-meta {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
}

.character-house,
.character-role,
.character-visibility {
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.character-visibility.public {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.character-visibility.private {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

.character-actions {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
}

.character-dialog {
  background: rgba(0, 0, 0, 0.9);
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  object-fit: cover;
}
</style>
