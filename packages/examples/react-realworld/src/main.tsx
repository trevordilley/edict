import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './app/app';
import { HashRouter } from 'react-router-dom';
import { Edict } from './rules/EdictContext';
import { initializeSession } from './rules/session';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const session = initializeSession();
root.render(
  <StrictMode>
    <Edict session={session}>
      <HashRouter>
        <App />
      </HashRouter>
    </Edict>
  </StrictMode>
);
