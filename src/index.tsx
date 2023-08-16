/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import './index.css'
import { LogLevel, newLogger } from './pkg/logger'

globalThis.logger = newLogger(import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO)

const root = document.getElementById('root')

if (root == null || (import.meta.env.DEV && !(root instanceof HTMLElement))) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  )
}
render(() => <App />, root)
