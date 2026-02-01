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
          bg: 'var(--terminal-bg)',
          fg: 'var(--terminal-fg)',
          green: 'var(--terminal-green)',
          yellow: 'var(--terminal-yellow)',
          red: 'var(--terminal-red)',
          blue: 'var(--terminal-blue)',
          purple: 'var(--terminal-purple)',
          cyan: 'var(--terminal-cyan)',
        },
        gray: {
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
          950: 'var(--gray-950)',
        }
      }
    },
  },
  plugins: [],
}
export default config
