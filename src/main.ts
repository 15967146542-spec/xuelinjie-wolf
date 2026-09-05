import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPagination,
  ElProgress,
  ElSelect,
  ElSkeleton,
  ElTag,
  ElUpload
} from 'element-plus'
// 样式按全量引入以覆盖组件内部依赖（tooltip/popper 等），JS 侧按需打包
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// R16 按需注册：仅注册模板实际使用到的 15 个 Element Plus 组件，
// 替代 `app.use(ElementPlus)` 全量打包；图标已确认全部使用 lucide，
// 移除原先 @element-plus/icons-vue 的 300+ 全量全局注册。
const elementComponents = [
  ElButton,
  ElCheckbox,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPagination,
  ElProgress,
  ElSelect,
  ElSkeleton,
  ElTag,
  ElUpload
]
elementComponents.forEach((component) => {
  app.use(component)
})

app.use(pinia)
app.use(router)

app.mount('#app')
