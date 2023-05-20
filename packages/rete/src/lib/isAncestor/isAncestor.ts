import { JoinNode } from '@edict/rete'

export const isAncestor = <T>(x: JoinNode<T>, y: JoinNode<T>): boolean => {
  let node = y
  while (node !== undefined && node.parent) {
    if (node.parent.parent === x) {
      return true
    } else {
      node = node.parent.parent
    }
  }
  return false
}
