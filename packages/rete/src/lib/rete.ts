// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import {
  AlphaNode,
  CondFn,
  Condition,
  ConvertMatchFn,
  ExecutedNodes,
  Fact,
  FactFragment,
  FactId,
  Field,
  IdAttr,
  IdAttrs,
  InternalFactRepresentation,
  JoinNode,
  Match,
  MatchT,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Production, PRODUCTION_ALREADY_EXISTS_BEHAVIOR,
  Session,
  ThenFinallyFn,
  ThenFn,
  Token,
  TokenKind,
  Var,
} from './types';
import { Dictionary, Set as TSet } from 'typescript-collections';
import * as _ from 'lodash';

export const newSet = <T>() => new TSet<T>();
export const newDict = <K, V>() => new Dictionary<K, V>();
// NOTE: The generic type T is our SCHEMA type. MatchT is the map of bindings
export const getIdAttr = <SCHEMA>(
  fact: InternalFactRepresentation<SCHEMA>
): IdAttr<SCHEMA> => {
  // TODO: Good way to assert that fact[1] is actually keyof T at compile time?
  return [fact[0], fact[1] as keyof SCHEMA];
};

const addNode = <T>(
  node: AlphaNode<T>,
  newNode: AlphaNode<T>
): AlphaNode<T> => {
  for (let i = 0; i < node.children.length; i++) {
    if (
      node.children[i].testField === newNode.testField &&
      node.children[i].testValue === newNode.testValue
    ) {
      return node.children[i];
    }
  }
  node.children.push(newNode);
  return newNode;
};

const addNodes = <T>(
  session: Session<T>,
  nodes: [Field, keyof T | FactId][]
): AlphaNode<T> => {
  let result = session.alphaNode;
  nodes.forEach(([testField, testValue]) => {
    result = addNode(result, {
      testField: testField,
      testValue: testValue,
      successors: [],
      children: [],
      facts: new Dictionary(),
    });
  });
  return result;
};

function isVar(obj: any): obj is Var {
  return obj.name !== undefined && obj.field !== undefined;
}

// To figure out MatchT we need to understand how Vars are treated (so we can understand how MatchT is mapped)
// We should also understand how conditions work in a Rete network

const addConditionsToProduction = <T, U>(
  production: Production<T, U>,
  id: number | string | Var,
  attr: keyof T,
  value: Var | any,
  then: boolean
) => {
  const condition: Condition<T> = { shouldTrigger: then, nodes: [], vars: [] };
  const fieldTypes = [Field.IDENTIFIER, Field.ATTRIBUTE, Field.VALUE];

  fieldTypes.forEach((fieldType) => {
    if (fieldType === Field.IDENTIFIER) {
      if (isVar(id)) {
        const temp = id;
        temp.field = fieldType;
        condition.vars.push(temp);
      } else {
        condition.nodes.push([fieldType, id]);
      }
    } else if (fieldType === Field.ATTRIBUTE) {
      condition.nodes.push([fieldType, attr]);
    } else if (fieldType === Field.VALUE) {
      if (isVar(value)) {
        const temp = value;
        temp.field = fieldType;
        condition.vars.push(temp);
      } else {
        condition.nodes.push([fieldType, value]);
      }
    }
  });
  console.log(condition)
  production.conditions.push(condition);
};

