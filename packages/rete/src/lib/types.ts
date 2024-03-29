// This is a map of string to one of the elements of a fact tuple
// So for a fact ["bob", "age", 13] this could be a map from
// string to string | number

import { Auditor } from './audit'

export type ValueOf<T> = T[keyof T]
export type FactFragment<SCHEMA> = FactId | keyof SCHEMA | ValueOf<SCHEMA>
export type MatchT<SCHEMA> = Map<string, FactFragment<SCHEMA>>
export type QueryFilter<SCHEMA> = Map<string, FactFragment<SCHEMA>[]>

export enum PRODUCTION_ALREADY_EXISTS_BEHAVIOR {
  QUIET,
  WARN,
  ERROR,
}

export enum Field {
  IDENTIFIER,
  ATTRIBUTE,
  VALUE,
}

export type FactId = number | string | Var
// Shorten that name a bit
export type InternalFactRepresentation<SCHEMA> = [FactId, keyof SCHEMA, any]
export type Fact<T> = InternalFactRepresentation<T>

export type IdAttr<S> = [FactId, keyof S]
export type IdAttrs<S> = IdAttr<S>[]
export enum TokenKind {
  INSERT,
  RETRACT,
  UPDATE,
}
export interface Binding<T> {
  name: string
  value: FactFragment<T>
  parentBinding?: Binding<T>
}

export interface Token<T> {
  fact: Fact<T>
  kind: TokenKind
  // Only for Update Tokens
  oldFact?: Fact<T>
}

/** Matches **/

export interface Var {
  name: string
  field: Field
}

export interface Match<T> {
  id: number
  // vars?: MatchT<T>
  bindings?: Binding<T>
  enabled?: boolean
}

/** functions **/
export type ThenFn<T, U> = (then: {
  session: Session<T>
  rule: Production<T, U>
  vars: U
}) => Promise<void> | void
export type WrappedThenFn<SCHEMA> = (
  vars: MatchT<SCHEMA>
) => Promise<void> | void
export type ThenFinallyFn<T, U> = (
  session: Session<T>,
  rule: Production<T, U>
) => Promise<void> | void
export type WrappedThenFinallyFn = () => Promise<void> | void
export type ConvertMatchFn<T, U> = (vars: MatchT<T>) => U
export type CondFn<T> = (vars: MatchT<T>) => boolean
export type InitMatchFn<T> = () => MatchT<T>

/** Alpha Network **/
export interface AlphaNode<T> {
  id: number
  testField?: Field
  testValue?: keyof T | FactId

  facts: Map<string, Map<string, Fact<T>>>
  successors: JoinNode<T>[]
  children: AlphaNode<T>[]
}

export enum MEMORY_NODE_TYPE {
  PARTIAL,
  LEAF,
}

export type IdAttrsHash = number

export interface MemoryNode<T> {
  id: number
  parent: JoinNode<T>
  child?: JoinNode<T>
  leafNode?: MemoryNode<T>
  lastMatchId: number
  // matches key is a
  matches: Map<IdAttrsHash, { idAttrs: IdAttrs<T>; match: Match<T> }>
  matchIds: Map<IdAttrsHash, IdAttrs<T>>
  condition: Condition<T>
  ruleName: string
  type: MEMORY_NODE_TYPE
  nodeType?: LeafNode<T>
}

export interface LeafNode<T> {
  condFn?: CondFn<T>
  thenFn?: WrappedThenFn<T>
  thenFinallyFn?: WrappedThenFinallyFn
  trigger?: boolean
}

export interface JoinNode<T> {
  id: number
  parent?: MemoryNode<T>
  child?: MemoryNode<T>
  alphaNode: AlphaNode<T>
  condition: Condition<T>
  idName?: string
  oldIdAttrs: Set<IdAttrsHash>
  disableFastUpdates?: boolean
  ruleName: string
}

/** Session **/

export interface Condition<T> {
  nodes: [Field, keyof T | FactId][]
  vars: Var[]
  shouldTrigger: boolean
}

export interface Production<T, U> {
  name: string
  conditions: Condition<T>[]
  convertMatchFn: ConvertMatchFn<T, U>
  subscriptions: Set<{
    callback: (results: U[]) => void
    filter?: QueryFilter<T>
  }>
  condFn?: CondFn<T>
  thenFn?: ThenFn<T, U>
  thenFinallyFn?: ThenFinallyFn<T, U>
}

interface Mutation<T> {
  kind: 'insert' | 'retract'
  fact: Fact<T>
}

export interface DebugFrame<T> {
  initialMutations: Mutation<T>[]
  startingFacts: Fact<T>[]
  endingFacts: Fact<T>[]
  dt: number
  triggeredRules: {
    ruleName: string
    kind: 'then' | 'thenFinally'
    vars?: MatchT<T>
  }[]
}

export const DEFAULT_MAX_FRAME_DUMPS = 40

export interface DebugOptions {
  enabled?: boolean
  maxFrameDumps?: number
  onBeforeThen?: (node: MemoryNode<any>) => void
  onAfterThen?: (node: MemoryNode<any>) => void
  onBeforeThenFinally?: (node: MemoryNode<any>) => void
  onAfterThenFinally?: (node: MemoryNode<any>) => void
}
export interface Debug<T> extends DebugOptions {
  numFramesSinceInit: number
  frames: DebugFrame<T>[]
  mutationsSinceLastFire: Mutation<T>[]
}

// TODO: store the WMEs in a singular data structure and reference by index?
// internally we would look up an id or attr by name once and use the index
// Throughout the rest of the algorithm.
//
// This would likely simplify cacheline targeted optimizations and/or table
// oriented redactors?
export interface Session<T> {
  alphaNode: AlphaNode<T>
  leafNodes: Map<string, MemoryNode<T>>
  idAttrNodes: Map<
    IdAttrsHash,
    { alphaNodes: Set<AlphaNode<T>>; idAttr: IdAttr<T> }
  >
  insideRule: boolean
  thenQueue: Set<[node: MemoryNode<T>, idAttrsHash: IdAttrsHash]>
  thenFinallyQueue: Set<MemoryNode<T>>
  triggeredNodeIds: Set<MemoryNode<T>>
  subscriptionsOnProductions: Map<string, () => void>
  triggeredSubscriptionQueue: Set<string>
  autoFire: boolean
  initMatch: InitMatchFn<T>
  nextId: () => number
  auditor?: Auditor
}

export type ExecutedNodes<T> = Map<MemoryNode<T>, Set<MemoryNode<T>>>[]
