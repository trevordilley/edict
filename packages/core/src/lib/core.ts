import {
  Condition,
  ConditionArgs,
  ConditionOptions,
  EnactArgs,
  EnactionArgs,
  IEdict,
  InsertEdictFact,
  QueryArgs,
} from './types';
import * as _ from 'lodash';
import {
  ConvertMatchFn,
  Field,
  PRODUCTION_ALREADY_EXISTS_BEHAVIOR,
  QueryFilter,
  rete,
  viz,
} from '@edict/rete';
import { insertFactToFact } from './utils';

const ID_PREFIX = 'id___';
const VALUE_PREFIX = 'val___';
const idPrefix = (i: string) => `${ID_PREFIX}${i}`;

const extractId = (id: string) =>
  id.startsWith('$') ? { name: idPrefix(id), field: Field.IDENTIFIER } : id;

const valueKey = ({
  id,
  attr,
}: {
  id: string;
  attr: string | number | symbol;
}) => `${VALUE_PREFIX}${id}_${String(attr)}`;

export const edict = <SCHEMA>(
  autoFire = false,
  debug = false
): IEdict<SCHEMA> => {
  const session = rete.initSession<SCHEMA>(autoFire, debug);
  const insert = (insertFacts: InsertEdictFact<SCHEMA>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts);

    factTuples.forEach((fact) => {
      rete.insertFact<SCHEMA>(session, fact);
    });
  };
  const retract = (id: string, ...attrs: (keyof SCHEMA)[]) => {
    attrs.map((attr) => {
      rete.retractFactByIdAndAttr<SCHEMA>(session, id, attr);
    });
  };

  const conditions = <T extends ConditionArgs<SCHEMA>>(
    conds: (schema: Condition<SCHEMA>) => T
  ): T => {
    const schema = {} as unknown as SCHEMA;
    return conds(schema);
  };

  const rule = <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T,
    onAlreadyExistsBehaviour?: PRODUCTION_ALREADY_EXISTS_BEHAVIOR
  ) => {
    const onAlreadyExists =
      onAlreadyExistsBehaviour ?? PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR;
    const convertMatchFn: ConvertMatchFn<SCHEMA, EnactArgs<SCHEMA, T>> = (
      args
    ) => {
      // This is where we need to convert the dictionary to the
      // js object we want
      const result = {};

      args.forEach((v, k) => {
        if (k.startsWith(ID_PREFIX)) {
          const id = k.replace(ID_PREFIX, '');
          _.set(result, id, { id: args.get(k) });
        }
      });

      args.forEach((v, k) => {
        if (k.startsWith(VALUE_PREFIX)) {
          const value = k.replace(VALUE_PREFIX, '');
          const [id, attr] = value.split('_');
          if (!_.get(result, id)) {
            _.set(result, id, { id });
          }
          _.set(result, `${id}.${attr}`, args.get(k));
        }
      });

      return result as EnactArgs<SCHEMA, T>;
    };

    const enact = (enaction?: EnactionArgs<SCHEMA, T>) => {
      const production = rete.initProduction<SCHEMA, EnactArgs<SCHEMA, T>>({
        name: name,
        thenFn: (args) => {
          enaction?.then?.(args.vars);
        },
        condFn: (args) => enaction?.when?.(convertMatchFn(args)) ?? true,
        convertMatchFn,
      });
      if (enaction?.thenFinally !== undefined) {
        production.thenFinallyFn = (session) =>
          enaction?.thenFinally?.(() => rete.queryAll(session, production));
      }
      // Cast to signal type info, not actually used
      // TODO: Do we need to do things this way?
      const schema = {} as unknown as SCHEMA;
      const cond = conditions(schema);
      _.keys(cond).forEach((id) => {
        const attrs = _.keys(_.get(cond, id)) as [keyof SCHEMA];
        attrs.forEach((attr) => {
          const options: ConditionOptions<unknown> | undefined = _.get(
            cond,
            `${id}.${attr}`
          );
          const conditionId = extractId(id);

          const join = options?.join;
          const match = options?.match;
          if (join && match)
            throw new Error(
              `Invalid options for condition $${conditionId}, join and match are mutually exclusive. Please use one or the other`
            );

          if (join && !_.keys(cond).includes(join)) {
            throw new Error(
              `Incorrect "join" usage. It must be one of the key's defined in your conditions. Valid options are ${_.keys(
                cond
              ).join(',')}`
            );
          }

          let conditionValue;
          if (match) {
            conditionValue = match;
          } else if (join) {
            conditionValue = {
              name: idPrefix(join),
              field: Field.VALUE,
            };
          } else {
            conditionValue = {
              name: valueKey({ id, attr }),
              field: Field.VALUE,
            };
          }

          rete.addConditionsToProduction(
            production,
            conditionId,
            attr,
            conditionValue,
            options?.then ?? true
          );
        });
      });
      rete.addProductionToSession(session, production, onAlreadyExists);

      const convertFilterArgs = (filter: QueryArgs<SCHEMA, T>) => {
        const joinIds = Object.keys(filter);

        const filters: QueryFilter<SCHEMA> = new Map();
        for (const joinId of joinIds) {
          const filterAttrs = Object.keys(filter[joinId]!);
          for (const attr of filterAttrs) {
            // TODO: Make this type-safe?
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const filterAttrQueries = filter[joinId]?.[attr];
            if (!filterAttrQueries) continue;
            if (attr === 'ids') {
              const idKey = idPrefix(joinId);
              filters.set(idKey, filterAttrQueries);
            } else {
              const idKey = valueKey({ id: joinId, attr });
              filters.set(idKey, filterAttrQueries);
            }
          }
        }
        return filters;
      };

      return {
        query: (filter?: QueryArgs<SCHEMA, T>) => {
          if (!filter) return rete.queryAll(session, production);
          return rete.queryAll(session, production, convertFilterArgs(filter));
        },
        subscribe: (
          fn: (results: EnactArgs<SCHEMA, T>[]) => void,
          filter?: QueryArgs<SCHEMA, T>
        ) =>
          rete.subscribeToProduction(
            session,
            production,
            fn,
            filter !== undefined ? convertFilterArgs(filter) : undefined
          ),
        rule: production,
      };
    };

    return { enact };
  };

  const fire = (recurisionLimit?: number) =>
    rete.fireRules(session, recurisionLimit);

  const dotFile = () => viz(session);

  const perf = () => {
    const frames: PerformanceEntryList[] = [];

    const capture = () => {
      const entries = performance.getEntriesByType('measure');
      frames.push(entries);
      performance.clearMeasures();
      performance.clearMarks();
      return entries;
    };

    return {
      frames,
      capture,
    };
  };

  return {
    insert,
    retract,
    fire,
    conditions,
    rule,
    debug: {
      dotFile,
      perf,
    },
  };
};