const isAncestor = <T>(x: JoinNode<T>, y: JoinNode<T>): boolean => {
  let node = y;
  while (node !== undefined && node.parent) {
    if (node.parent.parent === x) {
      return true;
    } else {
      node = node.parent.parent;
    }
  }
  return false;
};
const addProductionToSession = <T, U>(
  session: Session<T>,
  production: Production<T, U>,
  alreadyExistsBehaviour = PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR
) => {

  if (session.leafNodes.containsKey(production.name)) {
    const message = `${production.name} already exists in session`
    if(alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.QUIET) return
    else if (alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.WARN) {
      console.warn(message)
      return
    } else if (alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR) {
      throw new Error(message)
    }
  }



  const memNodes: MemoryNode<T>[] = [];
  const joinNodes: JoinNode<T>[] = [];
  const last = production.conditions.length - 1;
  const bindings = newSet<string>();
  const joinedBindings = newSet<string>();

  for (let i = 0; i <= last; i++) {
    const condition = production.conditions[i];
    const leafAlphaNode = addNodes(session, condition.nodes);
    const parentMemNode =
      memNodes.length > 0 ? memNodes[memNodes.length - 1] : undefined;
    const joinNode: JoinNode<T> = {
      parent: parentMemNode,
      alphaNode: leafAlphaNode,
      condition,
      ruleName: production.name,
      oldIdAttrs: newSet(),
    };
    condition.vars.forEach((v) => {
      if (bindings.contains(v.name)) {
        joinedBindings.add(v.name);
        if (v.field === Field.IDENTIFIER) {
          joinNode.idName = v.name;
        }
      } else {
        bindings.add(v.name);
      }
    });
    if (parentMemNode) {
      parentMemNode.child = joinNode;
    }
    leafAlphaNode.successors.push(joinNode);
    leafAlphaNode.successors.sort((x, y) => (isAncestor(x, y) ? 1 : -1));
    const memNode: MemoryNode<T> = {
      parent: joinNode,
      type: i === last ? MEMORY_NODE_TYPE.LEAF : MEMORY_NODE_TYPE.PARTIAL,
      condition,
      ruleName: production.name,
      lastMatchId: -1,
      matches: newDict<IdAttrs<T>, Match<T>>(),
      matchIds: newDict<number, IdAttrs<T>>(),
    };
    if (memNode.type === MEMORY_NODE_TYPE.LEAF) {
      memNode.nodeType = {
        condFn: production.condFn,
      };
      const pThenFn = production.thenFn;
      if (pThenFn) {
        const sess = { ...session, insideRule: true };
        memNode.nodeType.thenFn = (vars) =>
          pThenFn({
            session: sess,
            rule: production,
            vars: production.convertMatchFn(vars),
          });
      }
      const pThenFinallyFn = production.thenFinallyFn;
      if (pThenFinallyFn) {
        const sess = { ...session, insideRule: true };
        memNode.nodeType.thenFinallyFn = () => pThenFinallyFn(sess, production);
      }

      if (session.leafNodes.containsKey(production.name)) {
        throw new Error(`${production.name} already exists in session, this should have been handled above`);
      }
      session.leafNodes.setValue(production.name, memNode);
    }
    memNodes.push(memNode);
    joinNodes.push(joinNode);
    joinNode.child = memNode;
  }

  const leafMemNode = memNodes[memNodes.length - 1];
  for (let i = 0; i < memNodes.length; i++) {
    memNodes[i].leafNode = leafMemNode;
  }

  for (let i = 0; i < joinNodes.length; i++) {
    const node = joinNodes[i];
    const vars = node.condition.vars;
    for (let j = 0; j < vars.length; j++) {
      const v = vars[j];
      if (v.field === Field.VALUE && joinedBindings.contains(v.name)) {
        node.disableFastUpdates = true;
        break;
      }
    }
  }
};

// MatchT represents a mapping from condition key to a value
// So given this condidtion:
//
// $npc: {circle, speed, destX, destY},
//
// We'd need a map
const getVarFromFact = <T>(
  vars: MatchT<T>,
  key: string,
  fact: FactFragment<T>
): boolean => {
  if (vars.has(key) && vars.get(key) != fact) {
    return false;
  }
  vars.set(key, fact);
  return true;
};

const getVarsFromFact = <T>(
  vars: MatchT<T>,
  condition: Condition<T>,
  fact: Fact<T>
): boolean => {
  for (let i = 0; i < condition.vars.length; i++) {
    const v = condition.vars[i];
    if (v.field === Field.IDENTIFIER) {
      if (!getVarFromFact(vars, v.name, fact[0])) {
        return false;
      }
    } else if (v.field === Field.ATTRIBUTE) {
      throw new Error(`Attributes can not contain vars: ${v}`);
    } else if (v.field === Field.VALUE) {
      if (!getVarFromFact(vars, v.name, fact[2])) {
        return false;
      }
    }
  }
  return true;
};

