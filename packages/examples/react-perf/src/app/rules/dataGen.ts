import {
  Civilian,
  CivilianJob,
  Location,
  LocationClassification,
  LocationHappiness,
  Province,
  ProvinceClassification,
} from './rules';
import { faker, Sex } from '@faker-js/faker';
import _ from 'lodash';

const newId = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\u0100-\uFFFF\w\-]/g, '-')
    .replace(/\_\_+/g, '_')
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

export const newCivilian = (
  civilianLocationId: string
): { id: string; civilian: Civilian } => {
  const civilianJob = _.shuffle([
    CivilianJob.WORKER,
    CivilianJob.CIVIC,
    CivilianJob.FARMER,
    CivilianJob.POLICE,
  ]).shift()!;
  const civilianSex = _.shuffle([Sex.Male, Sex.Female]).shift()!;
  const civilianFirstName = faker.name.firstName(civilianSex);
  const civilianLastName = faker.name.lastName(civilianSex);
  const id = newId(`${civilianFirstName} ${civilianLastName}`);
  return {
    id,
    civilian: {
      civilianSex,
      civilianJob,
      civilianLocationId,
      civilianFirstName,
      civilianLastName,
    },
  };
};

export const newProvince = (): { id: string; province: Province } => {
  const provinceName = `${faker.company.name()} Province`;
  return {
    id: newId(provinceName),
    province: {
      provinceClassification: ProvinceClassification.TINY,
      provinceName,
      provincePopulation: 0,
    },
  };
};

export const newLocation = (
  provinceId: string
): {
  location: {
    locationFarmers: number;
    locationName: string;
    locationWorkers: number;
    locationPolice: number;
    locationHappiness: LocationHappiness;
    locationCivics: number;
    locationIsHungry: boolean;
    locationClassification: LocationClassification.UNINCORPORATED;
    locationIsInDisrepair: boolean;
    locationIsCrimeRidden: boolean;
    locationPopulation: number;
    locationProvinceId: string;
  };
  id: string;
} => {
  const locationName = `${faker.company.name()} Location`;
  const id = newId(locationName);
  return {
    id,
    location: {
      locationWorkers: 0,
      locationPolice: 0,
      locationFarmers: 0,
      locationCivics: 0,
      locationHappiness: LocationHappiness.INDIFFERENT,
      locationPopulation: 0,
      locationName,
      locationClassification: LocationClassification.UNINCORPORATED,
      locationIsHungry: false,
      locationIsInDisrepair: false,
      locationProvinceId: provinceId,
      locationIsCrimeRidden: false,
    },
  };
};

const rand = (max: number) => Math.floor(Math.random() * max) + 1;

export const genCivilian = (locationId: string, maxPop: number) => {
  const civilians: { [key: string]: Civilian } = {};
  const numCiv = rand(maxPop);
  for (let k = 0; k < numCiv; k++) {
    const { id: civilianId, civilian } = newCivilian(locationId);
    civilians[civilianId] = civilian;
  }
  return civilians;
};

export const genLocation = (provinceId: string, maxPop: number) => {
  const { id, location } = newLocation(provinceId);
  const civilians = genCivilian(id, maxPop);
  return { newLocation: { [id]: location }, civilians };
};

export const newWorld = (
  numProvinces: number,
  maxLocations: number,
  maxPop: number
) => {
  const provinces: { [key: string]: Province } = {};
  const locations: { [key: string]: Location } = {};
  const civilians: { [key: string]: Civilian } = {};

  for (let i = 0; i < numProvinces; i++) {
    const { id: provinceId, province } = newProvince();
    provinces[provinceId] = province;
    const numLoc = rand(maxLocations);
    for (let j = 0; j < numLoc; j++) {
      const { newLocation, civilians: newCivs } = genLocation(
        provinceId,
        maxPop
      );
      Object.assign(locations, newLocation);
      Object.assign(civilians, newCivs);
    }
  }
  return {
    provinces,
    locations,
    civilians,
  };
};
