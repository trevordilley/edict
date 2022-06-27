
/*** Facts ***/
export enum Field {
  IDENTIFIER,
  ATTRIBUTE,
  VALUE
}

export interface Fact<T> {
  id: T,
  attr: T,
  value: T
}

export enum TOKEN_KIND {
  INSERT,
  RETRACT,
  UPDATE
}

export interface Token<T> {
  fact: Fact<T>,
  kind: TOKEN_KIND
  // Only for Update Tokens
  oldFact?: Fact<T>
}

export type IdAttr = [number, number]
export type IdAttrs = IdAttr[]

/** Matches **/

export type Vars<T> = Map<string, T>
export interface Var {
  name: string,
  field: Field
}

export interface Match<T> {
  id: number,
  vars: T,
  enabled: boolean
}

/** functions **/
export type ThenFn<T,U, MatchT> = (session: Session<T, MatchT>, rule: Production<T,U,MatchT>) => void
export type WrappedThenFn<MatchT> = (vars: MatchT) => void
export type ThenFinallyFn<T,U,MatchT> = (session: Session<T, MatchT>, rule: Production<T,U,MatchT>) => void
export type WrappedThenFinallyFn = () => void
export type ConvertMatchFn<MatchT, U> = (vars: MatchT) => U
export type CondFn<MatchT> = (vars: MatchT) => boolean
export type InitMatchFn<MatchT> = (ruleName: string) => MatchT

/** Beta Network **/
export interface JoinNode<T, MatchT> {
  parent: MemoryNode<T, MatchT >,
  child: MemoryNode<T, MatchT>,
  alphaNode: AlphaNode<T, MatchT>,
  condition: Condition<T>,
  idName: string,
  oldIdAttrs: Set<IdAttr>,
  disableFastUpdates: boolean,
  ruleName: string
}



export enum MEMORY_NODE_TYPE {
  PARTIAL,
  LEAF
}

export interface LeafNode<MatchT> {
  condFn: CondFn<MatchT>
  thenFn: WrappedThenFn<MatchT>
  thenFinallyFn: WrappedThenFinallyFn,
  trigger: boolean
}

export interface MemoryNode<T, MatchT> {
  parent: JoinNode<T, MatchT>,
  child: JoinNode<T,MatchT>,
  leafNode: MemoryNode<T, MatchT>,
  lastMatchId: number,
  matches: Map<IdAttrs, Match<MatchT>>
  matchIds: Map<number, IdAttrs>,
  condition: Condition<T>,
  ruleName: string,
  type: MEMORY_NODE_TYPE,
  nodeType?: LeafNode<MatchT>
}

/** Alpha Network **/
export interface AlphaNode<T, MatchT> {
  testField: Field,
  testValue: T,
  facts: Map<number, Map<number, Fact<T>>>,
  successors: JoinNode<T, MatchT>[],
  children: AlphaNode<T, MatchT>[]
}
/** Session **/

export interface Condition<T> {
  nodes: [Field, T][],
  vars: Var[]
  shouldTrigger: boolean
}



export interface Production<T, U, MatchT> {
  name: string,
  conditions: Condition<T>[],
  convertMatchFn: ConvertMatchFn<MatchT, U>
  condFn: CondFn<MatchT>,
  thenFn: ThenFn<T, U, MatchT>
  thenFinallyFn: ThenFinallyFn<T, U, MatchT>
}

export interface Session<T, MatchT> {
  alphaNode: AlphaNode<T, MatchT>,
  leafNodes: Map< string, MemoryNode<T, MatchT>>,
  idAttrNodes: Map<IdAttr, Set<AlphaNode<T, MatchT>>>,
  insideRule: boolean,
  thenQueue: Set<[node: MemoryNode<T, MatchT>, idAttrs: IdAttrs]>
  thenFinallyQueue: Set<MemoryNode<T,MatchT>>
  triggeredNodeIds: Set<MemoryNode<T, MatchT>>
  autoFire: boolean,
  initMatch: InitMatchFn<MatchT>
}