const leftActivationFromVars = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttrs: IdAttrs<T>,
  vars: MatchT<T>,
  token: Token<T>,
  alphaFact: Fact<T>
) => {
  const newVars: MatchT<T> = new Map(vars);
  if (getVarsFromFact(newVars, node.condition, alphaFact)) {
    const idAttr = getIdAttr<T>(alphaFact);
    const newIdAttrs = [...idAttrs];
    newIdAttrs.push(idAttr);
    const newToken = { fact: alphaFact, kind: token.kind };
    const isNew = !node.oldIdAttrs?.contains(idAttr);
    const child = node.child;
    if (!child) {
      console.error('Session', JSON.stringify(session));
      console.error(`Node ${node.idName}`, JSON.stringify(node));
      throw new Error('Expected node to have child!');
    }
    leftActivationOnMemoryNode(
      session,
      child,
      newIdAttrs,
      newVars,
      newToken,
      isNew
    );
  }
};

const leftActivationWithoutAlpha = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttrs: IdAttrs<T>,
  vars: MatchT<T>,
  token: Token<T>
) => {
  // Issue somehere here?? TODO
  if (node.idName && node.idName != '') {
    const id = vars.get(node.idName);
    if (id !== undefined && node.alphaNode.facts.containsKey(id)) {
      const alphaFacts = [
        ...(node.alphaNode.facts.getValue(id)?.values() ?? []),
      ];
      if (!alphaFacts)
        throw new Error(`Expected to have alpha facts for ${node.idName}`);
      alphaFacts.forEach((alphaFact) => {
        leftActivationFromVars(session, node, idAttrs, vars, token, alphaFact);
      });
    }
  } else {
    const factsForId = [...node.alphaNode.facts.values()];
    factsForId.forEach((facts) => {
      const alphas = [...facts.values()];
      alphas.forEach((alphaFact) => {
        leftActivationFromVars(session, node, idAttrs, vars, token, alphaFact);
      });
    });
  }
};

const leftActivationOnMemoryNode = <T>(
  session: Session<T>,
  node: MemoryNode<T>,
  idAttrs: IdAttrs<T>,
  vars: MatchT<T>,
  token: Token<T>,
  isNew: boolean
) => {
  const idAttr = idAttrs[idAttrs.length - 1];

  if (
    isNew &&
    (token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) &&
    node.condition.shouldTrigger &&
    node.leafNode &&
    node.leafNode.nodeType
  ) {
    node.leafNode.nodeType.trigger = true;
  }

  if (token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) {
    let match: Match<T>;
    if (node.matches.containsKey(idAttrs)) {
      match = node.matches.getValue(idAttrs)!;
    } else {
      node.lastMatchId += 1;
      match = { id: node.lastMatchId };
    }
    match.vars = new Map(vars);
    match.enabled =
      node.type !== MEMORY_NODE_TYPE.LEAF ||
      !node.nodeType?.condFn ||
      (node.nodeType?.condFn(vars) ?? true);
    node.matchIds.setValue(match.id, idAttrs);
    node.matches.setValue(idAttrs, match);
    if (node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType?.trigger) {
      if (node.nodeType?.thenFn) {
        session.thenQueue.add([node, idAttrs]);
      }
      if (node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node);
      }
    }
    node.parent.oldIdAttrs.add(idAttr);
  } else if (token.kind === TokenKind.RETRACT) {
    const idToDelete = node.matches.getValue(idAttrs);
    if (idToDelete) {
      node.matchIds.remove(idToDelete.id);
    }
    node.matches.remove(idAttrs);
    node.parent.oldIdAttrs.remove(idAttr);
    if (node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType) {
      if (node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node);
      }
    }
  }

  if (node.type !== MEMORY_NODE_TYPE.LEAF && node.child) {
    leftActivationWithoutAlpha(session, node.child, idAttrs, vars, token);
  }
};

