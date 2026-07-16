export default {
  darkMode: 'class',
  content: [
    './*.html',
    './admin/**/*.html',
    './pages/**/*.html',
    './components/**/*.html',
    './main.js',
    './src/**/*.js',
    './public/mock-api/**/*.html',
  ],
  safelist: [
    'lg:ml-64', 'lg:ml-0', 'lg:left-64', 'lg:left-0',
    'animate-spin', 'text-primary', 'w-4', 'h-4', 'text-gray-400', 'flex-shrink-0',
  ],
  theme: { extend: { colors: { primary: '#1890ff' } } },
  plugins: []
}
