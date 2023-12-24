import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      // Matches vitest tests in any subfolder of 'src' or into 'test/vitest/__tests__'
      // Matches all files with extension 'js', 'jsx', 'ts' and 'tsx'
      'src/**/*.vitest.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    globals: true,
    includeSource: ['src/**/*.{js,ts}'],
  },
  plugins: [
    // @ts-ignore
    vue({
      template: { transformAssetUrls },
    }),
    // @ts-ignore
    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
    // @ts-ignore
    tsconfigPaths(),
  ],
});
