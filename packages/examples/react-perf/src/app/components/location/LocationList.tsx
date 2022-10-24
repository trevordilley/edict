import { Button, Typography } from '@mui/material';
import { useCivilian } from '../../hooks/useCivilian';
import { insert, Location } from '../../rules/rules';
import { CivilianList } from '../civilian/CivilianList';
import { newCivilian } from '../../rules/dataGen';

const addCivilian = (locationId: string) => {
  const { id, civilian } = newCivilian(locationId);
  insert({
    [id]: civilian,
  });
};

export const LocationRow: React.FC<Location & { id: string }> = ({
  id,
  locationName,
  locationClassification,
  locationPopulation,
}) => {
  const civilians = useCivilian({ civilianLocationId: id }).map(
    (c) => c.$civilian
  );
  return (
    <div>
      <Typography variant={'h3'}>{locationName}</Typography>
      <Typography variant={'subtitle1'}>
        A {locationClassification} Location of {locationPopulation} people
      </Typography>
      <Button variant={'contained'} onClick={() => addCivilian(id)}>
        Add Civilian
      </Button>
      <CivilianList civilians={civilians} />
    </div>
  );
};

export const LocationList: React.FC<{
  locations: (Location & { id: string })[];
}> = ({ locations }) => {
  return (
    <div>
      {locations.map((l) => (
        <LocationRow {...l} />
      ))}
    </div>
  );
};
