import { useEffect, useState } from 'react';
import { errorRule } from './error';

export const useErrors = () => {
  const [errors, setErrors] = useState(errorRule.query()[0]);

  useEffect(() => {
    return errorRule.subscribe((e) => setErrors(e[0]));
  });

  return errors;
};
