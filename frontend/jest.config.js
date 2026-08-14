/**
 * Chỉ chạy cho lớp quyết định SEO trong src/lib/seo — các module này thuần TypeScript,
 * không React, không I/O, nên test được mà không cần dựng server hay jsdom.
 * (E2E của giao diện vẫn dùng Playwright ở frontend/e2e.)
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lib/seo'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          target: 'es2020',
          esModuleInterop: true,
          jsx: 'react',
          strict: false,
        },
      },
    ],
  },
};
