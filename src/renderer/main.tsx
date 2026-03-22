import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { name, version } from '../../package.json';

function printVersionInfo() {
  console.log(
    `%cYou are running %c${name}%c v${version}%c.`,
    'color: gray;',
    'color: magenta;',
    'color: lightgreen;',
    'color: gray;'
  );
}

printVersionInfo();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
