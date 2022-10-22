import { useEffect, useState } from 'react';
import { provinces } from '../rules/rules';
import { useLocations } from './useLocations';

export const useProvinces = () => {
  const [provinceData, setProvinceData] = useState(provinces.query());
  const locations = useLocations();
  useEffect(() => {
    return provinces.subscribe((p) => setProvinceData(p));
  });
  return provinceData;
};
