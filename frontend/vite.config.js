import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Cloudflare Rocket Loader rewrites type="module" to a fake type and then
// never runs the bundle (CSP also blocks its eval path). The page chrome
// still loads, but #coursesOutput stays empty. data-cfasync="false" opts
// scripts out; turning Rocket Loader off in the dashboard is the live fix.
function disableCloudflareRocketLoader() {
  return {
    name: 'disable-cloudflare-rocket-loader',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<script(?![^>]*\bdata-cfasync=)/gi,
          '<script data-cfasync="false"',
        );
      },
    },
  };
}

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html',
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['js/**/*.test.js'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/openapi.json': 'http://localhost:8080',
      '/auth.md': 'http://localhost:8080',
      '/.well-known': 'http://localhost:8080',
      '/robots.txt': 'http://localhost:8080',
      '/sitemap.xml': 'http://localhost:8080',
      '/courses': 'http://localhost:8080',
      '/course': 'http://localhost:8080',
      '/program': 'http://localhost:8080',
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-96x96.png',
        'apple-touch-icon.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
        'site.webmanifest',
      ],
      manifest: {
        name: 'LU Links',
        short_name: 'LU Links',
        description: 'All courses, materials & links organized.',
        theme_color: '#0f172a',
        background_color: '#0f0f13',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    disableCloudflareRocketLoader(),
  ],
});
