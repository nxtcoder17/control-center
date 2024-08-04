/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import './index.css'
import { LogLevel, newLogger } from './pkg/logger'

const isDev = import.meta.env.VITE_RUN_MODE === 'dev'

globalThis.logger = newLogger(isDev ? LogLevel.DEBUG : LogLevel.INFO)

const root = document.getElementById('root')

if (root == null || (isDev && !(root instanceof HTMLElement))) {
	throw new Error(
		'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
	)
}
render(() => <App />, root)
