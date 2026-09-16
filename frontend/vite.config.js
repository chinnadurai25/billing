import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

function syncToRootPlugin() {
  return {
    name: 'sync-to-root',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const rootDir = path.resolve(__dirname, '..')

      if (fs.existsSync(distDir)) {
        // Clean old root assets folder so old hashed .js and .css files don't accumulate
        const rootAssetsDir = path.join(rootDir, 'assets')
        if (fs.existsSync(rootAssetsDir)) {
          fs.rmSync(rootAssetsDir, { recursive: true, force: true })
        }

        fs.cpSync(distDir, rootDir, { recursive: true, force: true })
        console.log('🚀 Build output successfully synced to repository root for Hostinger!')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncToRootPlugin()],
})
