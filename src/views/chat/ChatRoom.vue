<template>
	<div class="chat-room">
		<!-- 聊天头部 -->
		<div class="chat-header">
			<el-avatar
					:src="character?.avatar_url"
					:size="40"
					class="character-avatar"
			>
				<el-icon :size="20"><User /></el-icon>
			</el-avatar>
			<div class="header-info">
				<h3>{{ character?.name || '加载中...' }}</h3>
				<p>{{ character?.description }}</p>
			</div>
			<div class="header-actions">
				<el-button text circle @click="showSettings = true">
					<el-icon><Setting /></el-icon>
				</el-button>
				<el-button text circle @click="handleDelete">
					<el-icon><Delete /></el-icon>
				</el-button>
			</div>
		</div>
		
		<!-- 消息列表 -->
		<div ref="messageListRef" class="message-list">
			<div
					v-for="message in messages"
					:key="message.id"
					class="message-item"
					:class="{ 'user-message': message.role === 'user' }"
			>
				<div class="message-avatar">
					<el-avatar v-if="message.role === 'assistant'" :src="character?.avatar_url" :size="32">
						<el-icon :size="16"><User /></el-icon>
					</el-avatar>
					<el-avatar v-else :size="32">
						<el-icon :size="16"><Avatar /></el-icon>
					</el-avatar>
				</div>
				<div class="message-content">
					<div class="message-text">{{ message.content }}</div>
					<div v-if="message.audio_url" class="message-audio">
						<audio :src="message.audio_url" controls preload="metadata"></audio>
					</div>
					<div class="message-time">{{ formatTime(message.created_at) }}</div>
				</div>
			</div>
			
			<!-- 正在输入指示器 -->
			<div v-if="isTyping" class="typing-indicator">
				<div class="typing-dots">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		</div>
		
		<!-- 输入区域 -->
		<div class="input-area">
			<div class="input-toolbar">
				<el-button
						:type="isRecording ? 'danger' : 'default'"
						circle
						@click="toggleRecording"
				>
					<el-icon>
						<Microphone v-if="!isRecording" />
						<VideoPause v-else />
					</el-icon>
				</el-button>
			</div>
			<el-input
					v-model="inputMessage"
					type="textarea"
					:rows="2"
					placeholder="输入消息..."
					@keydown.enter.prevent="handleSendMessage"
			/>
			<el-button
					type="primary"
					:disabled="!inputMessage.trim() && !isRecording"
					@click="handleSendMessage"
			>
				<el-icon><Promotion /></el-icon>
				发送
			</el-button>
		</div>
		
		<!-- 设置对话框 -->
		<el-dialog
				v-model="showSettings"
				title="对话设置"
				width="500px"
		>
			<el-form label-width="100px">
				<el-form-item label="TTS引擎">
					<el-switch
							:model-value="character?.tts_engine === 'indextts2'"
							disabled
					/>
					<span class="ml-2">{{ character?.tts_engine }}</span>
				</el-form-item>
				<el-form-item label="知识库">
					<el-switch
							:model-value="character?.use_knowledge_base"
							disabled
					/>
					<span class="ml-2">{{ character?.use_knowledge_base ? '已启用' : '未启用' }}</span>
				</el-form-item>
			</el-form>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { chatAPI } from '@/api/chat'
import { Character } from '@/types/character'
import { Message, WSMessage } from '@/types/chat'
import wsManager from '@/utils/websocket'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
	User,
	Avatar,
	Setting,
	Delete,
	Microphone,
	VideoPause,
	Promotion
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 状态
const messages = ref<Message[]>([])
const character = ref<Character | null>(null)
const inputMessage = ref('')
const isRecording = ref(false)
const isTyping = ref(false)
const showSettings = ref(false)
const messageListRef = ref<HTMLElement>()

// 计算属性
const conversationId = computed(() => Number(route.params.conversationId))

// WebSocket消息处理
const setupWebSocket = () => {
	if (!authStore.token) return
	
	wsManager.connect(conversationId.value, authStore.token)
	
	// 注册消息处理器
	wsManager.on('history', (data: WSMessage) => {
		if (data.messages) {
			messages.value = data.messages
			scrollToBottom()
		}
	})
	
	wsManager.on('text', (data: WSMessage) => {
		if (data.content) {
			const newMessage: Message = {
				id: Date.now(),
				role: 'assistant',
				content: data.content,
				audio_url: data.url,
				retrieved_context: [],
				created_at: new Date().toISOString()
			}
			messages.value.push(newMessage)
			isTyping.value = false
			scrollToBottom()
		}
	})
	
	wsManager.on('text_stream', (data: WSMessage) => {
		// 流式文本处理
		isTyping.value = true
	})
	
	wsManager.on('error', (data: WSMessage) => {
		ElMessage.error(data.message || '发生错误')
		isTyping.value = false
	})
	
	wsManager.on('transcription', (data: WSMessage) => {
		if (data.content) {
			inputMessage.value = data.content
		}
	})
}

