<template>
  <div class="register-container">
    <!-- 背景图片 -->
    <div class="background-image"></div>
    
    <!-- 注册框容器 -->
    <div class="register-form-container">
      <el-card class="register-card">
        <div class="register-header">
          <h1>霍格沃茨魔法学院</h1>
          <p>加入我们的魔法世界</p>
        </div>
        
        <el-form 
          ref="registerFormRef"
          :model="form" 
          :rules="rules"
          @submit.prevent="handleRegister" 
          class="register-form"
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
          
          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入您的邮箱地址"
              :prefix-icon="Message"
              :disabled="isLoading"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请设置您的魔法咒语"
              :prefix-icon="Lock"
              :disabled="isLoading"
              show-password
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次确认您的魔法咒语"
              :prefix-icon="Lock"
              :disabled="isLoading"
              show-password
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          
          <el-form-item prop="agreement">
            <el-checkbox v-model="form.agreement" :disabled="isLoading">
              我已阅读并同意
              <el-link type="primary" @click="showAgreement">《用户协议》</el-link>
              和
              <el-link type="primary" @click="showPrivacy">《隐私政策》</el-link>
            </el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="isLoading"
              :disabled="!isFormValid"
              @click="handleRegister"
              block
            >
              {{ isLoading ? '注册中...' : '加入魔法学院' }}
            </el-button>
          </el-form-item>
          
          <div class="login-link">
            <span>已有账号？</span>
            <el-link type="primary" @click="goToLogin">立即登录</el-link>
          </div>
        </el-form>
      </el-card>
    </div>
    
    <!-- 用户协议对话框 -->
    <el-dialog
      v-model="showAgreementDialog"
      title="用户协议"
      width="80%"
      :before-close="closeAgreementDialog"
    >
      <div class="agreement-content">
        <h3>霍格沃茨魔法学院用户协议</h3>
        <p>欢迎加入霍格沃茨魔法学院！在使用我们的服务之前，请仔细阅读以下条款：</p>
        
        <h4>1. 服务说明</h4>
        <p>本平台提供AI魔法助手服务，帮助您体验魔法世界的魅力。</p>
        
        <h4>2. 用户责任</h4>
        <p>用户应当遵守相关法律法规，不得利用本平台进行违法活动。</p>
        
        <h4>3. 隐私保护</h4>
        <p>我们重视您的隐私，会妥善保护您的个人信息。</p>
        
        <h4>4. 服务变更</h4>
        <p>我们保留随时修改或终止服务的权利。</p>
      </div>
      <template #footer>
        <el-button @click="closeAgreementDialog">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 隐私政策对话框 -->
    <el-dialog
      v-model="showPrivacyDialog"
      title="隐私政策"
      width="80%"
      :before-close="closePrivacyDialog"
    >
      <div class="privacy-content">
        <h3>霍格沃茨魔法学院隐私政策</h3>
        <p>我们深知隐私对您的重要性，因此制定了以下隐私保护政策：</p>
        
        <h4>1. 信息收集</h4>
        <p>我们仅收集必要的用户信息，包括用户名、邮箱等基本信息。</p>
        
        <h4>2. 信息使用</h4>
        <p>您的信息仅用于提供服务，不会用于其他商业目的。</p>
        
        <h4>3. 信息保护</h4>
        <p>我们采用先进的安全技术保护您的信息安全。</p>
        
        <h4>4. 信息共享</h4>
        <p>未经您的同意，我们不会与第三方分享您的个人信息。</p>
      </div>
      <template #footer>
        <el-button @click="closePrivacyDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const registerFormRef = ref()

const isLoading = ref(false)
const showAgreementDialog = ref(false)
const showPrivacyDialog = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  agreement: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请阅读并同意用户协议和隐私政策'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})

const isFormValid = computed(() => {
  return form.username && 
         form.email && 
         form.password && 
         form.confirmPassword && 
         form.agreement &&
         form.password === form.confirmPassword
})

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
  } catch {
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await authStore.register(form.username, form.email, form.password)
    
    if (result.success) {
      ElMessage.success(result.message)
      router.push('/login')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('注册失败，请稍后重试')
    console.error('Register error:', error)
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const showAgreement = () => {
  showAgreementDialog.value = true
}

const showPrivacy = () => {
  showPrivacyDialog.value = true
}

const closeAgreementDialog = () => {
  showAgreementDialog.value = false
}

const closePrivacyDialog = () => {
  showPrivacyDialog.value = false
}
</script>

<style scoped>
.register-container {
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

.register-form-container {
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

.register-card {
  width: 100%;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.register-card :deep(.el-card__body) {
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #D4AF37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.register-header p {
  margin: 0;
  font-size: 16px;
  color: #666;
  font-style: italic;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  background: transparent;
  border: 2px solid #D4AF37;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

.register-form :deep(.el-input__wrapper):hover {
  border-color: #6A0DAD;
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #6A0DAD;
  background: transparent !important;
  box-shadow: none !important;
}

.register-form :deep(.el-input__inner) {
  background: transparent;
  border: none;
  color: #333;
  font-size: 16px;
  padding: 12px 16px;
}

.register-form :deep(.el-input__inner)::placeholder {
  color: #999;
}

.register-form :deep(.el-input__prefix) {
  color: #D4AF37;
}

.register-form :deep(.el-checkbox) {
  color: #666;
}

.register-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #D4AF37;
  border-color: #D4AF37;
}

.register-form :deep(.el-button) {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #D4AF37, #B8860B);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.register-form :deep(.el-button):hover:not(:disabled) {
  background: linear-gradient(135deg, #B8860B, #D4AF37);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.register-form :deep(.el-button):disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.login-link span {
  margin-right: 8px;
}

.agreement-content,
.privacy-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.6;
}

.agreement-content h3,
.privacy-content h3 {
  color: #D4AF37;
  margin-bottom: 20px;
}

.agreement-content h4,
.privacy-content h4 {
  color: #333;
  margin: 20px 0 10px 0;
}

.agreement-content p,
.privacy-content p {
  margin: 10px 0;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    justify-content: center;
  }
  
  .register-form-container {
    max-width: 400px;
    padding: 20px;
  }
  
  .register-card :deep(.el-card__body) {
    padding: 30px;
  }
  
  .register-header h1 {
    font-size: 24px;
  }
  
  .register-header p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .register-form-container {
    max-width: 350px;
    padding: 15px;
  }
  
  .register-card :deep(.el-card__body) {
    padding: 25px;
  }
  
  .register-header h1 {
    font-size: 20px;
  }
}
</style>
