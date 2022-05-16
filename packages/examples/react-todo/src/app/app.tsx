import styled from 'styled-components';

import { Route, Routes, Link } from 'react-router-dom';
import {useEdict} from "@edict/react";

export type FactSchema =
  ["button", "on" | "clicked", boolean]
const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  const { query, insert, facts } = useEdict<FactSchema>(
    {
      "click_button_inverts": {
        what: [
          ["button", "on"],
          ["button", "clicked"],
        ],
        when: (obj: any) => obj.button.clicked,
        then: (obj: any, {insert}) => {
          const invert = !obj.button.on
          insert(["button", "on", invert])
          insert(["button", "clicked", false])
        }
      },

      "button_state": {
        what: [
          ["button", "on"],
        ],
      }
    }, [["button", "on", true], ["button", "clicked", false]]
  )

  const results = query("button_state")
  const  isOn = results[0].button.on  ? "On" : "Off"
  return (
    <StyledApp>

      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <div onClick={() => insert(["button", "clicked", true])}>
                On?: {isOn}
              </div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>
            </div>
          }
        />
      </Routes>
      {/* END: routes */}
    </StyledApp>
  );
}

export default App;
