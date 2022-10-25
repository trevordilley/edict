/*** Facts ***/
import { Dictionary, Set as TSet } from 'typescript-collections';

// This is a map of string to one of the elements of a fact tuple
// So for a fact ["bob", "age", 13] this could be a map from
// string to string | number
export type ValueOf<T> = T[keyof T];
export type FactFragment<SCHEMA> = FactId | keyof SCHEMA | ValueOf<SCHEMA>;
export type MatchT<SCHEMA> = Map<string, FactFragment<SCHEMA>>;
export type QueryFilter<SCHEMA> = Map<string, FactFragment<SCHEMA>[]>;

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

export type FactId = number | string | Var;
// Shorten that name a bit
export type InternalFactRepresentation<SCHEMA> = [FactId, keyof SCHEMA, any];
export type Fact<T> = InternalFactRepresentation<T>;

export type IdAttr<S> = [FactId, keyof S];
export type IdAttrs<S> = IdAttr<S>[];
export enum TokenKind {
  INSERT,
  RETRACT,
  UPDATE,
}

export interface Token<T> {
  fact: Fact<T>;
  kind: TokenKind;
  // Only for Update Tokens
  oldFact?: Fact<T>;
}

/** Matches **/

export type Vars<T> = Map<string, T>;
export interface Var {
  name: string;
  field: Field;
}

export interface Match<T> {
  id: number;
  vars?: MatchT<T>;
  enabled?: boolean;
}

/** functions **/
export type ThenFn<T, U> = (then: {
  session: Session<T>;
  rule: Production<T, U>;
  vars: U;
}) => Promise<void> | void;
export type WrappedThenFn<SCHEMA> = (
  vars: MatchT<SCHEMA>
) => Promise<void> | void;
export type ThenFinallyFn<T, U> = (
  session: Session<T>,
  rule: Production<T, U>
) => Promise<void> | void;
export type WrappedThenFinallyFn = () => Promise<void> | void;
export type ConvertMatchFn<T, U> = (vars: MatchT<T>) => U;
export type CondFn<T> = (vars: MatchT<T>) => boolean;
export type InitMatchFn<T> = () => MatchT<T>;

/** Alpha Network **/
export interface AlphaNode<T> {
  id: number;
  testField?: Field;
  testValue?: keyof T | FactId;

  facts: Dictionary<FactFragment<T>, Dictionary<FactFragment<T>, Fact<T>>>;
  successors: JoinNode<T>[];
  children: AlphaNode<T>[];
}

export enum MEMORY_NODE_TYPE {
  PARTIAL,
  LEAF,
}

export interface MemoryNode<T> {
  id: number;
  parent: JoinNode<T>;
  child?: JoinNode<T>;
  leafNode?: MemoryNode<T>;
  lastMatchId: number;
  matches: Dictionary<IdAttrs<T>, Match<T>>;
  matchIds: Dictionary<number, IdAttrs<T>>;
  condition: Condition<T>;
  ruleName: string;
  type: MEMORY_NODE_TYPE;
  nodeType?: LeafNode<T>;
}

export interface LeafNode<T> {
  condFn?: CondFn<T>;
  thenFn?: WrappedThenFn<T>;
  thenFinallyFn?: WrappedThenFinallyFn;
  trigger?: boolean;
}

export interface JoinNode<T> {
  id: number;
  parent?: MemoryNode<T>;
  child?: MemoryNode<T>;
  alphaNode: AlphaNode<T>;
  condition: Condition<T>;
  idName?: string;
  oldIdAttrs: TSet<IdAttr<T>>;
  disableFastUpdates?: boolean;
  ruleName: string;
}

/** Session **/

export interface Condition<T> {
  nodes: [Field, keyof T | FactId][];
  vars: Var[];
  shouldTrigger: boolean;
}

export interface Production<T, U> {
  name: string;
  conditions: Condition<T>[];
  convertMatchFn: ConvertMatchFn<T, U>;
  subscriptions: Set<{
    callback: (results: U[]) => void;
    filter?: QueryFilter<T>;
  }>;
  condFn?: CondFn<T>;
  thenFn?: ThenFn<T, U>;
  thenFinallyFn?: ThenFinallyFn<T, U>;
}

export interface Session<T> {
  alphaNode: AlphaNode<T>;
  leafNodes: Dictionary<string, MemoryNode<T>>;
  idAttrNodes: Dictionary<IdAttr<T>, Set<AlphaNode<T>>>;
  insideRule: boolean;
  thenQueue: Set<[node: MemoryNode<T>, idAttrs: IdAttrs<T>]>;
  thenFinallyQueue: Set<MemoryNode<T>>;
  triggeredNodeIds: Set<MemoryNode<T>>;
  subscriptionsOnProductions: Map<string, () => void>;
  triggeredSubscriptionQueue: Set<string>;
  autoFire: boolean;
  initMatch: InitMatchFn<T>;
  nextId: () => number;
  debug: boolean;
}

export type ExecutedNodes<T> = Map<MemoryNode<T>, Set<MemoryNode<T>>>[];
