import {
  Condition,
  ConditionArgs,
  ConditionOptions,
  EnactArgs,
  EnactionArgs,
  IEdict,
  InsertEdictFact,
  QueryArgs,
  QueryOneOptions,
} from './types'
import * as _ from 'lodash'
import {
  ConvertMatchFn,
  Field,
  PRODUCTION_ALREADY_EXISTS_BEHAVIOR,
  QueryFilter,
  rete,
  viz,
} from '@edict/rete'
import { insertFactToFact } from './utils'

export const attr = <T>(): T => undefined as any

const ID_PREFIX = 'id___'
const VALUE_PREFIX = 'val___'
const idPrefix = (i: string) => `${ID_PREFIX}${i}`

const extractId = (id: string) =>
  id.startsWith('$') ? { name: idPrefix(id), field: Field.IDENTIFIER } : id

const valueKey = ({
  id,
  attr,
}: {
  id: string
  attr: string | number | symbol
}) => `${VALUE_PREFIX}${id}_${String(attr)}`

export const edict = <SCHEMA extends object>(
  autoFire = true
): IEdict<SCHEMA> => {
  let session = rete.initSession<SCHEMA>(autoFire)
  const reset = () => {
    session = rete.initSession<SCHEMA>(autoFire)
  }
  const insert = (insertFacts: InsertEdictFact<SCHEMA>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)

    for (let i = 0; i < factTuples.length; i++) {
      rete.insertFact<SCHEMA>(session, factTuples[i])
    }
  }
  const retract = (id: string, ...attrs: (keyof SCHEMA)[]) => {
    attrs.map((attr) => {
      rete.retractFactByIdAndAttr<SCHEMA>(session, id, attr)
    })
  }

  const retractByConditions = (
    id: string,
    conditions: { [key in keyof SCHEMA]?: any }
  ) => {
    retract(id, ...(Object.keys(conditions) as (keyof SCHEMA)[]))
  }

  const conditions = <
    T extends {
      [ATTR in keyof Partial<SCHEMA>]:
        | ConditionOptions<SCHEMA[ATTR]>
        | undefined
    }
  >(
    conds: (schema: Condition<SCHEMA>) => T
  ): T => {
    const schema = {} as unknown as SCHEMA
    return conds(schema)
  }

  const rule = <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T,
    onAlreadyExistsBehaviour?: PRODUCTION_ALREADY_EXISTS_BEHAVIOR
  ) => {
    const onAlreadyExists =
      onAlreadyExistsBehaviour ?? PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR
    const convertMatchFn: ConvertMatchFn<SCHEMA, EnactArgs<SCHEMA, T>> = (
      args
    ) => {
      // This is where we need to convert the dictionary to the
      // js object we want
      const result = {}

      for (const [k, v] of args) {
        if (k.startsWith(ID_PREFIX)) {
          const id = k.replace(ID_PREFIX, '')
          _.set(result, id, { id: args.get(k) })
        }
      }

      for (const [k, v] of args) {
        if (k.startsWith(VALUE_PREFIX)) {
          const value = k.replace(VALUE_PREFIX, '')
          const [id, attr] = value.split('_')
          if (!_.get(result, id)) {
            _.set(result, id, { id })
          }
          _.set(result, `${id}.${attr}`, args.get(k))
        }
      }

      return result as EnactArgs<SCHEMA, T>
    }

    const enact = (enaction?: EnactionArgs<SCHEMA, T>) => {
      const production = rete.initProduction<SCHEMA, EnactArgs<SCHEMA, T>>({
        name: name,
        thenFn: (args) => {
          enaction?.then?.(args.vars)
        },
        condFn: (args) => enaction?.when?.(convertMatchFn(args)) ?? true,
        convertMatchFn,
      })
      if (enaction?.thenFinally !== undefined) {
        production.thenFinallyFn = (session) =>
          enaction?.thenFinally?.(() => rete.queryAll(session, production))
      }
      // Cast to signal type info, not actually used
      // TODO: Do we need to do things this way?
      const schema = {} as unknown as SCHEMA
      const cond = conditions(schema)
      const keys = _.keys(cond)
      for (let i = 0; i < keys.length; i++) {
        const id = keys[i]
        const attrs = _.keys(_.get(cond, id)) as [keyof SCHEMA]
        for (let j = 0; j < attrs.length; j++) {
          const attr = attrs[j]
          const options: ConditionOptions<unknown> | undefined = _.get(
            cond,
            `${id}.${attr}`
          )
          const conditionId = extractId(id)

          const join = options?.join
          const match = options?.match
          if (join && match)
            throw new Error(
              `Invalid options for condition $${conditionId}, join and match are mutually exclusive. Please use one or the other`
            )

          if (join && !_.keys(cond).includes(join)) {
            throw new Error(
              `Incorrect "join" usage. It must be one of the key's defined in your conditions. Valid options are ${_.keys(
                cond
              ).join(',')}`
            )
          }

          let conditionValue
          if (match !== undefined) {
            conditionValue = match
          } else if (join) {
            conditionValue = {
              name: idPrefix(join),
              field: Field.VALUE,
            }
          } else {
            conditionValue = {
              name: valueKey({ id, attr }),
              field: Field.VALUE,
            }
          }

          rete.addConditionsToProduction(
            production,
            conditionId,
            attr,
            conditionValue,
            options?.then ?? true
          )
        }
      }

      rete.addProductionToSession(session, production, onAlreadyExists)
      const convertFilterArgs = (filter: QueryArgs<SCHEMA, T>) => {
        const joinIds = Object.keys(filter)

        const filters: QueryFilter<SCHEMA> = new Map()
        for (const joinId of joinIds) {
          const filterAttrs = Object.keys(filter[joinId]!)
          for (const attr of filterAttrs) {
            // TODO: Make this type-safe?
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const filterAttrQueries = filter[joinId]?.[attr]
            if (!filterAttrQueries) continue
            if (attr === 'ids') {
              const idKey = idPrefix(joinId)
              filters.set(idKey, filterAttrQueries)
            } else {
              const idKey = valueKey({ id: joinId, attr })
              filters.set(idKey, filterAttrQueries)
            }
          }
        }
        return filters
      }

      const query = (filter?: QueryArgs<SCHEMA, T>) => {
        if (!filter) return rete.queryAll(session, production)
        return rete.queryAll(session, production, convertFilterArgs(filter))
      }

      const queryOne = (
        filter?: QueryArgs<SCHEMA, T>,
        options?: QueryOneOptions
      ) => {
        const result = query(filter)
        if (result.length > 1 && options?.shouldThrowExceptionOnMoreThanOne) {
          throw new Error('queryOne returned more than one result!')
        }

        return result.pop()
      }
      const subscribe = (
        fn: (results: EnactArgs<SCHEMA, T>[]) => void,
        filter?: QueryArgs<SCHEMA, T>
      ) =>
        rete.subscribeToProduction(
          session,
          production,
          fn,
          filter !== undefined ? convertFilterArgs(filter) : undefined
        )
      const subscribeOne = (
        fn: (results: EnactArgs<SCHEMA, T> | undefined) => void,
        filter?: QueryArgs<SCHEMA, T>,
        options?: QueryOneOptions
      ) =>
        rete.subscribeToProduction(
          session,
          production,
          (results) => {
            if (
              results.length > 1 &&
              options?.shouldThrowExceptionOnMoreThanOne
            ) {
              throw new Error(
                `subscribeOne received more than one result! ${results.length} received!`
              )
            }

            const item = results.pop()
            fn(item)
          },
          filter !== undefined ? convertFilterArgs(filter) : undefined
        )

      return {
        query,
        queryOne,
        subscribe,
        subscribeOne,
        rule: production,
      }
    }

    return { enact }
  }

  const fire = (recursionLimit?: number) =>
    rete.fireRules(session, recursionLimit)

  const dotFile = () => viz(session)

  const perf = () => {
    const frames: PerformanceEntryList[] = []

    const capture = () => {
      const entries = performance.getEntriesByType('measure')
      frames.push(entries)
      performance.clearMeasures()
      performance.clearMarks()
      return entries
    }

    return {
      frames,
      capture,
    }
  }

  return {
    insert,
    retract,
    retractByConditions,
    fire,
    conditions,
    rule,
    reset,
  }
}
