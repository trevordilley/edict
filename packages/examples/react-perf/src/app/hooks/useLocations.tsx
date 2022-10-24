import { useEffect, useState } from 'react';
import { locations } from '../rules/rules';

export const useLocations = (filter?: { id?: string; provinceId?: string }) => {
  const filterQuery = filter
    ? {
        $location: {
          ...(filter.id && { ids: [filter.id] }),
          ...(filter.provinceId && { locationProvinceId: [filter.provinceId] }),
        },
      }
    : undefined;

  const [locationData, setLocationData] = useState(
    locations.query(filterQuery)
  );
  useEffect(() => {
    return locations.subscribe((l) => setLocationData(l), filterQuery);
  });

  return locationData;
};
