import styled from 'styled-components';

import {Route, Routes} from "react-router-dom";
import {ButtonPage} from "./buttonPage";
import {GamePage} from "./gamePage";

const StyledApp = styled.div`
  // Your style here
`;

export function App() {

  return (
    <StyledApp>
      <Routes>
        <Route path={"/"} element={
          <ButtonPage/>
        }/>
          <Route path={"/game"} element={
            <div>
              <a href={"/"}>
                Root
              </a>
              <GamePage/>

            </div>
          }/>
      </Routes>
    </StyledApp>
  );
}

export default App;