// session: var Session[T, MatchT], node: JoinNode[T, MatchT], idAttr: IdAttr, token: Token[T]) =
const rightActivationWithJoinNode = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttr: IdAttr<T>,
  token: Token<T>
) => {
  if (node.parent === undefined) {
    const vars = session.initMatch();
    if (getVarsFromFact(vars, node.condition, token.fact)) {
      if (!node.child) {
        throw new Error(`Unexpected undefined child for node ${node.idName}`);
      }
      leftActivationOnMemoryNode(
        session,
        node.child,
        [idAttr],
        vars,
        token,
        true
      );
    }
  } else {
    node.parent.matches.forEach((idAttrs, match) => {
      const vars: MatchT<T> = new Map(match.vars);
      const idName = node.idName;
      if (
        idName &&
        idName !== '' &&
        // REALLY NOT SURE ABOUT THIS LINE!!!
        vars?.get(idName) != token.fact[0]
      ) {
        return;
      }
      if (!vars) {
        throw new Error('Expected vars to not be undefinied???');
      }
      const newVars = new Map(vars);
      if (getVarsFromFact(newVars, node.condition, token.fact)) {
        const newIdAttrs = [...idAttrs];
        newIdAttrs.push(idAttr);
        const child = node.child;
        if (!child)
          throw new Error(`Unexpected null child for node: ${node.idName}`);

        leftActivationOnMemoryNode(
          session,
          child,
          newIdAttrs,
          newVars,
          token,
          true
        );
      }
    });
  }
};
// (session: var Session[T, MatchT], node: var AlphaNode[T, MatchT], token: Token[T]) =

const rightActivationWithAlphaNode = <T>(
  session: Session<T>,
  node: AlphaNode<T>,
  token: Token<T>
) => {
  const idAttr = getIdAttr(token.fact);
  const [id, attr] = idAttr;
  if (token.kind === TokenKind.INSERT) {
    if (!node.facts.containsKey(id)) {
      node.facts.setValue(id, new Dictionary<FactFragment<T>, Fact<T>>());
    }
    node.facts.getValue(id)!.setValue(attr, token.fact);
    if (!session.idAttrNodes.containsKey(idAttr)) {
      session.idAttrNodes.setValue(idAttr, new Set<AlphaNode<T>>());
    }
    session.idAttrNodes.getValue(idAttr)!.add(node);
  } else if (token.kind === TokenKind.RETRACT) {
    node.facts.getValue(id)?.remove(attr);
    session.idAttrNodes.getValue(idAttr)!.delete(node);
    if (session.idAttrNodes.getValue(idAttr)!.size == 0) {
      session.idAttrNodes.remove(idAttr);
    }
  } else if (token.kind === TokenKind.UPDATE) {
    node.facts.getValue(id)!.setValue(attr, token.fact);
  }
  node.successors.forEach((child) => {
    if (token.kind === TokenKind.UPDATE && child.disableFastUpdates) {
      rightActivationWithJoinNode(session, child, idAttr, {
        fact: token.oldFact!,
        kind: TokenKind.RETRACT,
      });
      rightActivationWithJoinNode(session, child, idAttr, {
        fact: token.fact,
        kind: TokenKind.INSERT,
      });
    } else {
      rightActivationWithJoinNode(session, child, idAttr, token);
    }
  });
};

const raiseRecursionLimitException = (
  limit: number,
  additionalText?: string
) => {
  const msg = `Recursion limit hit. The current limit is ${limit} (set by the recursionLimit param of fireRules).`;
  throw new Error(
    `${msg} ${additionalText}\n Try using the transient_ variants in your schema to prevent triggering rules in an infinite loop.`
  );
};

