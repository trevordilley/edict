import { useEffect, useState } from 'react';
import { locations } from '../rules/rules';

export const useLocations = () => {
  const [locationData, setLocationData] = useState(locations.query());
  useEffect(() => {
    return locations.subscribe((l) => setLocationData(l));
  });

  return locationData;
};
