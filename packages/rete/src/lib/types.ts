
/*** Facts ***/
enum FIELD {
  IDENTIFIER,
  ATTRIBUTE,
  VALUE
}

interface Fact<T> {
  id: T,
  attr: T,
  value: T
}

enum TOKEN_KIND {
  INSERT,
  RETRACT,
  UPDATE
}

interface Token<T> {
  fact: Fact<T>,
  kind: TOKEN_KIND
  // Only for Update Tokens
  oldFact?: Fact<T>
}

type IdAttr = [number, number]
type IdAttrs = IdAttr[]

/** Matches **/

type Vars<T> = Map<string, T>
interface Var {
  name: string,
  field: FIELD
}

interface Match<T> {
  id: number,
  vars: T,
  enabled: boolean
}

/** functions **/
type ThenFn<T,U, MatchT> = (session: Session<T, MatchT>, rule: Production<T,U,MatchT>) => void
type WrappedThenFn<MatchT> = (vars: MatchT) => void
type ThenFinallyFn<T,U,MatchT> = (session: Session<T, MatchT>, rule: Production<T,U,MatchT>) => void
type WrappedThenFinallyFn = () => void
type ConvertMatchFn<MatchT, U> = (vars: MatchT) => U
type CondFn<MatchT> = (vars: MatchT) => boolean
type InitMatchFn<MatchT> = (ruleName: string) => MatchT

/** Beta Network **/
interface JoinNode<T, MatchT> {
  parent: MemoryNode<T, MatchT >,
  child: MemoryNode<T, MatchT>,
  alphaNode: AlphaNode<T, MatchT>,
  condition: Condition<T>,
  idName: string,
  oldIdAttrs: Set<IdAttr>,
  disableFastUpdates: boolean,
  ruleName: string
}



enum MEMORY_NODE_TYPE {
  PARTIAL,
  LEAF
}

interface LeafNode<MatchT> {
  condFn: CondFn<MatchT>
  thenFn: WrappedThenFn<MatchT>
  thenFinallyFn: WrappedThenFinallyFn,
  trigger: boolean
}

interface MemoryNode<T, MatchT> {
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
interface AlphaNode<T, MatchT> {
  testField: FIELD,
  testValue: T,
  facts: Map<number, Map<number, Fact<T>>>,
  successors: JoinNode<T, MatchT>[],
  children: AlphaNode<T, MatchT>[]
}

/** Session **/

interface Condition<T> {
  nodes: [FIELD, T][],
  vars: Var[]
  shouldTrigger: boolean
}



interface Production<T, U, MatchT> {
  name: string,
  conditions: Condition<T>[],
  convertMatchFn: ConvertMatchFn<MatchT, U>
  condFn: CondFn<MatchT>,
  thenFn: ThenFn<T, U, MatchT>
  thenFinallyFn: ThenFinallyFn<T, U, MatchT>
}

interface Session<T, MatchT> {
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
