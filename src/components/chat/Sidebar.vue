<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <el-icon class="sidebar-icon magic-icon" size="24" color="#D4AF37">
        <MagicStick />
      </el-icon>
      <h2 class="sidebar-title">魔法助手</h2>
    </div>
    
    <div class="sidebar-content">
      <!-- 上部分：角色选择区域 -->
      <div class="sidebar-top">
        <!-- 可选角色列表 -->
        <div class="character-list">
          <h3 class="section-title">选择角色</h3>
          <div class="character-items">
            <div 
              v-for="character in characters" 
              :key="character.name || character.id"
              :class="['character-item', { 'active': currentCharacter === (character.name || character.id) }]"
              @click="$emit('select-character', character.name || character.id)"
            >
              <el-icon class="character-item-icon" size="16" color="#D4AF37">
                <UserFilled />
              </el-icon>
              <span class="character-item-name">{{ character.name || character.title || '未知角色' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 下部分：对话记录区域 -->
      <div class="sidebar-bottom">
        <!-- 对话记录 -->
        <div class="chat-history">
          <h3 class="section-title">对话记录</h3>
          <div class="history-items" ref="historyContainer">
            <div 
              v-for="(session, index) in chatSessions" 
              :key="session.id"
              :class="['history-item', { 'active': currentSessionId === session.id }]"
            >
              <div class="history-content" @click="$emit('load-session', session.id)">
                <div class="history-text">{{ session.title }}</div>
                <div class="history-time">{{ formatTime(session.startTime) }}</div>
                <div class="history-count">{{ session.messageCount }}条消息</div>
              </div>
              <div class="history-actions">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Close"
                  circle
                  class="delete-button"
                  @click.stop="$emit('delete-session', session.id)"
                  title="删除会话"
                />
              </div>
            </div>
            
            <div v-if="chatSessions.length === 0" class="no-history">
              <span class="no-history-text">暂无对话记录</span>
            </div>
          </div>
        </div>
        
        <!-- 功能按钮 -->
        <div class="sidebar-actions">
          <el-button 
            @click="$emit('create-session')" 
            :icon="Plus" 
            class="sidebar-button"
            block
          >
            创建新会话
          </el-button>
          
          <el-button 
            @click="$emit('manage-characters')" 
            :icon="UserFilled" 
            class="sidebar-button management"
            block
          >
            角色管理
          </el-button>
          
          <el-button 
            @click="$emit('manage-knowledge')" 
            :icon="Document" 
            class="sidebar-button management"
            block
          >
            知识库管理
          </el-button>
          
          <el-button 
            @click="$emit('logout')" 
            :icon="SwitchButton" 
            class="sidebar-button danger"
            block
          >
            退出登录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MagicStick, UserFilled, Plus, SwitchButton, Close, Document } from '@element-plus/icons-vue'

defineProps({
  characters: {
    type: Array,
    default: () => []
  },
  currentCharacter: {
    type: String,
    default: ''
  },
  chatSessions: {
    type: Array,
    default: () => []
  },
  currentSessionId: {
    type: String,
    default: null
  }
})

defineEmits(['select-character', 'load-session', 'create-session', 'logout', 'delete-session', 'manage-characters', 'manage-knowledge', 'manage-voice-samples', 'view-public-characters'])

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  border-right: 2px solid #D4AF37;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 215, 0, 0.1));
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.sidebar-icon {
  animation: sparkle 2s ease-in-out infinite;
}

.sidebar-title {
  color: #D4AF37;
  font-family: var(--font-magic-title);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

/* 上部分：角色选择区域 */
.sidebar-top {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

/* 下部分：对话记录区域 */
.sidebar-bottom {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
}

/* 角色列表 */
.character-list {
  background: rgba(212, 175, 55, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.character-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.character-items::-webkit-scrollbar {
  display: none;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.character-item:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: #D4AF37;
  transform: translateX(2px);
}

.character-item.active {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(255, 215, 0, 0.3));
  border-color: #FFD700;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4), 0 0 20px rgba(255, 215, 0, 0.2);
  transform: translateX(4px);
  position: relative;
}

.character-item.active::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
}

.character-item-icon {
  animation: sparkle 2s ease-in-out infinite;
}

.character-item-name {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

.character-item.active .character-item-name {
  color: #FFD700;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

/* 对话记录 */
.chat-history {
  background: rgba(212, 175, 55, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.history-items::-webkit-scrollbar {
  display: none;
}

.history-item {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-item:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: #D4AF37;
  transform: translateX(2px);
}

.history-item.active {
  background: rgba(212, 175, 55, 0.3);
  border-color: #D4AF37;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  cursor: pointer;
}

.history-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.delete-button {
  opacity: 0;
  transition: all 0.3s ease;
  background: rgba(220, 20, 60, 0.8) !important;
  border-color: #DC143C !important;
}

.history-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background: #DC143C !important;
  transform: scale(1.1);
}

.history-text {
  color: #F7F3E9;
  font-family: var(--font-magic-body);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  color: rgba(247, 243, 233, 0.7);
  font-family: var(--font-magic-body);
  font-size: 12px;
}

.history-count {
  color: #D4AF37;
  font-family: var(--font-magic-body);
  font-size: 12px;
  font-weight: 600;
}

.no-history {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: rgba(247, 243, 233, 0.5);
}

.no-history-text {
  font-family: var(--font-magic-body);
  font-size: 14px;
}

/* 功能按钮 */
.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-button {
  background: linear-gradient(135deg, #D4AF37, #FFD700);
  border: none;
  color: #2C1810;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
  justify-content: flex-start !important;
}

.sidebar-button:hover {
  background: linear-gradient(135deg, #FFD700, #D4AF37);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.sidebar-button.danger {
  background: linear-gradient(135deg, #DC143C, #B22222);
  color: #FFFFFF;
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
  justify-content: flex-start !important;
}

.sidebar-button.danger:hover {
  background: linear-gradient(135deg, #B22222, #DC143C);
}

.section-title {
  color: #D4AF37;
  font-family: var(--font-magic-title);
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@keyframes sparkle {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.1) rotate(180deg);
    filter: brightness(1.2);
  }
}
</style>
