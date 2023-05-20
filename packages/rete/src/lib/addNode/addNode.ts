import { AlphaNode } from '@edict/rete'

export const addNode = <T>(
  node: AlphaNode<T>,
  newNode: AlphaNode<T>
): AlphaNode<T> => {
  for (let i = 0; i < node.children.length; i++) {
    if (
      node.children[i].testField === newNode.testField &&
      node.children[i].testValue === newNode.testValue
    ) {
      return node.children[i]
    }
  }
  node.children.push(newNode)
  return newNode
}
