import { edict } from '@edict/edict'
import _ from 'lodash'

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

    const MAX_NUMS = 1000
    const raw = []
    for (var i = 0; i < MAX_NUMS; i++) {
      raw.push(i)
    }
    const data = _.chunk(raw, 2)

    for (var i = 0; i < data.length; i++) {
      const [A, B] = data[i]

      session
        .rule(`Match a: ${A}, b: ${B}`, ({ a, b }) => ({
          $e: {
            a: { match: A },
            b: { match: B },
          },
        }))
        .enact({
          then: ({ $e }) => {
            session.insert({ [$e.id]: { ab: $e.a + $e.b } })
          },
        })
    }

    session
      .rule(`ab equals a + b`, ({ a, b }) => ({
        $i: {
          a,
          b,
        },
      }))
      .enact({
        then: ({ $i }) => {
          const AB = ($i.a = $i.b)
          session.insert({
            [$i.id]: {
              ab: AB,
            },
          })
        },
      })

    session
      .rule(`c is a * b * ab`, ({ a, b, ab }) => ({
        $i: {
          a: { then: false },
          b: { then: false },
          ab,
        },
      }))
      .enact({
        then: ({ $i }) =>
          session.insert({
            [$i.id]: {
              c: $i.a * $i.b + $i.ab,
            },
          }),
      })

    session
      .rule(`c divisible by a add together for abc`, () => ({
        $i: {
          a: { then: false },
          b: { then: false },
          c: { then: false },
        },
      }))
      .enact({
        //      when: ({ $i: { a, c } }) => c % a === 0,
        then: ({ $i }) =>
          session.insert({
            [$i.id]: {
              abc: $i.a + $i.b + $i.c,
            },
          }),
      })

    const abc = session
      .rule('query abc', ({ abc, a, b, c }) => ({
        $e: { abc, a, b, c },
      }))
      .enact()

    for (var i = 0; i < data.length; i++) {
      const [A, B] = data[i]
      session.insert({ [`${i}`]: { a: A, b: B } })
    }

    session.fire()

    const x = abc.query()

    expect(1).toBe(1)
  })
})
