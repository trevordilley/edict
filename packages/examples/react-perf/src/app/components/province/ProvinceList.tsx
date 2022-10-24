import { insert, Province } from '../../rules/rules';
import { Button, Typography } from '@mui/material';
import { useLocations } from '../../hooks/useLocations';
import { LocationList } from '../location/LocationList';
import { genLocation } from '../../rules/dataGen';

const generateLocation = (provinceId: string) => {
  const { newLocation, civilians } = genLocation(provinceId, 20);
  const datums = {
    ...newLocation,
    ...civilians,
  };
  insert(datums);
};

export const ProvinceRow: React.FC<Province & { id: string }> = ({
  id,
  provinceName,
  provinceClassification,
  provincePopulation,
}) => {
  const locationList = useLocations({ provinceId: id }).map((l) => l.$location);
  return (
    <div>
      <Typography variant={'h1'}>{provinceName}</Typography>
      <Typography variant={'subtitle1'}>
        A {provinceClassification} Province of {provincePopulation} people
      </Typography>
      <Button variant={'contained'} onClick={() => generateLocation(id)}>
        Add Location
      </Button>
      <LocationList locations={locationList} />
    </div>
  );
};

export const ProvinceList: React.FC<{
  provinces: (Province & { id: string })[];
}> = ({ provinces }) => {
  return (
    <div>
      {provinces.map((p) => (
        <ProvinceRow {...p} />
      ))}
    </div>
  );
};
