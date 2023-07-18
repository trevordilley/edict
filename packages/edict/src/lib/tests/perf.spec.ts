import { edict } from '@edict/edict'
import { faker } from '@faker-js/faker'
import _ from 'lodash'

const median = (numbers: number[]) => {
  const sorted = Array.from(numbers).sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

type PriceSchedule = 'PERCENT' | 'FIXED'

type CompanySchema = {
  name: string
  basePrice: number
  priceSchedule: PriceSchedule
  priceScheduleAmount: number
  parentCompany: string
  overrideParent: boolean
}

const HIGHEST_MAX_MS = 1000
const HIGHEST_MIN_MS = 300

describe('company price scheduling...', function () {
  const performanceMeasures: {
    name: string
    max?: number
    min?: number
    med?: number
  }[] = []
  const NUM_COMPANIES = 10_000
  let id = 0
  const session = edict<CompanySchema>()
  session
    .rule(
      'Parent Company Price Schedule propagates',
      ({ basePrice, priceSchedule, priceScheduleAmount }) => ({
        $parent: {
          basePrice,
          priceSchedule,
          priceScheduleAmount,
        },
        $child: {
          parentCompany: { join: '$parent' },
          basePrice: { then: false },
          overrideParent: { match: false },
        },
      })
    )
    .enact({
      then: ({ $parent, $child }) => {
        session.insert({
          [$child.id]: {
            basePrice:
              $parent.priceSchedule === 'FIXED'
                ? $parent.basePrice + $parent.priceScheduleAmount
                : $parent.basePrice * $parent.priceScheduleAmount,
          },
        })
      },
    })

  const companies = session
    .rule(
      'companies',
      ({
        parentCompany,
        priceSchedule,
        priceScheduleAmount,
        basePrice,
        overrideParent,
      }) => ({
        $company: {
          parentCompany,
          priceSchedule,
          priceScheduleAmount,
          basePrice,
          overrideParent,
        },
      })
    )
    .enact()

  const companyFac = (): [number, CompanySchema] => [
    id++,
    {
      name: faker.name.fullName(),
      priceSchedule: 'FIXED',
      priceScheduleAmount: 10,
      overrideParent: false,
      basePrice: 10,
      parentCompany: 'parent',
    },
  ]

  it('inserts quickly despite their being a lot of rules', () => {
    const perf = []
    const companies: [number, CompanySchema][] = []
    for (let i = 0; i < NUM_COMPANIES; i++) {
      const [id, data] = companyFac()
      if (i % NUM_COMPANIES === 0) {
        session
          .rule(`match for company ${data.name} with id ${id}`, ({ name }) => ({
            $company: {
              name: { match: data.name },
            },
          }))
          .enact()
      }
      companies.push([id, data])
    }
    for (let i = 0; i < companies.length; i++) {
      const [id, data] = companies[i]
      const b = performance.now()
      session.insert({
        [id]: data,
      })
      const a = performance.now()
      perf.push(a - b)
    }
    const max = _.max(perf)
    const min = _.min(perf)
    const med = median(perf)
    performanceMeasures.push({ name: 'simple inserts', max, min, med })
    expect(1).toBe(1)

    const randomPerfs: number[] = []
    for (let i = 0; i < 1000; i++) {
      const id = Math.floor(Math.random() * NUM_COMPANIES)
      const b = performance.now()
      session.insert({
        [id]: {
          basePrice: 1234,
        },
      })
      const a = performance.now()
      randomPerfs.push(a - b)
    }
    const rMax = _.max(randomPerfs)
    const rMin = _.min(randomPerfs)
    const rMed = median(randomPerfs)
    performanceMeasures.push({
      name: 'random basePrice updates',
      max: rMax,
      min: rMin,
      med: rMed,
    })
    for (const measure of performanceMeasures) {
      expect(measure.max).toBeLessThan(HIGHEST_MAX_MS)
      expect(measure.min).toBeLessThan(HIGHEST_MIN_MS)
      expect(measure.med).toBeLessThan(HIGHEST_MAX_MS)
    }
  })

  it("let's add a few complex companies", () => {
    const perf: number[] = []
    const insert = (obj: any) => {
      const b = performance.now()
      session.insert(obj)
      const a = performance.now()
      perf.push(a - b)
    }
    const COMPLEXITY = 3
    const parentIds = []
    const overrideIds = []
    const lineages = []
    const allCompanies = []
    for (let i = 0; i < COMPLEXITY; i++) {
      const [id, parent] = companyFac()
      parentIds.push(id)
      allCompanies.push({ [id]: parent })
      for (let j = 0; j < COMPLEXITY; j++) {
        const [cId, child] = companyFac()
        allCompanies.push({
          [cId]: {
            ...child,
            parentCompany: `${id}`,
            priceSchedule: 'PERCENT',
            priceScheduleAmount: 2,
          },
        })
        for (let k = 0; k < COMPLEXITY; k++) {
          const [ccId, grandChild] = companyFac()
          allCompanies.push({
            [ccId]: {
              ...grandChild,
              parentCompany: `${cId}`,
            },
          })
          for (let l = 0; l < COMPLEXITY; l++) {
            const [cccId, greatGrandChild] = companyFac()
            allCompanies.push({
              [cccId]: {
                ...greatGrandChild,
                parentCompany: `${ccId}`,
                overrideParent: true,
                basePrice: 23,
              },
            })
            overrideIds.push(cccId)
            for (let m = 0; m < COMPLEXITY; m++) {
              const [ccccId, greatGreatGrandChild] = companyFac()
              allCompanies.push({
                [ccccId]: {
                  ...greatGreatGrandChild,
                  parentCompany: `${cccId}`,
                },
              })
              for (let n = 0; n < COMPLEXITY; n++) {
                const [cccccId, greatGreatGreatGrandChild] = companyFac()
                allCompanies.push({
                  [cccccId]: {
                    ...greatGreatGreatGrandChild,
                    parentCompany: `${ccccId}`,
                  },
                })
                lineages.push([id, cId, ccId, cccId, ccccId, cccccId])
              }
            }
          }
        }
      }

      for (const comp of _.shuffle(allCompanies)) {
        insert(comp)
      }

      const max = _.max(perf)
      const min = _.min(perf)
      const med = median(perf)
      performanceMeasures.push({
        name: 'complex companies inserted',
        max,
        min,
        med,
      })

      const cPerfs = []
      for (let i = 0; i < 100; i++) {
        const b = performance.now()
        session.insert({
          [parentIds[0]]: {
            priceScheduleAmount: i * 20,
          },
          [parentIds[1]]: {
            priceSchedule: i % 2 === 0 ? 'FIXED' : 'PERCENT',
          },
          [parentIds[2]]: {
            priceScheduleAmount: i + 10,
          },
        })
        const a = performance.now()
        cPerfs.push(a - b)
      }
      const cMax = _.max(cPerfs)
      const cMin = _.min(cPerfs)
      const cMed = median(cPerfs)
      performanceMeasures.push({
        name: 'parent companies updated',
        max: cMax,
        min: cMin,
        med: cMed,
      })

      const oPerf = []
      for (let i = 0; i < overrideIds.length; i++) {
        const b = performance.now()
        session.insert({
          [overrideIds[i]]: {
            basePrice: 10,
          },
        })
        const a = performance.now()
        oPerf.push(a - b)
      }
      const oMax = _.max(oPerf)
      const oMin = _.min(oPerf)
      const oMed = median(oPerf)
      performanceMeasures.push({
        name: 'override parent pricing',
        max: oMax,
        min: oMin,
        med: oMed,
      })
    }
    for (const measure of performanceMeasures) {
      expect(measure.max).toBeLessThan(HIGHEST_MAX_MS)
      expect(measure.min).toBeLessThan(HIGHEST_MIN_MS)
      expect(measure.med).toBeLessThan(HIGHEST_MAX_MS)
    }
  })
  afterAll(() => {
    console.table(performanceMeasures)
  })
})