const raiseRecursionLimit = <T>(
  limit: number,
  executedNodes: ExecutedNodes<T>
) => {
  let nodes = {};
  for (let i = executedNodes.length - 1; i >= 0; i--) {
    const currNodes = {};
    const nodeToTriggeredNodes = executedNodes[i];
    nodeToTriggeredNodes.forEach((triggeredNodes, node) => {
      const obj = {};
      triggeredNodes.forEach((triggeredNode) => {
        if (triggeredNode.ruleName in nodes) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          obj[triggeredNode.ruleName] = nodes[triggeredNode.ruleName];
        }
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      currNodes[node.ruleName] = obj;
    });
    nodes = currNodes;
  }

  const findCycles = (
    cycles: TSet<string[]>,
    k: string,
    v: object,
    cyc: string[]
  ) => {
    const newCyc = cyc;
    newCyc.push(k);
    const index = cyc.indexOf(k);
    if (index >= 0) {
      cycles.add(newCyc.splice(index, newCyc.length));
    } else {
      Object.keys(v).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        findCycles(cycles, key, v[key], newCyc);
      });
    }
  };

  const cycles = newSet<string[]>();
  Object.keys(nodes).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    findCycles(cycles, key, nodes[key], []);
  });
  let text = '';
  cycles.forEach((cycle) => {
    text = `${text}\nCycle detected! `;
    if (cycle.length == 2) {
      text = `${text}${cycle[0]} is triggering itself`;
    } else {
      text = `${text}${cycle.join(' -> ')}`;
    }
    raiseRecursionLimitException(limit, text);
  });
};

const DEFAULT_RECURSION_LIMIT = 16;
const fireRules = <T>(
  session: Session<T>,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
  debug = true
) => {
  if (session.insideRule) {
    return;
  }
  // Only for debugging purposes, should we remove for prod usage?
  const executedNodes: ExecutedNodes<T> = [];

  let recurCount = 0;
  // `raiseRecursionLimit(recursionLimit, executedNodes) will explode
  // noinspection InfiniteLoopJS
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (recursionLimit >= 0) {
      if (recurCount == recursionLimit) {
        raiseRecursionLimit(recursionLimit, executedNodes);
      }
      recurCount += 1;
    }

    const thenQueue = new Array(...session.thenQueue);
    const thenFinallyQueue = new Array(...session.thenFinallyQueue);
    if (thenQueue.length == 0 && thenFinallyQueue.length == 0) {
      return { executedNodes, session };
    }

    // reset state
    session.thenQueue.clear();
    session.thenFinallyQueue.clear();
    thenQueue.forEach(([node]) => {
      if (node.nodeType) {
        node.nodeType!.trigger = false;
      }
    });
    thenFinallyQueue.forEach((node) => {
      if (node.nodeType) {
        node.nodeType!.trigger = false;
      }
    });

    const nodeToTriggeredNodeIds = new Map<MemoryNode<T>, Set<MemoryNode<T>>>();
    const add = (
      t: Map<MemoryNode<T>, Set<MemoryNode<T>>>,
      nodeId: MemoryNode<T>,
      s: Set<MemoryNode<T>>
    ) => {
      if (!t.has(nodeId)) {
        t.set(nodeId, new Set<MemoryNode<T>>());
      }
      const existing = t.get(nodeId) ?? new Set<MemoryNode<T>>();
      const ns = new Set<MemoryNode<T>>();
      s.forEach((e) => ns.add(e));
      existing.forEach((e) => ns.add(e));
      t.set(nodeId, ns);
    };

    //  keep a copy of the matches before executing the :then functions.
    //  if we pull the matches from inside the for loop below,
    //  it'll produce non-deterministic results because `matches`
    //  could be modified by the for loop itself. see test: "non-deterministic behavior"

    const nodeToMatches: Map<
      MemoryNode<T>,
      Dictionary<IdAttrs<T>, Match<T>>
    > = new Map();

    thenQueue.forEach(([node]) => {
      if (!nodeToMatches.has(node)) {
        nodeToMatches.set(node, node.matches);
      }
    });

    // Execute `then` blocks
    thenQueue.forEach(([node, idAttrs]) => {
      const matches = nodeToMatches.get(node);
      if (matches !== undefined && matches.containsKey(idAttrs)) {
        const match = matches.getValue(idAttrs);
        if (match !== undefined && match.enabled) {
          session.triggeredNodeIds.clear();
          if (!match.vars) {
            throw new Error(`expected match ${match.id} to have vars??`);
          }
          node.nodeType?.thenFn?.(match.vars);
          add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds);
        }
      }
    });

    // Execute `thenFinally` blocks
    thenFinallyQueue.forEach((node) => {
      session.triggeredNodeIds.clear();
      node.nodeType?.thenFinallyFn?.();
      add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds);
    });

    executedNodes.push(nodeToTriggeredNodeIds);
  }
};

