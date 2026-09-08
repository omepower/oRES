// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    allowedHosts: ['ruse-clench-doing.ngrok-free.dev'],
    proxy: {
      // Whenever your React app requests /api...
      '/api': {
        target: 'http://127.0.0.1:8000', // ...forward it to Django
        changeOrigin: true,
      }
    }
  }
})



// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//     plugins: [
//         react(),
//     ],

//     server: {
//         port: 5173,
//     },
// });

