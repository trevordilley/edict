import { useEffect, useState } from 'react';
import { userRule } from '../rules/rules';

export const useUser = () => {
  const [user, setUser] = useState(userRule.query()[0]);
  useEffect(() => {
    return userRule.subscribe((u) => setUser(u[0]));
  });

  return user;
};
