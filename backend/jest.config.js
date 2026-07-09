module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/database/migrations/**',
        '!src/database/seeders/**',
        '!src/test/**',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    globalSetup: '<rootDir>/src/test/globalSetup.ts',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    // Integration suites share one Postgres DB, so run serially to avoid
    // cross-suite races and seed-data collisions.
    maxWorkers: 1,
    testTimeout: 30000,
    verbose: true,
};
