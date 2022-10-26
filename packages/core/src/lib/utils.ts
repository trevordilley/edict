import { InsertEdictFact } from '@edict/core';
import { InternalFactRepresentation } from '@edict/types';

export const insertFactToFact = <S>(
  insertion: InsertEdictFact<S>
): InternalFactRepresentation<S> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Object.keys(insertion)
    .map((id: string) =>
      Object.keys(insertion[id]).map((attr: string) => {
        // @ts-ignore
        const val = insertion[id][attr];
        return [id, attr, val] as [string, string, any];
      })
    )
    .flat();
};
