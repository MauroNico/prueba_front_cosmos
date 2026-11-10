import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import glsl from 'vite-plugin-glsl';

function preloadLatinFontsPlugin(): Plugin {
  return {
    name: 'preload-latin-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const tags: {
          tag: string;
          attrs: Record<string, string | boolean>;
          injectTo: 'head-prepend';
        }[] = [];

        if (ctx.bundle) {
          for (const fileName of Object.keys(ctx.bundle)) {
            if (
              fileName.endsWith('.woff2') &&
              (fileName.includes('fraunces-latin-wght-normal') ||
                fileName.includes('jetbrains-mono-latin-wght-normal'))
            ) {
              tags.push({
                tag: 'link',
                attrs: {
                  rel: 'preload',
                  href: `/${fileName}`,
                  as: 'font',
                  type: 'font/woff2',
                  crossorigin: '',
                },
                injectTo: 'head-prepend',
              });
            }
          }
        } else {
          tags.push(
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                href: '/node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
                as: 'font',
                type: 'font/woff2',
                crossorigin: '',
              },
              injectTo: 'head-prepend',
            },
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                href: '/node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
                as: 'font',
                type: 'font/woff2',
                crossorigin: '',
              },
              injectTo: 'head-prepend',
            },
          );
        }

        return tags;
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadLatinFontsPlugin(),
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      defaultExtension: 'glsl',
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) {
            return 'vendor-three';
          }
          if (
            id.includes('node_modules/@react-three/postprocessing') ||
            id.includes('node_modules/postprocessing')
          ) {
            return 'vendor-postprocessing';
          }
          if (
            id.includes('node_modules/@react-three/fiber') ||
            id.includes('node_modules/@react-three/drei')
          ) {
            return 'vendor-r3f';
          }
          if (id.includes('node_modules/leva')) {
            return 'vendor-leva';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/motion')) {
            return 'vendor-animation';
          }
          if (id.includes('/src/shaders/')) {
            return 'shaders';
          }
        },
      },
    },
  },
});
