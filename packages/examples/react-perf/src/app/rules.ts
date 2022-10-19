import {edict} from "@edict/core";

enum LocationClassification {
  UNINCORPORATED = "unincorporated territory",
  VILLAGE = "village",
  CITY = "city",
}

enum LocationHappiness {
  MISERAABLE = "miserable",
  INDIFFERENT = "indifferent",
  HAPPY = "happy"
}

interface Location {
  name: string
  classification: LocationClassification,
  happiness: LocationHappiness,
  population: number,
  farmers: number,
  politicians: number,
  civics: number,
  police: number,
  workers: number
  isHungry: boolean,
  isInDisrepair: boolean,
  isCrimeRidden: boolean,
}

enum CivilianJob {
  FARMER = "farmer",
  POLITICIAN = "politician",
  CIVIC = "civic",
  POLICE = "police",
  WORKER = "worker"
}

interface Civilian {
  firstName: string,
  lastName: string,
  location: string,
  job: CivilianJob
}

export type Schema = Location & Civilian

const {insert, retract, rule } = edict<Schema>(true)

const CRIME_RATIO = 0.05

rule("Locations without the right number of police are crime ridden", ({population, police}) => ({
  $location: {
    population,
    police,
  }
})).enact({
  then: ({$location: {id, population, police}}) => {
    const isCrimeRidden = police/population < CRIME_RATIO
    insert({
      [id]: {
        isCrimeRidden
      }
    })
  }
})

const FARMER_RATIO = 0.1
rule("Locations with too few farmers need food", ({population, farmers}) => ({
  $location: {
    population,
    farmers
  }
})).enact({
  then: ({$location: {id, population, farmers}}) => {
    const isHungry = farmers/population < FARMER_RATIO
    insert({
      [id]: {
        isHungry
      }
    })
  }
})

rule("Unincorporated territory has a small population", ({population}) => ({
  $location: {
    population
  }
})).enact({
  when: ({$location: { population}}) => population < 10,
  then: ({$location: {id}}) => insert({[id]: {classification: LocationClassification.UNINCORPORATED}})
})

rule("Villages have a sizeable population", ({population}) => ({
  $location: {
    population
  }
})).enact({
  when: ({$location: { population}}) => population > 10 && population < 1000,
  then: ({$location: {id}}) => insert({[id]: {classification: LocationClassification.VILLAGE}})
})

rule("Cities have a large population", ({population}) => ({
  $location: {
    population
  }
})).enact({
  when: ({$location: { population}}) => population >= 1000,
  then: ({$location: {id}}) => insert({[id]: {classification: LocationClassification.CITY}})
})

rule("Locations happiness is determined by their problems", ({isCrimeRidden, isHungry, isInDisrepair}) => ({
  $location: {
    isCrimeRidden, isHungry, isInDisrepair
  }
})).enact({
  then: ({$location: {id, isHungry, isInDisrepair, isCrimeRidden}}) => {
    const numProblems = [isHungry, isCrimeRidden, isInDisrepair].filter(Boolean).length

    let happiness: LocationHappiness
    if(numProblems === 0) {
      happiness = LocationHappiness.HAPPY
    } else if (numProblems === 1) {
      happiness = LocationHappiness.INDIFFERENT
    } else {
      happiness = LocationHappiness.MISERAABLE
    }
    insert({
      [id]: {
        happiness
      }
    })
  }
})

// These rules are just queries
export const locations = rule("Locations", ({
                                              name, population, farmers, police, politicians, workers, civics, happiness, }) => ({
  $location: {
    name,
    population,
    farmers,
    police,
    politicians,
    workers,
    civics,
    happiness
  }
})).enact()

export const civilians = rule("Civilians", ({firstName, lastName, location, job, }) => ({
  $civilian: {
    firstName,
    lastName,
    location,
    job
  }
})).enact()
