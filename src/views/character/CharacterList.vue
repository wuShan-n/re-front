<template>
	<div class="character-list">
		<!-- 页面头部 -->
		<div class="page-header">
			<h2>{{ isMyCharacters ? '我的角色' : '角色广场' }}</h2>
			<div class="header-actions">
				<el-input
						v-model="searchQuery"
						placeholder="搜索角色..."
						prefix-icon="Search"
						clearable
						style="width: 300px"
						@clear="handleSearch"
						@keyup.enter="handleSearch"
				/>
				<el-button type="primary" @click="handleCreate">
					<el-icon><Plus /></el-icon>
					创建角色
				</el-button>
			</div>
		</div>
		
		<!-- 切换视图 -->
		<el-radio-group v-model="viewMode" class="view-toggle">
			<el-radio-button label="all">所有角色</el-radio-button>
			<el-radio-button label="my">我的角色</el-radio-button>
		</el-radio-group>
		
		<!-- 角色卡片列表 -->
		<div v-if="!loading" class="character-grid">
			<el-card
					v-for="character in characters"
					:key="character.id"
					class="character-card"
					:body-style="{ padding: '0' }"
			>
				<div class="card-content" @click="handleCardClick(character)">
					<div class="avatar-section">
						<el-avatar
								:src="character.avatar_url"
								:size="80"
								class="character-avatar"
						>
							<el-icon :size="40"><User /></el-icon>
						</el-avatar>
					</div>
					<div class="info-section">
						<h3 class="character-name">{{ character.name }}</h3>
						<p class="character-description">{{ character.description }}</p>
						<div class="character-meta">
							<el-tag v-if="character.is_public" type="success" size="small">公开</el-tag>
							<el-tag v-else type="info" size="small">私有</el-tag>
							<span class="creator">创建者: {{ character.creator?.username || '系统' }}</span>
						</div>
					</div>
				</div>
				<div class="card-actions">
					<el-button text @click="handleChat(character)">
						<el-icon><ChatDotRound /></el-icon>
						开始对话
					</el-button>
					<el-button text @click="handleView(character)">
						<el-icon><View /></el-icon>
						查看详情
					</el-button>
					<el-button
							v-if="character.created_by === currentUserId"
							text
							@click="handleEdit(character)"
					>
						<el-icon><Edit /></el-icon>
						编辑
					</el-button>
				</div>
			</el-card>
		</div>
		
		<!-- 加载状态 -->
		<div v-else class="loading-container">
			<el-icon class="is-loading" :size="40"><Loading /></el-icon>
			<p>加载中...</p>
		</div>
		
		<!-- 空状态 -->
		<el-empty
				v-if="!loading && characters.length === 0"
				description="暂无角色"
		>
			<el-button type="primary" @click="handleCreate">创建第一个角色</el-button>
		</el-empty>
		
		<!-- 分页 -->
		<div v-if="!loading && total > perPage" class="pagination">
			<el-pagination
					v-model:current-page="currentPage"
					:page-size="perPage"
					:total="total"
					layout="prev, pager, next, jumper"
					@current-change="fetchCharacters"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { characterAPI } from '@/api/character'
import { chatAPI } from '@/api/chat'
import { Character } from '@/types/character'
import { ElMessage } from 'element-plus'
import {
	Plus,
	Search,
	User,
	ChatDotRound,
	View,
	Edit,
	Loading
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const characters = ref<Character[]>([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = ref(12)
const total = ref(0)
const viewMode = ref<'all' | 'my'>('all')

// 计算属性
const isMyCharacters = computed(() => viewMode.value === 'my')
const currentUserId = computed(() => authStore.user?.id)

// 监听路由参数变化
watch(() => route.query.my, (val) => {
	viewMode.value = val === 'true' ? 'my' : 'all'
	fetchCharacters()
})

// 监听视图模式变化
watch(viewMode, (val) => {
	router.push({
		path: '/characters',
		query: val === 'my' ? { my: 'true' } : {}
	})
	currentPage.value = 1
	fetchCharacters()
})

// 获取角色列表
const fetchCharacters = async () => {
	loading.value = true
	try {
		if (isMyCharacters.value) {
			// 获取我的角色
			const data = await characterAPI.getMyCharacters()
			characters.value = data
			total.value = data.length
		} else {
			// 获取所有公开角色
			const response = await characterAPI.getList({
				page: currentPage.value,
				per_page: perPage.value,
				search: searchQuery.value,
				include_private: false
			})
			characters.value = response.items
			total.value = response.total
		}
	} catch (error) {
		ElMessage.error('获取角色列表失败')
	} finally {
		loading.value = false
	}
}

// 事件处理
const handleSearch = () => {
	currentPage.value = 1
	fetchCharacters()
}

const handleCreate = () => {
	router.push('/characters/create')
}

const handleCardClick = (character: Character) => {
	router.push(`/characters/${character.id}`)
}

const handleChat = async (character: Character) => {
	try {
		const conversation = await chatAPI.createConversation(character.id)
		router.push(`/chat/${conversation.id}`)
	} catch (error) {
		ElMessage.error('创建对话失败')
	}
}

const handleView = (character: Character) => {
	router.push(`/characters/${character.id}`)
}

const handleEdit = (character: Character) => {
	router.push(`/characters/${character.id}/edit`)
}

onMounted(() => {
	// 初始化视图模式
	if (route.query.my === 'true') {
		viewMode.value = 'my'
	}
	fetchCharacters()
})
</script>

<style scoped>
.character-list {
	max-width: 1400px;
	margin: 0 auto;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.page-header h2 {
	margin: 0;
	font-size: 24px;
	color: #303133;
}

.header-actions {
	display: flex;
	gap: 12px;
}

.view-toggle {
	margin-bottom: 20px;
}

.character-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
	margin-bottom: 40px;
}

.character-card {
	cursor: pointer;
	transition: transform 0.3s, box-shadow 0.3s;
}

.character-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
	display: flex;
	padding: 20px;
	min-height: 120px;
}

.avatar-section {
	flex-shrink: 0;
	margin-right: 16px;
}

.character-avatar {
	border: 2px solid #e4e7ed;
}

.info-section {
	flex: 1;
	min-width: 0;
}

.character-name {
	margin: 0 0 8px;
	font-size: 18px;
	font-weight: 500;
	color: #303133;
}

.character-description {
	margin: 0 0 12px;
	color: #606266;
	font-size: 14px;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	text-overflow: ellipsis;
}

.character-meta {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 12px;
	color: #909399;
}

.card-actions {
	padding: 12px 20px;
	border-top: 1px solid #ebeef5;
	display: flex;
	justify-content: space-around;
}

.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	color: #909399;
}

.pagination {
	display: flex;
	justify-content: center;
	margin-top: 40px;
}
</style>