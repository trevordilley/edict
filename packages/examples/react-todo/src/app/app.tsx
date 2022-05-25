import styled from 'styled-components';

import {Route, Routes, Link} from 'react-router-dom';
import {useEdict} from "@edict/react";
import {AttrTypes, rule} from "@edict/core";

export type FactSchema =
  ["button", "on" | "clicked", boolean]
const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  const {query, insert, facts} = useEdict(
    {
      factSchema: {
        on: AttrTypes.bool(),
        clicked: AttrTypes.bool()
      },
      rules: ({insert}) => ({
        "click_button_inverts": rule({
          what: {
            button: {
              on: AttrTypes.bool(),
              clicked: AttrTypes.bool()
            }
          },
          when: ({button}) => button.clicked,
          then: ({button}) => {
            const invert = !button.on
            insert({button: {on: invert, clicked: false}})
          }
        })
        ,

        "button_state": rule({
          what: {
            button: {
              on: AttrTypes.bool()
            }
          }
        })

      })
      ,
      initialFacts: {
        button: {
          on: true,
          clicked: false
        }
      }
    }
  )

  const results = query("button_state")
  const isOn = results[0].button.on ? "On" : "Off"
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
              <div onClick={() => insert({button: {clicked: true}})}>
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