const getAlphaNodesForFact = <T>(
  session: Session<T>,
  node: AlphaNode<T>,
  fact: Fact<T>,
  root: boolean,
  nodes: Set<AlphaNode<T>>
) => {
  if (root) {
    node.children.forEach((child) => {
      getAlphaNodesForFact(session, child, fact, false, nodes);
    });
  } else {
    const val =
      node.testField === Field.IDENTIFIER
        ? fact[0]
        : node.testField === Field.ATTRIBUTE
        ? fact[1]
        : node.testField === Field.VALUE
        ? fact[2]
        : undefined;
    if (val != node.testValue) {
      return;
    }
    nodes.add(node);
    node.children.forEach((child) => {
      getAlphaNodesForFact(session, child, fact, false, nodes);
    });
  }
};

const upsertFact = <T>(
  session: Session<T>,
  fact: Fact<T>,
  nodes: Set<AlphaNode<T>>
) => {
  const idAttr = getIdAttr<T>(fact);
  if (!session.idAttrNodes.containsKey(idAttr)) {
    nodes.forEach((n) => {
      rightActivationWithAlphaNode(session, n, {
        fact,
        kind: TokenKind.INSERT,
      });
    });
  } else {
    const existingNodes = session.idAttrNodes.getValue(idAttr);
    if (existingNodes === undefined) {
      console.warn('Session has no existing nodes?');
      return;
    }
    // retract any facts from nodes that the new fact wasn't inserted in
    // we use toSeq here to make a copy of the existingNodes, because
    // rightActivation will modify it
    const existingNodesCopy = new Set<AlphaNode<T>>(existingNodes);
    existingNodesCopy.forEach((n) => {
      if (!nodes.has(n)) {
        const oldFact = n.facts.getValue(fact[0])?.getValue(fact[1]);
        if (oldFact === undefined) {
          console.warn("Old fact doesn't exist?");
          return;
        }
        rightActivationWithAlphaNode(session, n, {
          fact: oldFact,
          kind: TokenKind.RETRACT,
        });
      }
    });

    // update or insert facts, depending on whether the node already exists
    nodes.forEach((n) => {
      if (existingNodes.has(n)) {
        const oldFact = n.facts.getValue(fact[0])?.getValue(fact[1]);
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.UPDATE,
          oldFact,
        });
      } else {
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.INSERT,
        });
      }
    });
  }
};

const insertFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const nodes = new Set<AlphaNode<T>>();
  // Why do we do this mutation in-place function call?
  // I'd really rather it was `const nodes = getAlphaNodesForFact(...)`
  // perf reasons?
  //
  // TODO: Once we get all the tests passing lets refactor this little thing here
  getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes);
  upsertFact(session, fact, nodes);
  if (session.autoFire) {
    fireRules(session);
  }
};

const retractFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const idAttr = getIdAttr(fact);
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set<AlphaNode<T>>();
  session.idAttrNodes.getValue(idAttr)?.forEach((i) => idAttrNodes.add(i));
  idAttrNodes.forEach((node) => {
    const otherFact = node.facts.getValue(idAttr[0])?.getValue(idAttr[1]);

    if (!_.isEqual(fact, otherFact)) {
      throw new Error(
        `Expected fact ${fact} to be in node.facts at id: ${idAttr[0]}, attr: ${idAttr[1]}`
      );
    }

    rightActivationWithAlphaNode(session, node, {
      fact,
      kind: TokenKind.RETRACT,
    });
  });
};

const retractFactByIdAndAttr = <T>(
  session: Session<T>,
  id: string,
  attr: keyof T
) => {
  // TODO: this function is really simliar to the retractFact function, can we make things
  // DRYer?
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set<AlphaNode<T>>();
  session.idAttrNodes.getValue([id, attr])?.forEach((i) => idAttrNodes.add(i));
  idAttrNodes.forEach((node) => {
    const fact = node.facts.getValue(id)?.getValue(attr);
    if (fact) {
      rightActivationWithAlphaNode(session, node, {
        fact,
        kind: TokenKind.RETRACT,
      });
    } else {
      console.warn('Missing fact during retraction?');
    }
  });
};

