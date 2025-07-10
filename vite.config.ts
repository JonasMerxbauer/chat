import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
  ],
})
