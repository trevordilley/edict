import styled from 'styled-components';
import NxWelcome from './nx-welcome';
import {useState} from "react";
import {Button} from "@mui/material";
import {newWorld} from "./rules/dataGen";
import {civilians, fire, insert, locations, provinces} from "./rules/rules";

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  // const [buildingWorld, setBuildingWorld] = useState(false)
  const onBuildWorld = () => {
    const world = newWorld(3, 5, 100)
    insert(world.provinces)
    insert(world.locations)
    insert(world.civilians)

    const prov = provinces.query()
    const loc = locations.query()
    const civ = civilians.query()
    console.log({
      prov, loc, civ
    })
  }

  return (
    <div>
      <Button variant={"contained"} onClick={onBuildWorld}>Build World</Button>
    </div>
  );
}

export default App;
