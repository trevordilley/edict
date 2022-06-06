import styled from 'styled-components';

import {Route, Routes} from "react-router-dom";
import {TodoEdict} from "./rules/todoEdict";
import {TodoList} from "./components/TodoList";
import {NewTodo} from "./components/NewTodo";

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  return (
    <TodoEdict>
      <StyledApp>
        <Routes>
          <Route path={"/"} element={
            <div>
              <NewTodo/>
              <TodoList />
            </div>
          }/>
        </Routes>
      </StyledApp>

    </TodoEdict>
  );
}

export default App;
