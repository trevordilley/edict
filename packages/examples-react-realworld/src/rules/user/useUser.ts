import { useEffect, useState } from 'react';
import { userRule } from './user';

export const useUser = () => {
  const [user, setUser] = useState(userRule.queryOne()?.$user);
  useEffect(() => {
    return userRule.subscribeOne((u) => setUser(u?.$user));
  });

  return user;
};
