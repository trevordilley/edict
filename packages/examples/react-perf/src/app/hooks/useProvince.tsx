import { useEffect, useState } from 'react';
import { provinces } from '../rules/rules';
import { useLocations } from './useLocations';

export const useProvinces = (filter?: {
  id?: string;
  provinceName?: string;
}) => {
  const queryFilter = filter
    ? {
        $province: {
          ...(filter.id && { ids: [filter.id] }),
          ...(filter.provinceName && { provinceName: [filter.provinceName] }),
        },
      }
    : undefined;

  const [provinceData, setProvinceData] = useState(
    provinces.query(queryFilter)
  );
  const locations = useLocations();
  useEffect(() => {
    return provinces.subscribe((p) => setProvinceData(p), queryFilter);
  });
  return provinceData;
};