// 加载对话历史
const loadConversation = async () => {
	try {
		const msgs = await chatAPI.getMessages(conversationId.value)
		messages.value = msgs
		if (msgs.length > 0 && msgs[0]) {
			// 从消息中获取角色信息（这里需要后端支持）
			// character.value = msgs[0].character
		}
		scrollToBottom()
	} catch (error) {
		ElMessage.error('加载对话失败')
	}
}

// 发送消息
const handleSendMessage = () => {
	const content = inputMessage.value.trim()
	if (!content) return
	
	// 添加用户消息到列表
	const userMessage: Message = {
		id: Date.now(),
		role: 'user',
		content: content,
		retrieved_context: [],
		created_at: new Date().toISOString()
	}
	messages.value.push(userMessage)
	
	// 发送到WebSocket
	wsManager.send({
		type: 'text',
		content: content
	})
	
	// 清空输入框
	inputMessage.value = ''
	isTyping.value = true
	scrollToBottom()
}

// 录音控制
const toggleRecording = () => {
	if (!isRecording.value) {
		startRecording()
	} else {
		stopRecording()
	}
}

const startRecording = () => {
	isRecording.value = true
	// TODO: 实现录音逻辑
	ElMessage.info('录音功能开发中')
}

const stopRecording = () => {
	isRecording.value = false
	// TODO: 停止录音并发送
}

// 删除对话
const handleDelete = async () => {
	try {
		await ElMessageBox.confirm(
				'确定要删除这个对话吗？所有消息记录都将被删除。',
				'删除确认',
				{
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				}
		)
		
		await chatAPI.deleteConversation(conversationId.value)
		ElMessage.success('对话已删除')
		router.push('/conversations')
	} catch (error) {
		// 用户取消或删除失败
	}
}

// 工具函数
const scrollToBottom = () => {
	nextTick(() => {
		if (messageListRef.value) {
			messageListRef.value.scrollTop = messageListRef.value.scrollHeight
		}
	})
}

const formatTime = (dateStr: string) => {
	const date = new Date(dateStr)
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const minutes = Math.floor(diff / 60000)
	
	if (minutes < 1) return '刚刚'
	if (minutes < 60) return `${minutes}分钟前`
	if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
	
	return date.toLocaleString('zh-CN', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}

// 生命周期
onMounted(() => {
	loadConversation()
	setupWebSocket()
})

onUnmounted(() => {
	wsManager.disconnect()
})
</script>

<style scoped>
.chat-room {
	height: calc(100vh - 100px);
	display: flex;
	flex-direction: column;
	background: #fff;
	border-radius: 8px;
	overflow: hidden;
}

.chat-header {
	display: flex;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #e4e7ed;
	background: #f8f9fa;
}

.character-avatar {
	margin-right: 12px;
}

.header-info {
	flex: 1;
}

.header-info h3 {
	margin: 0 0 4px;
	font-size: 16px;
	color: #303133;
}

.header-info p {
	margin: 0;
	font-size: 12px;
	color: #909399;
}

.header-actions {
	display: flex;
	gap: 8px;
}

.message-list {
	flex: 1;
	overflow-y: auto;
	padding: 20px;
	background: #f5f7fa;
}

.message-item {
	display: flex;
	margin-bottom: 20px;
	animation: fadeIn 0.3s;
}

.message-item.user-message {
	flex-direction: row-reverse;
}

.message-avatar {
	flex-shrink: 0;
	margin: 0 12px;
}

.message-content {
	max-width: 60%;
}

.message-text {
	padding: 12px 16px;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	word-wrap: break-word;
}

.user-message .message-text {
	background: #409eff;
	color: #fff;
}

.message-audio {
	margin-top: 8px;
}

.message-audio audio {
	width: 100%;
	max-width: 300px;
}

.message-time {
	margin-top: 4px;
	font-size: 12px;
	color: #909399;
	text-align: right;
}

.user-message .message-time {
	text-align: left;
}

.typing-indicator {
	display: flex;
	align-items: center;
	margin-left: 44px;
}

.typing-dots {
	display: flex;
	gap: 4px;
	padding: 12px 16px;
	background: #fff;
	border-radius: 8px;
}

.typing-dots span {
	width: 8px;
	height: 8px;
	background: #909399;
	border-radius: 50%;
	animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
	animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
	animation-delay: 0.4s;
}

@keyframes typing {
	0%, 60%, 100% {
		opacity: 0.3;
	}
	30% {
		opacity: 1;
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.input-area {
	display: flex;
	align-items: flex-end;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid #e4e7ed;
	background: #fff;
}

.input-toolbar {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.ml-2 {
	margin-left: 8px;
}
</style>