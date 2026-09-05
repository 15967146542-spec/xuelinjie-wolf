import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // 500 阈值下两个剩余超限 chunk 均为"整块"不可再分：
    //  1) echarts 按需内核 ~561 kB（gzip 189）
    //  2) 全站共享的 mock 教师/行情数据 chunk ~697 kB（gzip 116）
    // 二者已按官方建议拆为独立 vendor chunk 便于缓存与按需加载。
    // 阈值提到 750：业务代码（最大 338 kB）异常膨胀仍会触发告警。
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        // R16：把大体积 vendor 拆成独立 chunk，避免单 chunk 超过 500 kB
        // 且不随业务代码变化而失效缓存
        codeSplitting: {
          groups: [
            { name: 'echarts-vendor', test: /[\\/]node_modules[\\/]echarts[\\/]/ },
            { name: 'element-vendor', test: /[\\/]node_modules[\\/](element-plus|@element-plus)[\\/]/ },
            { name: 'vue-vendor', test: /[\\/]node_modules[\\/](vue|@vue|pinia|vue-router)[\\/]/ },
            { name: 'xlsx-vendor', test: /[\\/]node_modules[\\/](xlsx|cfb|ssf|codepage|adler-32|crc-32|frac|printj|wmf)[\\/]/ }
          ]
        }
      }
    }
  }
})