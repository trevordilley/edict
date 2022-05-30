import styled from 'styled-components';

import {Route, Routes} from "react-router-dom";
import {ButtonPage} from "./buttonPage";
import {GamePage} from "./gamePage";
import {PasswordConfirmPage} from "./passwordConfirmPage";

const StyledApp = styled.div`
  // Your style here
`;

export function App() {

  return (
    <StyledApp>
      <div>
        Examples
        <ul>
          <li>
            <a href={"/game"}>Button</a>
          </li>
          <li>
            <a href={"/game"}>Game</a>
          </li>
          <li>
            <a href={"/password"}>Password</a>
          </li>
        </ul>

      </div>
      <Routes>
        <Route path={"/"} element={
          <ButtonPage/>
        }/>
        <Route path={"/password"} element={
          <PasswordConfirmPage/>
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
