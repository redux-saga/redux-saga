/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, createContext, useCallback, useContext, useEffect, useReducer } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { call, cancelled, delay, fork, put, select, take } from 'redux-saga/effects'

import { useSaga, waitUntilExists } from '../src'

describe('useSaga', () => {
  it('Re-renders the component when a dispatched action changes the state from a saga', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'change':
          return state + 1
        default:
          return state
      }
    }

    // Adding in a saga that changes the state
    function* saga() {
      while (true) {
        yield take('changeFromSaga')
        yield put({ type: 'change' })
      }
    }

    const TestCompWithSaga = (props) => {
      const [state, dispatch] = useReducer(reducer, 0)
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      props.fn()
      return (
        <>
          <button onClick={() => put({ type: 'change' })}>Change</button>
          <button onClick={() => put({ type: 'changeFromSaga' })}>Saga</button>
          <button onClick={() => put({ type: 'noop' })}>Noop</button>
        </>
      )
    }

    const renderFn = jest.fn()
    render(<TestCompWithSaga fn={renderFn} />)
    expect(renderFn).toHaveBeenCalledTimes(1)
    // This changes the state, React re-renders.
    fireEvent.click(screen.getByText(/Change/))
    expect(renderFn).toHaveBeenCalledTimes(2)

    // Re-renders twice, because there's two "rounds" of dispatches. The first
    // one sent from the button click, and the second one sent from the saga.
    fireEvent.click(screen.getByText(/Saga/))
    expect(renderFn).toHaveBeenCalledTimes(4)

    // This does not change the state, but React still re-renders. Same as
    // plain usage of useReducer.
    fireEvent.click(screen.getByText(/Noop/))
    expect(renderFn).toHaveBeenCalledTimes(5)
  })

  it('Handles take effects and put effects', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'change':
          return {
            ...state,
            text: action.payload,
          }
        default:
          return state
      }
    }

    function* saga() {
      yield take('proceed')
      yield put({ type: 'change', payload: 'second' })
      yield take('proceed')
      yield put({ type: 'change', payload: 'third' })
    }

    const TestComp = (props) => {
      const [state, reducerDispatch] = useReducer(reducer, { text: props.initialText })
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      return (
        <div>
          <h1>{state.text}</h1>
          <button onClick={() => dispatch({ type: 'proceed' })}>Click</button>
        </div>
      )
    }
    render(<TestComp initialText={'first'} />)
    expect(screen.getByText(/first/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Click/))
    expect(screen.getByText(/second/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Click/))
    expect(screen.getByText(/third/)).toBeInTheDocument()
  })

  it("Requires the saga's arguments as the strongly-typed, variadic last argument", () => {
    const reducer = (state, _) => state

    function* saga(fn) {
      yield take('proceed')
      yield take('proceed')
      yield call(fn, 'hello')
    }

    const TestComp = (props) => {
      const [state, reducerDispatch] = useReducer(reducer, {})
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga, props.fn)
      return <button onClick={() => dispatch({ type: 'proceed' })}>Click</button>
    }
    const fn = jest.fn()
    render(<TestComp fn={fn} />)
    const button = screen.getByText(/Click/)
    expect(fn).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(fn).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('hello')
    fireEvent.click(button)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('Can react to props changing state by incorporating those into the reducer state', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'changeFirst':
          return {
            ...state,
            firstText: action.payload,
          }
        case 'changeSecond':
          return {
            ...state,
            secondText: action.payload,
          }
        default:
          return state
      }
    }

    function* saga() {
      yield take('proceed')
      yield put({ type: 'changeFirst', payload: 'first has changed' })
      const secondText = yield waitUntilExists((state) => state.secondText)
      yield take('proceed')
      yield put({ type: 'changeFirst', payload: secondText.toUpperCase() })
    }

    const TestComp = (props) => {
      const [state, reducerDispatch] = useReducer(reducer, { firstText: props.firstText })
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      useEffect(() => {
        dispatch({ type: 'changeSecond', payload: props.secondText })
      }, [dispatch, props.secondText])
      return (
        <div>
          <h1>{state.firstText}</h1>
          <h2>{state.secondText ?? 'Second is null'}</h2>
          <button onClick={() => dispatch({ type: 'proceed' })}>Click</button>
        </div>
      )
    }
    const { rerender } = render(<TestComp firstText={'first'} />)
    expect(screen.getByText(/first/)).toBeInTheDocument()
    expect(screen.getByText(/Second is null/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Click/))
    expect(screen.getByText(/first has changed/)).toBeInTheDocument()
    expect(screen.getByText(/Second is null/)).toBeInTheDocument()

    // Proceeding here won't do anything since the saga is waiting
    fireEvent.click(screen.getByText(/Click/))
    fireEvent.click(screen.getByText(/Click/))
    fireEvent.click(screen.getByText(/Click/))
    expect(screen.getByText(/first has changed/)).toBeInTheDocument()
    expect(screen.getByText(/Second is null/)).toBeInTheDocument()

    // State has been updated; saga now pending on 'proceed' action
    rerender(<TestComp firstText="does not matter" secondText="updated" />)
    expect(screen.getByText(/first has changed/)).toBeInTheDocument()
    expect(screen.getByText(/updated/)).toBeInTheDocument()

    // We've proceeded, saga used the secondText state to update the first
    fireEvent.click(screen.getByText(/Click/))
    expect(screen.getByText(/UPDATED/)).toBeInTheDocument()
    expect(screen.getByText(/updated/)).toBeInTheDocument()

    // Even if we update the props/secondText state now, the saga's already over
    rerender(<TestComp firstText="does not matter" secondText="already done" />)
    expect(screen.getByText(/UPDATED/)).toBeInTheDocument()
    expect(screen.getByText(/already done/)).toBeInTheDocument()
  })

  it('Does not re-render the component anymore than normal use of useReducer when using a saga that does not change the state', () => {
    // Even though no actions change the state
    const reducer = (state, _) => state
    const sagaFn = jest.fn()
    function* saga() {
      while (true) {
        yield take('noop')
        sagaFn()
      }
    }

    const TestComp = (props) => {
      const [state, dispatch] = useReducer(reducer, {})
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      props.fn()
      return <button onClick={() => put({ type: 'noop' })}>Click</button>
    }

    const renderFn = jest.fn()
    render(<TestComp fn={renderFn} />)
    expect(renderFn).toHaveBeenCalledTimes(1)
    expect(sagaFn).not.toHaveBeenCalled()

    // This does not change the state, but React still re-renders. Same as
    // plain usage of useReducer.
    fireEvent.click(screen.getByText(/Click/))
    expect(renderFn).toHaveBeenCalledTimes(2)
    expect(sagaFn).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText(/Click/))
    expect(renderFn).toHaveBeenCalledTimes(3)
    expect(sagaFn).toHaveBeenCalledTimes(2)
  })

  it('Cancels and restarts the saga if args change', () => {
    const reducer = (state, _) => state

    const calledOnCancel = jest.fn()
    function* saga(_) {
      try {
        // Dumb saga not doing anything, just looping
        while (true) {
          yield take('*')
        }
      } finally {
        if (yield cancelled()) {
          calledOnCancel()
        }
      }
    }

    const TestComp = (props) => {
      const [state, dispatch] = useReducer(reducer, {})
      useSaga({ state, dispatch }, saga, props.str)
      return <button>{props.str}</button>
    }
    const { rerender } = render(<TestComp str="a" />)
    expect(calledOnCancel).not.toHaveBeenCalled()

    // Args don't change, the saga's unaffected.
    rerender(<TestComp str={'a'} />)
    expect(calledOnCancel).not.toHaveBeenCalled()

    // Arg change, cancelled and restarted.
    rerender(<TestComp str={'b'} />)
    expect(calledOnCancel).toHaveBeenCalledTimes(1)
  })

  it('Ensures selects following puts receive the correct state', () => {
    const reducer = (state, _) => state + 1

    const states = []

    function* saga() {
      yield put({ type: 'change' })
      states.push(yield select())
      yield put({ type: 'change' })
      states.push(yield select())
      yield put({ type: 'change' })
      states.push(yield select())
    }

    const TestComp = () => {
      const [state, dispatch] = useReducer(reducer, 0)
      useSaga({ state, dispatch }, saga)
      return null
    }
    render(<TestComp />)
    expect(states).toEqual([1, 2, 3])
  })

  it('Passes extra select arguments to the selector when waiting for a state update', () => {
    const reducer = (state, _) => state + 1
    const selector = (state, a, b) => [state, a, b]

    const results = []

    function* saga() {
      results.push(yield select(selector, 'a', 'b'))
      yield put({ type: 'change' })
      results.push(yield select(selector, 'a', 'b'))
    }

    const TestComp = () => {
      const [state, dispatch] = useReducer(reducer, 0)
      useSaga({ state, dispatch }, saga)
      return null
    }
    render(<TestComp />)
    expect(results).toEqual([
      [0, 'a', 'b'],
      [1, 'a', 'b'],
    ])
  })

  it('Does not miss actions dispatched immediately', () => {
    const TestContext = createContext({ doThing: () => {} })
    const reducer = (state, _) => state + 1

    const fn = jest.fn()
    function* saga() {
      yield take('change')
      fn()
    }

    const ParentComp = () => {
      const [state, dispatch] = useReducer(reducer, 0)
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      const doThing = useCallback(() => {
        put({ type: 'change' })
      }, [put])
      return (
        <TestContext.Provider value={{ doThing }}>
          <ChildComp />
        </TestContext.Provider>
      )
    }
    const ChildComp = () => {
      const { doThing } = useContext(TestContext)
      useEffect(() => {
        // Testing that the action dispatched by this call gets processed by the saga.
        // This will actually happen before the saga starts
        doThing()
      }, [doThing])
      return <p>Child</p>
    }
    render(<ParentComp />)
    expect(fn).toHaveBeenCalled()
  })

  it('Ensures an immediate select receives the updated state when an action dispatched by a child component before the saga starts updates the state', (done) => {
    const reducer = (_, action) => action.value
    function* saga() {
      const val = yield waitUntilExists((state) => state)
      expect(val).toBe('something')
      done()
    }

    const ParentComp = () => {
      const [state, dispatch] = useReducer(reducer, null)
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      const doThing = useCallback(() => {
        put({ type: 'change', value: 'something' })
      }, [put])

      return <ChildComp doThing={doThing} />
    }

    const ChildComp = ({ doThing }) => {
      useEffect(() => {
        // Testing that the state change that this causes is reflected in the selected state
        // This will actually happen before the saga starts, because child effects run before
        // parent effects.
        doThing()
      }, [doThing])
      return <p>Child</p>
    }

    render(<ParentComp />)
  })

  it('Resolves a select effect immediately following a take effect where the dispatched action did not change the state', (done) => {
    const reducer = (state, _) => state
    function* saga() {
      yield take('start')
      const val = yield select((state) => state)
      expect(val).toBe('initial')
      done()
    }

    const TestComp = () => {
      const [state, dispatch] = useReducer(reducer, 'initial')
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      useEffect(() => {
        put({ type: 'start' })
      }, [put])

      return null
    }

    render(<TestComp />)
  })

  it('Resolves select effects before take effects', () => {
    const reducer = (state, action) => {
      if (action.type === 'change') {
        return state + 1
      }
      return state
    }
    const fn = jest.fn()

    function* saga() {
      yield take('start')

      yield put({ type: 'change' })
      yield fork(function* taker() {
        yield take('change')
        fn('taker')
      })
      yield fork(function* selector() {
        const state = yield select()
        fn(`selector ${state}`)
      })
    }

    const TestComp = () => {
      const [state, dispatch] = useReducer(reducer, 0)
      const { dispatch: put } = useSaga({ state, dispatch }, saga)
      return <button onClick={() => put({ type: 'start' })}>Click</button>
    }
    render(<TestComp />)
    const button = screen.getByText(/Click/)
    fireEvent.click(button)

    expect(fn.mock.calls).toEqual([['selector 1'], ['taker']])
  })
})

