import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'

export default defineConfig({
    main: {},
    preload: {},
    renderer: {
        root: resolve(__dirname, 'src/renderer'),
        build: {
            rollupOptions: {
                input: resolve(__dirname, 'src/renderer/index.html')
            }
        }
    }
})