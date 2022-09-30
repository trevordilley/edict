import {Condition, ConditionArgs, ConditionOptions, EnactArgs, EnactionArgs, IEdict, InsertEdictFact,} from './types';
import * as _ from 'lodash';
import {InternalFactRepresentation} from '@edict/types';
import {ConvertMatchFn, Field, PRODUCTION_ALREADY_EXISTS_BEHAVIOR, rete} from '@edict/rete';

export const insertFactToFact = <S>(
  insertion: InsertEdictFact<S>
): InternalFactRepresentation<S> => {
  // TODO: This is just weird, it doesn't like the type and I don't get why. I'm sure I'll find out when I really
  // don't want to find out!
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return _.keys(insertion)
    .map((id: string) =>
      _.keys(insertion[id]).map((attr: string) => {
        const val = _.get(insertion, `${id}.${attr}`);
        return [id, attr, val] as [string, string, any];
      })
    )
    .flat();
};
const ID_PREFIX = 'id___';
const VALUE_PREFIX = 'val___';
const idPrefix = (i: string) => `${ID_PREFIX}${i}`;

const extractId = (id: string) => id.startsWith('$')
    ? { name: idPrefix(id), field: Field.IDENTIFIER }
    : id;



export const edict = <SCHEMA>(autoFire = false): IEdict<SCHEMA> => {
  const session = rete.initSession<SCHEMA>(autoFire);
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

  const rule = <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T,
    onAlreadyExistsBehaviour: PRODUCTION_ALREADY_EXISTS_BEHAVIOR = PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR
  ) => {
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
        thenFinallyFn: enaction?.thenFinally,
        condFn: (args) => enaction?.when?.(convertMatchFn(args)) ?? true,
        convertMatchFn,
      });

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
          const conditionId = extractId(id)

          const join = options?.join
          const match = options?.match
          if(join && match) throw new Error(`Invalid options for condition $${conditionId}, join and match are mutually exclusive. Please use one or the other`)

          if(join && !_.keys(cond).includes(join)) {
            throw new Error(`Incorrect "join" usage. It must be one of the key's defined in your conditions. Valid options are ${_.keys(cond).join(",")}`)
          }

          let conditionValue
          if(match) {
            conditionValue = match
          } else if(join) {
            conditionValue = {
              name: idPrefix(join),
              field: Field.VALUE,
            }
          }
          else {
            conditionValue = {
              name: `${VALUE_PREFIX}${id}_${attr}`,
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
      rete.addProductionToSession(session, production, onAlreadyExistsBehaviour);

      return {
        query: () => rete.queryAll(session, production),
        rule: production,
      };
    };

    return { enact };
  };

  const fire = () => rete.fireRules(session);

  return {
    insert,
    retract,
    fire,
    rule,
  };
};
