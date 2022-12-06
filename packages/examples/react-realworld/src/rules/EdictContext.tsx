import * as React from 'react';
import { createContext, PropsWithChildren, useContext } from 'react';
import { EdictSession, initializeSession } from './session';

const EdictContext = createContext<EdictSession | undefined>(undefined);
export const Edict = (props: PropsWithChildren<any>) => {
  return (
    <EdictContext.Provider value={initializeSession()}>
      {props.children}
    </EdictContext.Provider>
  );
};

export const useEdict = () => {
  const session = useContext(EdictContext);
  if (!session) throw new Error('Calling useEdict with an undefined session?');
  return session;
};
