import {
  AlphaNode,
  Fact,
  IdAttr,
  IdAttrsHash,
  MemoryNode,
  Session,
} from '@edict/rete'
import { defaultInitMatch } from '../defaultInitMatch/defaultInitMatch'

export const initSession = <T>(autoFire = true): Session<T> => {
  let nodeIdCounter = 0
  const nextId = () => nodeIdCounter++
  const alphaNode: AlphaNode<T> = {
    id: nodeIdCounter,
    facts: new Map<string, Map<string, Fact<T>>>(),
    successors: [],
    children: [],
  }
  nextId()
  const leafNodes = new Map<string, MemoryNode<T>>()

  const idAttrNodes = new Map<
    number,
    { alphaNodes: Set<AlphaNode<T>>; idAttr: IdAttr<T> }
  >()

  const thenQueue = new Set<[MemoryNode<T>, IdAttrsHash]>()

  const thenFinallyQueue = new Set<MemoryNode<T>>()

  const triggeredNodeIds = new Set<MemoryNode<T>>()

  const subscriptionQueue = new Map<string, () => void>()

  const initMatch = () => defaultInitMatch()

  return {
    alphaNode,
    leafNodes,
    idAttrNodes,
    thenQueue,
    thenFinallyQueue,
    triggeredNodeIds,
    initMatch,
    insideRule: false,
    subscriptionsOnProductions: subscriptionQueue,
    triggeredSubscriptionQueue: new Set<string>(),
    autoFire,
    nextId,
  }
}
