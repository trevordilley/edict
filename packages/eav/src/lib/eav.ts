import { AttrIdx, EAV, Fact, FactHash, IdIdx, ValIdx } from './types'

// Ideally this function has some kind of schema which dictates the kinds
// of values we're accepting
//
// Ideally we also pre-allocate memory so we can save on garbage collection
//
// I THINK this could help just as a standalone library as long as the consumer tracks by ids

// HOWEVER, we must keep in mind how facts are actually currently used, some examples extracted from rete.ts
//
// Alpha Nodes keep a map of facts by id and attr
// node.facts.get(id.toString())?.delete(attr.toString())

// the session keeps a map of idAttr hashs to alphaNodes
// session.idAttrNodes.get(idAttrHash)!.alphaNodes.delete(node)

// Memory nodes maintain a list of idAttr hashes to track their matches
// node.matchIds.set(match.id, idAttrs)
// node.matches.set(idAttrsHash, { idAttrs, match })

// So we need to get really good at hashing the id,attr, and val idx/coordinates into a single value for usage
// by consuming libraries.
export function eav(initialFacts: Fact[]): EAV {
  const idCursor: IdIdx = 0
  const idMap: Map<string, IdIdx> = new Map()
  const ids: IdIdx[] = []

  const attrMap: Map<string, AttrIdx> = new Map()
  const attrCursor: AttrIdx = 0

  // The position of an element in this array corresponds to the AttrIdx
  const values: { cursor: ValIdx; vals: any[] }[] = []

  const facts: [IdIdx, AttrIdx, ValIdx][] = []

  const hashCoordinate = (id: IdIdx, attr: AttrIdx, val: ValIdx) => 0

  // example: eav.add("bob", "age", 29) returns -1348432 // some hash integer the client should store.
  const add = (id: string, attr: string, value: any): FactHash =>
    hashCoordinate(0, 0, 0)

  // Returns bool signalling removed or not
  const remove = (id: string, attr: string, value: any) => false

  // Relevant?
  const getIdIdx = (id: string) => undefined
  const getAttrIdx = (attr: string) => undefined

  // The expectation is that the consumer of this library will
  // keep track of all facts by their internal ids
  const query = (fact: FactHash) => undefined
  // When querying in bulk, we should initially sort ids by attr id then PROXIMITY of val id
  // to optimize cache locality
  //
  //
  // Example:
  // Given the following facts:
  // [1234,1,10]
  // [1234,2,1]
  // [1234,3,4]
  // [1,1,1]
  // [2,1,9]
  // [3,1,45]
  //
  // We should have it sorted like:
  // [2,1,9]
  // [1234,1,10]
  // [1,1,1]
  // [3,1,45]
  // [1234,2,1]
  // [1234,3,4]
  //
  // The aim is to maximize compactness of the data before we start serializing it back into it's proper representation.
  const queryMany = (facts: FactHash[]) => []

  return {
    add,
    remove,
    getAttrIdx,
    getIdIdx,
    query,
    queryMany,
  }
}
