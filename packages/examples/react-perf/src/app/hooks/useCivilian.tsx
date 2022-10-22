import { useEffect, useState } from 'react';
import { civilians } from '../rules/rules';

export const useCivilian = () => {
  const [civilianData, setCivilianData] = useState(civilians.query());
  useEffect(() => {
    return civilians.subscribe((c) => setCivilianData(c));
  });
  return civilianData;
};
