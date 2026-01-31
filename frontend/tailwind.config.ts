import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#0d1117',
          fg: '#c9d1d9',
          green: '#3fb950',
          yellow: '#d29922',
          red: '#f85149',
          blue: '#58a6ff',
          purple: '#bc8cff',
          cyan: '#39c5cf',
        }
      }
    },
  },
  plugins: [],
}
export default config
