/**
 * Chỉ chạy cho các module thuần TypeScript trong src/lib — không React, không I/O, nên
 * test được mà không cần dựng server hay jsdom. (E2E của giao diện vẫn dùng Playwright
 * ở frontend/e2e.) Mở rộng từ chỉ `src/lib/seo` sang cả `src/lib` để test được thêm
 * `lib/locations/group.ts`, `lib/site-layout.ts`.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lib'],
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
