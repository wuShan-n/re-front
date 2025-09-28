import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token'))

  // 登录
  const login = async (username, password) => {
    try {
            const response = await fetch('http://172.16.1.254:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // 登录成功，保存用户信息和token
        const userData = {
          id: data.user?.id || Date.now(),
          username: data.user?.username || username,
          name: data.user?.name || username,
          avatar: data.user?.avatar || '👤',
          email: data.user?.email || ''
        }
        
        user.value = userData
        isLoggedIn.value = true
        token.value = data.token || data.access_token || 'token_' + Date.now()
        
        // 保存到本地存储
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        return { success: true, message: data.message || '登录成功！' }
      } else {
        return { success: false, message: data.message || '用户名或密码错误！' }
      }
    } catch (error) {
      console.error('登录API调用失败:', error)
      return { success: false, message: '网络错误，请检查后端服务是否启动' }
    }
  }

  // 注册
  const register = async (username, email, password) => {
    try {
            const response = await fetch('http://172.16.1.254:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        return { success: true, message: data.message || '注册成功！请登录您的账号。' }
      } else {
        return { success: false, message: data.message || '注册失败，请稍后重试' }
      }
    } catch (error) {
      console.error('注册API调用失败:', error)
      return { success: false, message: '网络错误，请检查后端服务是否启动' }
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    token.value = null
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  // 检查登录状态
  const checkAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_data')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    }
  }

  // 初始化时检查登录状态
  checkAuth()

  return {
    isLoggedIn,
    user,
    token,
    login,
    register,
    logout,
    checkAuth
  }
})
