<template>
  <Teleport to="body">
    <div v-if="isOpen" class="admin-overlay" @click.self="handleClose">
      <div class="admin-panel" @click.stop>
        <!-- Header -->
        <div class="admin-header">
          <div class="header-content">
            <h2>Admin Panel</h2>
          </div>
          <button class="close-btn" @click="handleClose" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Auth -->
        <div v-if="!isAuthenticated" class="auth-section">
          <div class="auth-icon">🔒</div>
          <h3>Authentication Required</h3>
          <form @submit.prevent="authenticate">
            <!-- Hidden username field for accessibility -->
            <input
              type="text"
              name="username"
              autocomplete="username"
              style="display: none;"
              aria-hidden="true"
              tabindex="-1"
            />
            <input
              v-model="password"
              type="password"
              name="password"
              placeholder="Enter admin password"
              class="auth-input"
              autocomplete="current-password"
            />
            <button type="submit" class="btn-primary">Login</button>
          </form>
          <p v-if="authError" class="error-msg">{{ authError }}</p>
        </div>

        <!-- Main Content -->
        <div v-else class="admin-content">
          <!-- Status -->
          <div class="status-bar">
            <div :class="['status-indicator', connectionStatus.success ? 'online' : 'offline']">
              <div class="status-dot"></div>
              <span>{{ connectionStatus.success ? 'Connected' : 'Offline' }}</span>
            </div>
            <span class="status-info">{{ connectionStatus.message }}</span>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button
              :class="['tab', { active: activeTab === 'add' }]"
              @click="activeTab = 'add'"
            >
              Add Video
            </button>
            <button
              :class="['tab', { active: activeTab === 'manage' }]"
              @click="activeTab = 'manage'"
            >
              Manage
            </button>
            <button
              :class="['tab', { active: activeTab === 'settings' }]"
              @click="activeTab = 'settings'"
            >
              Settings
            </button>
          </div>

          <!-- Add Video Tab -->
          <div v-if="activeTab === 'add'" class="tab-content">
            <h3 class="section-title">Add New Video</h3>

            <div class="form-group">
              <label>YouTube URL or Video ID</label>
              <input
                v-model="newVideo.url"
                type="text"
                placeholder="https://youtube.com/watch?v=... or video_id"
                @input="extractYouTubeId"
                class="form-input"
              />
              <small v-if="newVideo.youtubeId" class="hint success">
                ✓ Extracted ID: {{ newVideo.youtubeId }}
              </small>
            </div>

            <div class="form-group">
              <label>Category</label>
              <select v-model="newVideo.categoryId" class="form-select" @change="onCategoryChange">
                <option value="">Select category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ getCategoryLabel(cat.id) }}
                </option>
              </select>
            </div>

            <div v-if="subcategories.length > 0" class="form-group">
              <label>Subcategory</label>
              <select v-model="newVideo.subcategoryId" class="form-select">
                <option value="">Select subcategory</option>
                <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
                  {{ getSubcategoryLabel(sub.id) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>
                Video ID (optional)
                <span class="label-hint">Auto-generated if empty</span>
              </label>
              <input
                v-model="newVideo.id"
                type="text"
                placeholder="Leave empty for auto-generation"
                class="form-input"
              />
              <small v-if="!newVideo.id && canAddVideo" class="hint">
                Will be generated: {{ previewGeneratedId }}
              </small>
            </div>

            <button
              @click="addVideo"
              :disabled="!canAddVideo || loading"
              class="btn-primary btn-large"
            >
              <span v-if="loading" class="btn-spinner"></span>
              <span>{{ loading ? 'Adding...' : 'Add Video' }}</span>
            </button>

            <p v-if="message" :class="['message', messageType]">{{ message }}</p>
          </div>

          <!-- Manage Videos Tab -->
          <div v-if="activeTab === 'manage'" class="tab-content">
            <h3 class="section-title">Manage Videos</h3>

            <div class="form-group">
              <label>Category</label>
              <select v-model="manageCategory" class="form-select" @change="loadVideosForManage">
                <option value="">Select category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ getCategoryLabel(cat.id) }} ({{ getVideoCount(cat) }} videos)
                </option>
              </select>
            </div>

            <div v-if="managedVideos.length > 0" class="video-list">
              <div v-for="video in managedVideos" :key="video.id" class="video-item">
                <img
                  :src="`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`"
                  :alt="video.id"
                  class="video-thumbnail-preview"
                  loading="lazy"
                />
                <div class="video-info-item">
                  <div class="video-title-item">{{ video.id }}</div>
                  <div class="video-meta">
                    <span class="video-youtube-id">{{ video.youtubeId }}</span>
                    <span v-if="video.subcategoryId" class="video-subcategory">
                      {{ getSubcategoryLabel(video.subcategoryId) }}
                    </span>
                  </div>
                </div>
                <button
                  @click="removeVideo(video)"
                  :disabled="loading"
                  class="btn-danger"
                  title="Delete video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>

            <p v-else-if="manageCategory" class="hint empty-state">No videos in this category</p>

            <p v-if="message" :class="['message', messageType]">{{ message }}</p>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="tab-content">
            <h3 class="section-title">Settings & Info</h3>

            <div class="settings-section">
              <h4>Cache Management</h4>
              <button @click="clearCache" class="btn-secondary">
                <span>🗑️</span>
                <span>Clear Cache</span>
              </button>
              <small class="hint">Clear local cache and reload fresh data from Gist</small>
            </div>

            <div class="settings-section">
              <h4>Configuration</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Gist ID</span>
                  <code class="info-value">{{ gistId || 'Not configured' }}</code>
                </div>
                <div class="info-item">
                  <span class="info-label">Categories</span>
                  <span class="info-value">{{ categories.length }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Videos</span>
                  <span class="info-value">{{ totalVideos }}</span>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h4>Logout</h4>
              <button @click="logout" class="btn-danger btn-large">
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>

            <p v-if="message" :class="['message', messageType]">{{ message }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import gistService from '@/services/gistService.js'

// State management
const isOpen = ref(false)
const isAuthenticated = ref(false)
const password = ref('')
const authError = ref('')
const activeTab = ref('add')
const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const categories = ref([])
const connectionStatus = ref({ success: false, message: 'Not checked' })
const manageCategory = ref('')
const managedVideos = ref([])

// Config
const gistId = import.meta.env.VITE_GIST_ID
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

// New video form
const newVideo = ref({
  url: '',
  youtubeId: '',
  categoryId: '',
  subcategoryId: '',
  id: ''
})

// Computed
const subcategories = computed(() => {
  if (!newVideo.value.categoryId) return []
  const category = categories.value.find(c => c.id === newVideo.value.categoryId)
  return category?.subcategories || []
})

const canAddVideo = computed(() => {
  return newVideo.value.youtubeId &&
    newVideo.value.categoryId &&
    (!subcategories.value.length || newVideo.value.subcategoryId)
})

const previewGeneratedId = computed(() => {
  if (!canAddVideo.value) return ''
  const prefix = newVideo.value.subcategoryId || newVideo.value.categoryId
  const nextNumber = getNextVideoNumber()
  return `${prefix}_${nextNumber}`
})

const totalVideos = computed(() => {
  return categories.value.reduce((total, cat) => total + getVideoCount(cat), 0)
})

// Helper functions
const getNextVideoNumber = () => {
  const categoryId = newVideo.value.categoryId
  const subcategoryId = newVideo.value.subcategoryId || categoryId
  const category = categories.value.find(c => c.id === categoryId)

  if (!category) return 1

  const videos = category.subcategories
    ? category.subcategories.find(s => s.id === subcategoryId)?.videos || []
    : category.videos || []

  if (videos.length === 0) return 1

  const numbers = videos
    .map(v => {
      const match = v.id.match(/_(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter(n => !isNaN(n))

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
}

const getCategoryLabel = (id) => {
  return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getSubcategoryLabel = (id) => {
  return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getVideoCount = (category) => {
  return category.subcategories
    ? category.subcategories.reduce((total, sub) => total + (sub.videos?.length || 0), 0)
    : category.videos?.length || 0
}

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

// Panel controls
const open = () => {
  isOpen.value = true
  if (isAuthenticated.value && categories.value.length === 0) {
    loadCategories()
  }
}

const handleClose = () => {
  isOpen.value = false
}

// Authentication
const authenticate = () => {
  if (!adminPassword) {
    authError.value = 'Admin password not configured in .env'
    return
  }

  if (password.value === adminPassword) {
    isAuthenticated.value = true
    authError.value = ''
    password.value = ''
    loadCategories()
    checkConnection()
  } else {
    authError.value = 'Invalid password'
  }
}

const logout = () => {
  isAuthenticated.value = false
  password.value = ''
  authError.value = ''
  categories.value = []
  showMessage('Logged out successfully', 'success')
}

// Data loading
const loadCategories = async () => {
  // Загружаем только если еще не загружены
  if (categories.value.length > 0) {
    return
  }

  try {
    const config = await gistService.getVideosConfig(true) // используем кеш
    categories.value = config.categories || []
  } catch (error) {
    showMessage(`Failed to load categories: ${error.message}`, 'error')
  }
}

const checkConnection = async () => {
  loading.value = true
  try {
    connectionStatus.value = await gistService.checkConnection()
  } catch (error) {
    connectionStatus.value = { success: false, message: error.message }
  } finally {
    loading.value = false
  }
}

// YouTube ID extraction
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
  /youtube\.com\/embed\/([^&\n?#]+)/,
  /youtube\.com\/v\/([^&\n?#]+)/,
  /youtube\.com\/shorts\/([^&\n?#]+)/
]

const extractYouTubeId = () => {
  const url = newVideo.value.url.trim()

  // Если это просто ID (11 символов без спецсимволов)
  if (url.length === 11 && !/[\/\?=]/.test(url)) {
    newVideo.value.youtubeId = url
    return
  }

  // Пробуем паттерны URL
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match?.[1]) {
      newVideo.value.youtubeId = match[1]
      return
    }
  }

  newVideo.value.youtubeId = ''
}

// Video management
const onCategoryChange = () => {
  newVideo.value.subcategoryId = ''
}

const addVideo = async () => {
  loading.value = true
  message.value = ''

  try {
    const videoData = {
      id: newVideo.value.id || previewGeneratedId.value,
      youtubeId: newVideo.value.youtubeId
    }

    const subcategoryId = newVideo.value.subcategoryId || newVideo.value.categoryId

    await gistService.addVideo(
      newVideo.value.categoryId,
      subcategoryId,
      videoData
    )

    showMessage(`Video added successfully! ID: ${videoData.id}`, 'success')

    // Сохраняем выбранные категории для удобства
    const { categoryId, subcategoryId: subId } = newVideo.value
    newVideo.value = {
      url: '',
      youtubeId: '',
      categoryId,
      subcategoryId: subId,
      id: ''
    }

    // Обновляем categories из кеша сервиса
    await loadCategories()
  } catch (error) {
    showMessage(`Failed to add video: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const loadVideosForManage = () => {
  managedVideos.value = []

  if (!manageCategory.value) return

  const category = categories.value.find(c => c.id === manageCategory.value)
  if (!category) return

  managedVideos.value = category.subcategories
    ? category.subcategories.flatMap(sub =>
      (sub.videos || []).map(video => ({
        ...video,
        categoryId: category.id,
        subcategoryId: sub.id
      }))
    )
    : (category.videos || []).map(video => ({
      ...video,
      categoryId: category.id
    }))
}

const removeVideo = async (video) => {
  if (!confirm(`Delete video "${video.id}"?`)) return

  loading.value = true
  message.value = ''

  try {
    await gistService.removeVideo(
      video.categoryId,
      video.subcategoryId || video.categoryId,
      video.id
    )

    showMessage('Video deleted successfully!', 'success')

    // Принудительно обновляем данные без кеша
    categories.value = []
    await loadCategories()
    loadVideosForManage()
  } catch (error) {
    showMessage(`Failed to delete video: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const clearCache = async () => {
  gistService.clearCache()
  categories.value = []
  showMessage('✅ Cache cleared', 'success')
  await loadCategories()
}

// Keyboard handling
const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({ open })
</script>

<style scoped>
:root {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-hover: rgba(255, 255, 255, 0.08);
  --glass-active: rgba(255, 255, 255, 0.12);
}

.admin-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.admin-panel {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: auto;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: slideUp 0.3s ease;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-header h2 {
  margin: 0;
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.close-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.2s;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  opacity: 1;
  background: var(--glass-hover);
  transform: scale(1.05);
}

.auth-section {
  padding: 60px 28px;
  text-align: center;
}

.auth-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.auth-section h3 {
  color: #fff;
  margin-bottom: 28px;
  font-weight: 500;
}

.auth-section form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.auth-input {
  width: 100%;
  max-width: 320px;
  padding: 14px 18px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  transition: all 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
  background: var(--glass-hover);
}

.admin-content {
  padding: 28px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  margin-bottom: 24px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
}

.status-indicator.online .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-indicator.offline .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.status-info {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 2px;
}

.tab {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: var(--glass-bg);
}

.tab.active {
  color: #fff;
  border-bottom-color: #fff;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

.section-title {
  color: #fff;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: 500;
}

.label-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 400;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(40, 40, 40, 0.9);
}

.form-select {
  cursor: pointer;
}

.form-select option {
  background: #1a1a1a;
  color: #fff;
}

.hint {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 8px;
}

.hint.success {
  color: #10b981;
}

.hint.empty-state {
  text-align: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.4);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.btn-primary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.btn-secondary {
  background: var(--glass-bg);
  color: rgba(255, 255, 255, 0.9);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--glass-hover);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #fff;
  border-color: rgba(239, 68, 68, 0.3);
  padding: 8px 12px;
  font-size: 13px;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.btn-large {
  padding: 14px 28px;
  font-size: 15px;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  padding: 14px 18px;
  border-radius: 10px;
  margin-top: 20px;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.video-item:hover {
  background: var(--glass-hover);
  border-color: rgba(255, 255, 255, 0.15);
}

.video-thumbnail-preview {
  width: 80px;
  height: 45px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.video-info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.video-title-item {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.video-youtube-id,
.video-subcategory {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.settings-section {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--glass-border);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h4 {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  padding: 14px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.info-value {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.info-item code {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.admin-panel::-webkit-scrollbar {
  width: 10px;
}

.admin-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
}

.admin-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.admin-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .admin-panel {
    width: 95%;
    max-height: 95vh;
  }

  .admin-header,
  .admin-content {
    padding: 20px;
  }

  .tabs {
    flex-direction: column;
    gap: 4px;
  }

  .tab {
    justify-content: center;
    padding: 12px 16px;
  }

  .video-item {
    flex-wrap: wrap;
  }

  .video-thumbnail-preview {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
  }

  .btn-danger {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>