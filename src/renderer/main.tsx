import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

import { name, version } from '../../package.json'

async function printVersionInfo() {
  console.log(
    `%cYou are running %c${name}%c v${version}%c.`,
    'color: gray;',
    'color: magenta;', // name
    'color: lightgreen;', // version
    'color: gray;' // reset
  )
}

printVersionInfo().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
