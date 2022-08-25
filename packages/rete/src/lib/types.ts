
/*** Facts ***/
import {IdAttr, IdAttrs, InternalFactRepresentation} from "@edict/types";

// This is a map of string to one of the elements of a fact tuple
// So for a fact ["bob", "age", 13] this could be a map from
// string to string | number
export type ValueOf<T> = T[keyof T];
export type FactFragment<SCHEMA> = string | keyof SCHEMA |  ValueOf<SCHEMA>
export type MatchT<SCHEMA> = Map<string, FactFragment<SCHEMA>>

export enum Field {
  IDENTIFIER,
  ATTRIBUTE,
  VALUE
}

// Shorten that name a bit
export type Fact<T> = InternalFactRepresentation<T>

export enum TokenKind {
  INSERT,
  RETRACT,
  UPDATE
}

export interface Token<T> {
  fact: Fact<T>,
  kind: TokenKind
  // Only for Update Tokens
  oldFact?: Fact<T>
}


/** Matches **/

export type Vars<T> = Map<string, T>
export interface Var {
  name: string,
  field: Field
}

export interface Match<T> {
  id: number,
  vars?: MatchT<T>,
  enabled?: boolean
}

/** functions **/
export type ThenFn<T,U> = (session: Session<T>, rule: Production<T,U>, vars: U) => void
export type WrappedThenFn<SCHEMA> = (vars: MatchT<SCHEMA>) => void
export type ThenFinallyFn<T,U> = (session: Session<T>, rule: Production<T,U>) => void
export type WrappedThenFinallyFn = () => void
export type ConvertMatchFn<T,U> = (vars: MatchT<T>) => U
export type CondFn<T> = (vars: MatchT<T>) => boolean
export type InitMatchFn<T> = (ruleName: string) => MatchT<T>


/** Alpha Network **/
export interface AlphaNode<T> {
  testField?: Field,
  testValue?: T,

  // TODO: Is this right? This looks kinda bonkers
  facts: Map<FactFragment<T>, Map<FactFragment<T>, Fact<T>>>,
  successors: JoinNode<T>[],
  children: AlphaNode<T>[]
}


export enum MEMORY_NODE_TYPE {
  PARTIAL,
  LEAF
}

export interface MemoryNode<T> {
  parent: JoinNode<T>,
  child?: JoinNode<T>,
  leafNode?: MemoryNode<T>,
  lastMatchId: number,
  matches: Map<IdAttrs<T>, Match<T>>
  matchIds: Map<number, IdAttrs<T>>,
  condition: Condition<T>,
  ruleName: string,
  type: MEMORY_NODE_TYPE,
  nodeType?: LeafNode<T>
}

export interface LeafNode<T> {
  condFn: CondFn<T>
  thenFn?: WrappedThenFn<T>
  thenFinallyFn?: WrappedThenFinallyFn,
  trigger?: boolean
}

export interface JoinNode<T> {
  parent?: MemoryNode<T >,
  child?: MemoryNode<T>,
  alphaNode: AlphaNode<T>,
  condition: Condition<T>,
  idName?: string,
  oldIdAttrs: Set<IdAttr<T>>,
  disableFastUpdates?: boolean,
  ruleName: string
}


/** Session **/

export interface Condition<T> {
  nodes: [Field, T][],
  vars: Var[]
  shouldTrigger: boolean
}



export interface Production<T, U> {
  name: string,
  conditions: Condition<T>[],
  convertMatchFn: ConvertMatchFn<T,U>,
  condFn: CondFn<T>,
  thenFn?: ThenFn<T, U>
  thenFinallyFn?: ThenFinallyFn<T, U>
}

export interface Session<T> {
  alphaNode: AlphaNode<T>,
  leafNodes: Map< string, MemoryNode<T>>,
  idAttrNodes: Map<IdAttr<T>, Set<AlphaNode<T>>>,
  insideRule: boolean,
  thenQueue: Set<[node: MemoryNode<T>, idAttrs: IdAttrs<T>]>
  thenFinallyQueue: Set<MemoryNode<T>>
  triggeredNodeIds: Set<MemoryNode<T>>
  autoFire: boolean,
  initMatch: InitMatchFn<T>
}

export type ExecutedNodes<T> = Map<MemoryNode<T>, Set<MemoryNode<T>>>[]
