<template>
	<el-container class="main-layout">
		<el-header class="app-header">
			<div class="header-content">
				<div class="logo">
					<el-icon :size="24"><ChatDotRound /></el-icon>
					<span>AI Roleplay</span>
				</div>
				<el-menu
						mode="horizontal"
						:default-active="activeMenu"
						:ellipsis="false"
						@select="handleMenuSelect"
				>
					<el-menu-item index="characters">
						<el-icon><User /></el-icon>
						<span>角色列表</span>
					</el-menu-item>
					<el-menu-item index="my-characters">
						<el-icon><UserFilled /></el-icon>
						<span>我的角色</span>
					</el-menu-item>
					<el-menu-item index="conversations">
						<el-icon><ChatLineRound /></el-icon>
						<span>对话记录</span>
					</el-menu-item>
					<el-menu-item index="knowledge">
						<el-icon><Document /></el-icon>
						<span>知识库</span>
					</el-menu-item>
				</el-menu>
				<div class="user-info">
					<el-dropdown @command="handleUserCommand">
            <span class="user-dropdown">
              <el-icon><Avatar /></el-icon>
              <span>{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item command="profile">个人资料</el-dropdown-item>
								<el-dropdown-item command="settings">设置</el-dropdown-item>
								<el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
			</div>
		</el-header>
		<el-main class="app-main">
			<router-view />
		</el-main>
	</el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
	ChatDotRound,
	User,
	UserFilled,
	ChatLineRound,
	Document,
	Avatar,
	ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = computed(() => authStore.user?.username || '用户')

const activeMenu = computed(() => {
	const path = route.path
	if (path.startsWith('/characters/create')) return 'my-characters'
	if (path.startsWith('/characters')) return 'characters'
	if (path.startsWith('/chat')) return 'conversations'
	if (path.startsWith('/knowledge')) return 'knowledge'
	return 'characters'
})

const handleMenuSelect = (index: string) => {
	switch (index) {
		case 'characters':
			router.push('/characters')
			break
		case 'my-characters':
			router.push('/characters?my=true')
			break
		case 'conversations':
			router.push('/conversations')
			break
		case 'knowledge':
			router.push('/knowledge')
			break
	}
}

const handleUserCommand = async (command: string) => {
	switch (command) {
		case 'profile':
			ElMessage.info('个人资料功能开发中')
			break
		case 'settings':
			ElMessage.info('设置功能开发中')
			break
		case 'logout':
			try {
				await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				})
				authStore.logout()
				router.push('/login')
				ElMessage.success('退出成功')
			} catch {
				// 用户取消
			}
			break
	}
}
</script>

<style scoped>
.main-layout {
	height: 100vh;
}

.app-header {
	background: #fff;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
	padding: 0;
}

.header-content {
	display: flex;
	align-items: center;
	height: 100%;
	padding: 0 20px;
}

.logo {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 18px;
	font-weight: bold;
	color: #409eff;
	margin-right: 40px;
}

.el-menu {
	flex: 1;
	border: none;
}

.user-info {
	margin-left: auto;
}

.user-dropdown {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	padding: 8px 12px;
	border-radius: 4px;
	transition: background-color 0.3s;
}

.user-dropdown:hover {
	background-color: #f5f7fa;
}

.app-main {
	background: #f5f7fa;
	padding: 20px;
	overflow-y: auto;
}
</style>