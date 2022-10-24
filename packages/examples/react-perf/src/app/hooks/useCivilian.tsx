import { useEffect, useState } from 'react';
import { civilians } from '../rules/rules';

export const useCivilian = (filter?: {
  id?: string;
  civilianLocationId?: string;
}) => {
  const filterQuery = filter
    ? {
        $civilian: {
          ...(filter.id && { ids: [filter.id] }),
          ...(filter.civilianLocationId && {
            civilianLocationId: [filter.civilianLocationId],
          }),
        },
      }
    : undefined;

  const [civilianData, setCivilianData] = useState(
    civilians.query(filterQuery)
  );
  useEffect(() => {
    return civilians.subscribe((c) => setCivilianData(c), filterQuery);
  });
  return civilianData;
};