describe('run additional sagas', () => {
  const SagaContext = createContext(() => {
    throw new Error('Forgot to add SagaContext.Provider')
  })

  it("Allows you to run a saga attached to another saga's environment", () => {
    const reducer = (state) => state

    function* saga(fn) {
      yield take('proceed')
      yield call(fn, 'hello')
    }

    function* nestedSaga(fn) {
      yield take('proceed')
      yield call(fn, 'from within!')
    }

    const TestComp = (props) => {
      const [state, reducerDispatch] = useReducer(reducer, {})
      const { dispatch, runSaga } = useSaga({ state, dispatch: reducerDispatch }, saga, props.fn)
      return (
        <SagaContext.Provider value={runSaga}>
          <button onClick={() => dispatch({ type: 'proceed' })}>Click</button>
          <NestedComp fn={props.fn} />
        </SagaContext.Provider>
      )
    }

    const NestedComp = (props) => {
      const onError = useCallback(() => {}, [])
      const runSaga = useContext(SagaContext)
      useEffect(() => {
        const task = runSaga({ onError }, nestedSaga, props.fn)
        return task.cancel
      }, [onError, props.fn, runSaga])
      return <h1>Nested!</h1>
    }

    const fn = jest.fn()

    render(<TestComp fn={fn} />)
    expect(screen.getByText(/Nested!/)).toBeInTheDocument()
    const button = screen.getByText(/Click/)
    fireEvent.click(button)
    expect(fn).toHaveBeenCalledWith('hello')
    expect(fn).toHaveBeenCalledWith('from within!')
  })

  it('Returns a task to be able to cancel the saga when the component is unmounted', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'change':
          return action.payload
        default:
          return state
      }
    }

    const fn = jest.fn()

    function* saga() {
      yield take('proceed')
      yield put({ type: 'change', payload: 'not empty' })
      fn('after put')
    }

    function* nestedSaga() {
      try {
        yield delay(5000)
        fn('after delay')
      } finally {
        if (yield cancelled()) {
          fn('cancel handling')
        }
      }
    }

    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, '')
      const { dispatch, runSaga } = useSaga({ state, dispatch: reducerDispatch }, saga)
      return (
        <SagaContext.Provider value={runSaga}>
          <button onClick={() => dispatch({ type: 'proceed' })}>Click</button>
          {!state && <NestedComp />}
        </SagaContext.Provider>
      )
    }

    const NestedComp = () => {
      const onError = useCallback(() => {}, [])
      const runSaga = useContext(SagaContext)
      useEffect(() => {
        const task = runSaga({ onError }, nestedSaga)
        return task.cancel
      }, [runSaga, onError])
      return <h1>Nested!</h1>
    }

    render(<TestComp />)
    expect(screen.getByText(/Nested!/)).toBeInTheDocument()
    const button = screen.getByText(/Click/)
    void act(() => {
      fireEvent.click(button)
    })
    expect(fn).toHaveBeenCalledWith('after put')
    expect(fn).not.toHaveBeenCalledWith('after delay')
    expect(fn).toHaveBeenCalledWith('cancel handling')
  })
})
