import { newWorld } from './rules/dataGen';
import { insert } from './rules/rules';
import { ProvinceList } from './components/province/ProvinceList';
import { useProvinces } from './hooks/useProvince';

const world = newWorld(1, 1, 10);
insert(world.provinces);
insert(world.locations);
insert(world.civilians);
export function App() {
  const provinces = useProvinces().map((p) => p.$province);
  return <ProvinceList provinces={provinces} />;
}

export default App;
