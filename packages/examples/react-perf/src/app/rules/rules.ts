import { edict } from '@edict/edict'
import { Sex } from '@faker-js/faker'

export enum ProvinceClassification {
  TINY = 'tiny',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface Province {
  provinceName: string
  provinceClassification: ProvinceClassification
  provincePopulation: number
}

export enum LocationClassification {
  UNINCORPORATED = 'unincorporated territory',
  VILLAGE = 'village',
  CITY = 'city',
}

export enum LocationHappiness {
  MISERAABLE = 'miserable',
  INDIFFERENT = 'indifferent',
  HAPPY = 'happy',
}

export interface Location {
  locationName: string
  locationClassification: LocationClassification
  locationHappiness: LocationHappiness
  locationProvinceId: string
  locationPopulation: number
  locationFarmers: number
  locationCivics: number
  locationPolice: number
  locationWorkers: number
  locationIsHungry: boolean
  locationIsInDisrepair: boolean
  locationIsCrimeRidden: boolean
}

export enum CivilianJob {
  FARMER = 'farmer',
  CIVIC = 'civic',
  POLICE = 'police',
  WORKER = 'worker',
}

export interface Civilian {
  civilianFirstName: string
  civilianLastName: string
  civilianLocationId: string
  civilianSex: Sex
  civilianJob: CivilianJob
}

export type Schema = Location & Civilian & Province

const session = edict<Schema>(true)

const { rule } = session
export const { insert, retract, fire, debug } = session

const CRIME_RATIO = 0.05

rule(
  'Locations without the right number of locationPolice are crime ridden',
  ({ locationPopulation, locationPolice }) => ({
    $location: {
      locationPopulation,
      locationPolice,
    },
  })
).enact({
  then: ({ $location: { id, locationPopulation, locationPolice } }) => {
    const locationIsCrimeRidden =
      locationPolice / locationPopulation < CRIME_RATIO
    insert({
      [id]: {
        locationIsCrimeRidden,
      },
    })
  },
})

const FARMER_RATIO = 0.1
rule(
  'Locations with too few locationFarmers need food',
  ({ locationPopulation, locationFarmers }) => ({
    $location: {
      locationPopulation,
      locationFarmers,
    },
  })
).enact({
  then: ({ $location: { id, locationPopulation, locationFarmers } }) => {
    const locationIsHungry = locationFarmers / locationPopulation < FARMER_RATIO
    insert({
      [id]: {
        locationIsHungry,
      },
    })
  },
})

rule(
  'Unincorporated territory has a small locationPopulation',
  ({ locationPopulation }) => ({
    $location: {
      locationPopulation,
    },
  })
).enact({
  when: ({ $location: { locationPopulation } }) => locationPopulation < 10,
  then: ({ $location: { id } }) =>
    insert({
      [id]: { locationClassification: LocationClassification.UNINCORPORATED },
    }),
})

rule(
  'Villages have a sizeable locationPopulation',
  ({ locationPopulation }) => ({
    $location: {
      locationPopulation,
    },
  })
).enact({
  when: ({ $location: { locationPopulation } }) =>
    locationPopulation > 10 && locationPopulation < 100,
  then: ({ $location: { id } }) =>
    insert({
      [id]: { locationClassification: LocationClassification.VILLAGE },
    }),
})

rule('Cities have a large locationPopulation', ({ locationPopulation }) => ({
  $location: {
    locationPopulation,
  },
})).enact({
  when: ({ $location: { locationPopulation } }) => locationPopulation >= 100,
  then: ({ $location: { id } }) =>
    insert({ [id]: { locationClassification: LocationClassification.CITY } }),
})

rule(
  'Locations locationHappiness is determined by their problems',
  ({ locationIsCrimeRidden, locationIsHungry, locationIsInDisrepair }) => ({
    $location: {
      locationIsCrimeRidden,
      locationIsHungry,
      locationIsInDisrepair,
    },
  })
).enact({
  then: ({
    $location: {
      id,
      locationIsHungry,
      locationIsInDisrepair,
      locationIsCrimeRidden,
    },
  }) => {
    const numProblems = [
      locationIsHungry,
      locationIsCrimeRidden,
      locationIsInDisrepair,
    ].filter(Boolean).length

    let locationHappiness: LocationHappiness
    if (numProblems === 0) {
      locationHappiness = LocationHappiness.HAPPY
    } else if (numProblems === 1) {
      locationHappiness = LocationHappiness.INDIFFERENT
    } else {
      locationHappiness = LocationHappiness.MISERAABLE
    }
    insert({
      [id]: {
        locationHappiness,
      },
    })
  },
})

rule(
  "A locations workforce is the sum of it's civilians",
  ({ civilianLocationId, civilianJob }) => ({
    $civilian: {
      civilianLocationId,
      civilianJob,
    },
  })
).enact({
  thenFinally: (getCivilians) => {
    const locToCount = new Map<string, Map<CivilianJob, number>>()

    getCivilians().forEach(
      ({ $civilian: { civilianLocationId, civilianJob } }) => {
        if (!locToCount.has(civilianLocationId))
          locToCount.set(civilianLocationId, new Map<CivilianJob, number>())
        if (!locToCount.get(civilianLocationId)?.has(civilianJob))
          locToCount.get(civilianLocationId)?.set(civilianJob, 0)
        const count = locToCount.get(civilianLocationId)?.get(civilianJob) ?? 0
        locToCount.get(civilianLocationId)?.set(civilianJob, count + 1)
      }
    )

    locToCount.forEach((jobToCount, locationId) => {
      jobToCount.forEach((count, job) => {
        let jobKey: keyof Location
        if (job === CivilianJob.CIVIC) {
          jobKey = 'locationCivics'
        } else if (job === CivilianJob.FARMER) {
          jobKey = 'locationFarmers'
        } else if (job === CivilianJob.POLICE) {
          jobKey = 'locationPolice'
        } else if (job === CivilianJob.WORKER) {
          jobKey = 'locationWorkers'
        } else throw new Error(`Unrecognized job! ${job}`)

        insert({
          [locationId]: {
            // I admit, this is kinda sketch...
            [jobKey]: count,
          },
        })
      })
    })
  },
})

rule(
  "A Locations population is the sum of it's parts",
  ({ locationFarmers, locationCivics, locationWorkers, locationPolice }) => ({
    $location: {
      locationWorkers,
      locationFarmers,
      locationCivics,
      locationPolice,
    },
  })
).enact({
  then: ({
    $location: {
      id,
      locationWorkers,
      locationFarmers,
      locationPolice,
      locationCivics,
    },
  }) => {
    insert({
      [id]: {
        locationPopulation:
          locationFarmers + locationCivics + locationPolice + locationWorkers,
      },
    })
  },
})

rule(
  "A Provinces population is the sum of it's parts",
  ({ locationProvinceId, locationPopulation }) => ({
    $location: {
      locationProvinceId,
      locationPopulation,
    },
  })
).enact({
  thenFinally: (getResults) => {
    const locations = getResults()
    const provinceToPop = new Map<string, number>()
    locations.forEach((loc) => {
      const curPop = provinceToPop.get(loc.$location.locationProvinceId) ?? 0
      provinceToPop.set(
        loc.$location.locationProvinceId,
        loc.$location.locationPopulation + curPop
      )
    })
    provinceToPop.forEach((pop, id) => {
      insert({
        [id]: {
          provincePopulation: pop,
        },
      })
    })
  },
})

// These rules are just queries
export const provinces = rule(
  'Provincies',
  ({ provinceName, provinceClassification, provincePopulation }) => ({
    $province: {
      provinceName,
      provincePopulation,
      provinceClassification,
    },
  })
).enact()

export const locations = rule(
  'Locations',
  ({
    locationName,
    locationPopulation,
    locationFarmers,
    locationPolice,
    locationWorkers,
    locationCivics,
    locationHappiness,
    locationProvinceId,
    locationIsHungry,
    locationIsInDisrepair,
    locationIsCrimeRidden,
    locationClassification,
  }) => ({
    $location: {
      locationName,
      locationPopulation,
      locationFarmers,
      locationPolice,
      locationWorkers,
      locationCivics,
      locationHappiness,
      locationProvinceId,
      locationClassification,
      locationIsCrimeRidden,
      locationIsInDisrepair,
      locationIsHungry,
    },
  })
).enact()

export const civilians = rule(
  'Civilians',
  ({
    civilianSex,
    civilianFirstName,
    civilianLastName,
    civilianLocationId,
    civilianJob,
  }) => ({
    $civilian: {
      civilianFirstName,
      civilianLastName,
      civilianLocationId,
      civilianSex,
      civilianJob,
    },
  })
).enact()
