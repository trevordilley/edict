export type IdIdx = number
export type AttrIdx = number
export type ValIdx = number
export type FactHash = number
export type Fact = [string, string, any]
export interface EAV {
  add: (id: string, attr: string, value: any) => FactHash
  remove: (id: string, attr: string, value: any) => boolean
  getIdIdx: (id: string) => IdIdx | undefined
  getAttrIdx: (attr: string) => AttrIdx | undefined
  query: (facts: FactHash) => Fact | undefined
  queryMany: (facts: FactHash[]) => Fact[]
}
