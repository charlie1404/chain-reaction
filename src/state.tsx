import { createContext, useReducer, useContext } from 'react';
import type { PropsWithChildren } from 'react';

type Action = { type: string; payload: Record<string, unknown> };

const initialState = {};

const StateContext = createContext<typeof initialState>(initialState);
const DispatchContext = createContext<React.Dispatch<Action>>(() => {});

function stateReducer(state: typeof initialState, action: Action) {
  switch (action.type) {
    case 't': {
      return { ...state };
    }

    default: {
      console.warn('Unknown action: ' + action.type);
      return state;
    }
  }
}

function StateProvider({ children }: PropsWithChildren<Record<string, unknown>>) {
  const [state, dispatch] = useReducer(stateReducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function useStateContext(): typeof initialState {
  const state = useContext(StateContext);

  return state;
}

export { StateProvider, DispatchContext, useStateContext };
export type {};
