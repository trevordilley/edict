import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './app/app';
import { HashRouter } from 'react-router-dom';
import { Edict } from './rules/EdictContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <Edict>
      <HashRouter>
        <App />
      </HashRouter>
    </Edict>
  </StrictMode>
);
