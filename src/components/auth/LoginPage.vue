<template>
  <div class="login-container">
    <!-- 背景图片 -->
    <div class="background-image"></div>
    
    <!-- 登录框容器 -->
    <div class="login-form-container">
      <el-card class="login-card">
        <div class="login-header">
          <h1>霍格沃茨魔法学院</h1>
          <p>欢迎来到AI魔法助手</p>
        </div>
        
        <el-form 
          ref="loginFormRef"
          :model="form" 
          :rules="rules"
          @submit.prevent="handleLogin" 
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入您的魔法师姓名"
              :prefix-icon="User"
              :disabled="isLoading"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入您的魔法咒语"
              :prefix-icon="Lock"
              :disabled="isLoading"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="isLoading"
              :disabled="!form.username || !form.password"
              @click="handleLogin"
              block
            >
              {{ isLoading ? '施法中...' : '进入魔法世界' }}
            </el-button>
          </el-form-item>
          
          <div class="register-link">
            <span>还没有账号？</span>
            <el-link type="primary" @click="goToRegister">立即注册</el-link>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const loginFormRef = ref()

const isLoading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
  } catch {
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await authStore.login(form.username, form.password)
    
    if (result.success) {
      ElMessage.success(result.message)
      router.push('/chat')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('/images/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.login-form-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.login-card {
  width: 100%;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.login-card :deep(.el-card__body) {
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #D4AF37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.login-header p {
  margin: 0;
  font-size: 16px;
  color: #666;
  font-style: italic;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  background: transparent;
  border: 2px solid #D4AF37;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

.login-form :deep(.el-input__wrapper):hover {
  border-color: #6A0DAD;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #6A0DAD;
  background: transparent !important;
  box-shadow: none !important;
}

.login-form :deep(.el-input__inner) {
  background: transparent;
  border: none;
  color: #333;
  font-size: 16px;
  padding: 12px 16px;
}

.login-form :deep(.el-input__inner)::placeholder {
  color: #999;
}

.login-form :deep(.el-input__prefix) {
  color: #D4AF37;
}

.login-form :deep(.el-button) {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #D4AF37, #B8860B);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.login-form :deep(.el-button):hover:not(:disabled) {
  background: linear-gradient(135deg, #B8860B, #D4AF37);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.login-form :deep(.el-button):disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.register-link span {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    justify-content: center;
  }
  
  .login-form-container {
    max-width: 400px;
    padding: 20px;
  }
  
  .login-card :deep(.el-card__body) {
    padding: 30px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
  
  .login-header p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .login-form-container {
    max-width: 350px;
    padding: 15px;
  }
  
  .login-card :deep(.el-card__body) {
    padding: 25px;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
}
</style>