module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)', '<rootDir>/legacy/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@legacy/(.*)$': '<rootDir>/legacy/$1',
  },
  // jest-expo's default list, plus `immer`: Redux Toolkit pulls it in, and it
  // ships ESM under the `react-native` export condition, so it has to go
  // through Babel like the Expo packages do.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|immer))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
};
