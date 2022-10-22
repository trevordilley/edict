import styled from 'styled-components';
import NxWelcome from './nx-welcome';
import {useEffect, useState} from "react";
import {Button, CircularProgress} from "@mui/material";
import {newWorld} from "./rules/dataGen";
import {Civilian, civilians, debug, fire, insert, locations, provinces} from "./rules/rules";
import {CivilianList} from "./components/civilian/CivilianList";

const StyledApp = styled.div`
  // Your style here
`;

enum WorldBuildingState {
  UNBUILT,
  BUILDING,
  BUILT
}

export function App() {
  const [buildingWorld, setBuildingWorld] = useState(WorldBuildingState.UNBUILT)
  const [civilianList, setCivilianList] = useState<(Civilian & {id: string})[]>([])
  const onBuildWorld = () => {
    setBuildingWorld(WorldBuildingState.BUILDING)
    const world = newWorld(3, 2, 10)
    insert(world.provinces)
    insert(world.locations)
    insert(world.civilians)

    const prov = provinces.query()
    const loc = locations.query()
    const civ = civilians.query()
    console.log({
      prov, loc, civ
    })
    setCivilianList(civ.map(c => c.$civilian))
    setBuildingWorld(WorldBuildingState.BUILT)
    console.log(debug.dotFile())
  }

  return (
    <div>
      {buildingWorld === WorldBuildingState.UNBUILT ? (<Button variant={"contained"} onClick={onBuildWorld}>Build World</Button>): <span/>}
      {buildingWorld === WorldBuildingState.BUILDING ? (<div>Loading... <CircularProgress/></div>): <span/>}
      {buildingWorld === WorldBuildingState.BUILT ? (<CivilianList civilians={civilianList}/>): <span/>}

    </div>
  );
}

export default App;
