import { getAlphaNodesForFact } from './getAlphaNodesForFact'
import {
  TestingSchema,
  testingSimpleSession,
} from '../../tests/testingUtils.spec'
import { insertFact } from '../insertFact/insertFact'
import { AlphaNode, Fact, Field } from '@edict/rete'

describe('getAlphaNodesForFact...', () => {
  it('A fact with the A attribute will have the one alpha node', () => {
    const session = testingSimpleSession()
    const fact: Fact<TestingSchema> = ['a', 'A', 1]
    insertFact(session, fact)
    const nodes = new Set<AlphaNode<TestingSchema>>()
    getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes)
    // console.log(vizOnlineUrl(session))
    expect(nodes.size).toBe(1)

    const alphaNode = [...nodes][0]
    expect(alphaNode.testField).toBe(Field.ATTRIBUTE)
    expect(alphaNode.testValue).toBe('A')
  })

  it('A fact with the B attribute will have no alpha nodes', () => {
    const session = testingSimpleSession()
    const fact: Fact<TestingSchema> = ['b', 'B', 1]
    insertFact(session, fact)
    const nodes = new Set<AlphaNode<TestingSchema>>()
    getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes)
    // console.log(vizOnlineUrl(session))
    expect(nodes.size).toBe(0)
  })
})
