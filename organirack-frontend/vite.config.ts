import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],


  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    // Necesario para que ngrok alcance el dev server
    host: true,

    // Vite 6.x bloquea hosts externos por seguridad a menos que se permitan explícitamente.
    // true permite cualquier host (ngrok, LAN, etc.) — tipo correcto en Vite 6
    allowedHosts: true,

    // Proxy inverso: las llamadas a /api y /sanctum se reenvían al backend local.
    // El browser del visitante NUNCA contacta localhost:8000 directamente;
    // lo hace el proceso de Vite en tu máquina, que sí puede alcanzarlo.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
