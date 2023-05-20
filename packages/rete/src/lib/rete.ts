// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import { addConditionsToProduction } from './addConditionsToProduction/addConditionsToProduction'
import { addProductionToSession } from './addProductionToSession/addProductionToSession'
import { queryAll } from './queryAll/queryAll'
import { subscribeToProduction } from './subscribeToProduction/subscribeToProduction'
import { contains } from './contains/contains'
import { get } from './get/get'
import { queryFullSession } from './queryFullSession/queryFullSession'
import { initProduction } from './initProduction/initProduction'
import { initSession } from './initSession/initSession'
import { fireRules } from './fireRules/fireRules'
import { retractFactByIdAndAttr } from './retractFactByIdAndAttr/retractFactByIdAndAttr'
import { insertFact } from './insertFact/insertFact'
import { retractFact } from './retractFact/retractFact'

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
  subscribeToProduction,
}
