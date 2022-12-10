import { render } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { initializeSession } from '../rules/session';
import { Edict } from '../rules/EdictContext';

describe('App', () => {
  it('should render successfully', () => {
    const session = initializeSession();
    const { baseElement } = render(
      <Edict session={session}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Edict>
    );

    expect(baseElement).toBeTruthy();
  });
});
