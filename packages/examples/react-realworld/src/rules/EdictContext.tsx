import * as React from 'react';
import { createContext, PropsWithChildren, useContext } from 'react';
import { EdictSession } from './session';

const EdictContext = createContext<EdictSession | undefined>(undefined);
export const Edict = (props: PropsWithChildren<{ session: EdictSession }>) => {
  return (
    <EdictContext.Provider value={props.session}>
      {props.children}
    </EdictContext.Provider>
  );
};

export const useEdict = () => {
  const session = useContext(EdictContext);
  if (!session) throw new Error('Calling useEdict with an undefined session?');
  return session;
};
