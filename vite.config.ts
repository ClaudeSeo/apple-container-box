import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * shadcn CLI용 renderer 설정 래퍼
 * shadcn add 명령이 이 파일을 참조함
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  plugins: [react()]
})