const defaultInitMatch = <T>() => {
  return new Map<string, FactFragment<T>>();
};

const initSession = <T>(autoFire = true): Session<T> => {
  const alphaNode: AlphaNode<T> = {
    facts: new Dictionary<
      FactFragment<T>,
      Dictionary<FactFragment<T>, Fact<T>>
    >(),
    successors: [],
    children: [],
  };

  const leafNodes = newDict<string, MemoryNode<T>>();

  const idAttrNodes = newDict<IdAttr<T>, Set<AlphaNode<T>>>();

  const thenQueue = new Set<[MemoryNode<T>, IdAttrs<T>]>();

  const thenFinallyQueue = new Set<MemoryNode<T>>();

  const triggeredNodeIds = new Set<MemoryNode<T>>();

  const initMatch = () => defaultInitMatch();

  return {
    alphaNode,
    leafNodes,
    idAttrNodes,
    thenQueue,
    thenFinallyQueue,
    triggeredNodeIds,
    initMatch,
    insideRule: false,
    autoFire,
  };
};

const initProduction = <SCHEMA, U>(production: {
  name: string;
  convertMatchFn: ConvertMatchFn<SCHEMA, U>;
  condFn?: CondFn<SCHEMA>;
  thenFn?: ThenFn<SCHEMA, U>;
  thenFinallyFn?: ThenFinallyFn<SCHEMA, U>;
}): Production<SCHEMA, U> => {
  return {
    ...production,
    conditions: [],
  };
};

// lolwut? I think all the different find functions aren't used? Because they don't seem to have the type params or anything,
// and literally have typos in them?
// const matchParams = <I,T>(vars: MatchT<T>, params: [I, [string, T]]): boolean => {
//   params.forEach(([varName, val]) => {
//     if(vars.get(varName) != val) {
//       return false
//     }
//   })
//   return true
// export const find = <I,T>(session: Session<T>, prod: Production<T>, params: [I, [string, T]]): string => {
//
// }

const queryAll = <T, U>(session: Session<T>, prod: Production<T, U>): U[] => {
  const result: U[] = [];
  session.leafNodes.getValue(prod.name)?.matches.forEach((_, match) => {
    if (match.enabled && match.vars) {
      result.push(prod.convertMatchFn(match.vars));
    }
  });
  return result;
};

const queryFullSession = <T>(session: Session<T>): Fact<T>[] => {
  const result: Fact<T>[] = [];
  session.idAttrNodes.forEach((idAttr, nodes) => {
    const nodesArr = new Array(...nodes);
    if (nodesArr.length <= 0) throw new Error('No nodes in session?');
    const firstNode = nodesArr[0];
    const fact = firstNode.facts.getValue(idAttr[0])?.getValue(idAttr[1]);
    if (fact) {
      result.push([idAttr[0], idAttr[1], fact[2]]);
    } else {
      console.warn('Missing fact??');
    }
  });
  return result;
};

const get = <T, U>(
  session: Session<T>,
  prod: Production<T, U>,
  i: number
): U | undefined => {
  const idAttrs = session.leafNodes.getValue(prod.name)?.matchIds.getValue(i);
  if (!idAttrs) return;
  const vars = session.leafNodes
    .getValue(prod.name)
    ?.matches.getValue(idAttrs)?.vars;
  if (!vars) {
    console.warn('No vars??');
    return;
  }
  return prod.convertMatchFn(vars);
};

const contains = <T>(session: Session<T>, id: string, attr: keyof T): boolean =>
  session.idAttrNodes.containsKey([id, attr]);

export const rete = {
  get,
  queryAll,
  queryFullSession,
  initProduction,
  initSession,
  fireRules,
  retractFact,
  retractFactByIdAndAttr,
  insertFact,
  contains,
  addProductionToSession,
  addConditionsToProduction,
};
