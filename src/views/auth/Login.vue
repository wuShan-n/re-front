<template>
	<div class="login-container">
		<el-card class="login-card">
			<template #header>
				<div class="card-header">
					<h2>登录</h2>
					<p>欢迎回到 AI Roleplay</p>
				</div>
			</template>
			
			<el-form
					ref="loginFormRef"
					:model="loginForm"
					:rules="loginRules"
					label-width="80px"
					@submit.prevent="handleLogin"
			>
				<el-form-item label="用户名" prop="username">
					<el-input
							v-model="loginForm.username"
							placeholder="请输入用户名"
							prefix-icon="User"
					/>
				</el-form-item>
				
				<el-form-item label="密码" prop="password">
					<el-input
							v-model="loginForm.password"
							type="password"
							placeholder="请输入密码"
							prefix-icon="Lock"
							show-password
					/>
				</el-form-item>
				
				<el-form-item>
					<el-button
							type="primary"
							:loading="loading"
							@click="handleLogin"
							style="width: 100%"
					>
						登录
					</el-button>
				</el-form-item>
				
				<el-form-item>
					<div class="form-footer">
						<span>还没有账号？</span>
						<router-link to="/register">立即注册</router-link>
					</div>
				</el-form-item>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
	username: '',
	password: ''
})

const loginRules: FormRules = {
	username: [
		{ required: true, message: '请输入用户名', trigger: 'blur' },
		{ min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
	],
	password: [
		{ required: true, message: '请输入密码', trigger: 'blur' },
		{ min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
	]
}

const handleLogin = async () => {
	if (!loginFormRef.value) return
	
	await loginFormRef.value.validate(async (valid) => {
		if (!valid) return
		
		loading.value = true
		try {
			await authStore.login(loginForm)
			ElMessage.success('登录成功')
			router.push('/characters')
		} catch (error: any) {
			ElMessage.error(error.response?.data?.detail || '登录失败')
		} finally {
			loading.value = false
		}
	})
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
	width: 400px;
	border-radius: 8px;
}

.card-header {
	text-align: center;
}

.card-header h2 {
	margin: 0 0 8px;
	font-size: 24px;
	color: #303133;
}

.card-header p {
	margin: 0;
	color: #909399;
	font-size: 14px;
}

.form-footer {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	width: 100%;
}

.form-footer a {
	color: #409eff;
	text-decoration: none;
}

.form-footer a:hover {
	text-decoration: underline;
}
</style>