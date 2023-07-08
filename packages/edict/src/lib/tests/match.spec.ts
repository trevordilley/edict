import { edict } from '@edict/edict'

type Schema = {
  a: number
  b: number
  c: number
  ab: number
  abc: number
}
describe('it performs...', () => {
  it('at scale with large amounts of facts and rules', () => {
    const session = edict<Schema>(false)

    const A = 1
    const B = 2
    session
      .rule(`Match a: ${A}, b: ${B}`, ({ a, b }) => ({
        $e: {
          // Match is effed up
          a: { match: A },
          b: { match: B },
        },
      }))
      .enact({
        then: ({ $e }) => {
          expect($e.a).toBe(A)
          expect($e.b).toBe(B)
          session.insert({ [$e.id]: { ab: $e.a + $e.b } })
        },
      })

    session.insert({ [0]: { a: A, b: B } })

    session.fire()
  })
})
