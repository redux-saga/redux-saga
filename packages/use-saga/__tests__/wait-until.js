/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { useReducer } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { select } from 'redux-saga/effects'

import { useSaga, waitUntilChanged, waitUntilExists } from '../src'

describe('waitUntilChanged', () => {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'inc':
        return state + 1
      default:
        return state
    }
  }

  it('Returns the new state value when it has changed', () => {
    const fn = jest.fn()
    function* saga() {
      const val = yield select((i) => i)
      fn(val)
      const [val2, prevVal] = yield* waitUntilChanged((i) => i)
      fn(val2, prevVal)
    }
    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, 0)
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      const onClick = () => {
        for (let i = 0; i < 42; i++) {
          dispatch({ type: 'inc' })
        }
      }
      return <button onClick={onClick}>Click</button>
    }
    render(<TestComp />)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(0)
    fireEvent.click(screen.getByText(/Click/))
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith(42, 0)
  })

  it('Waits to return the value even when the original value has not been used', () => {
    const fn = jest.fn()
    function* saga() {
      const vals = yield* waitUntilChanged((i) => i)
      fn(vals)
    }
    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, 0)
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      const onClick = () => {
        dispatch({ type: 'inc' })
      }
      return <button onClick={onClick}>Click</button>
    }
    render(<TestComp />)
    expect(fn).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText(/Click/))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([1, 0])
  })

  it('Compares arrays using deep equality', () => {
    const fn = jest.fn()
    const reducer = (state, action) => {
      switch (action.type) {
        case 'set-even':
          return [0, 2]
        case 'set-odd':
          return [1, 3]
        default:
          return state
      }
    }
    function* saga() {
      while (true) {
        const val = yield* waitUntilChanged((i) => i)
        fn(val)
      }
    }
    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, [0, 2])
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      return (
        <>
          <button onClick={() => dispatch({ type: 'set-even' })}>Set Even</button>
          <button onClick={() => dispatch({ type: 'set-odd' })}>Set Odd</button>
        </>
      )
    }
    render(<TestComp />)
    expect(fn).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText(/Even/))
    fireEvent.click(screen.getByText(/Even/))
    // It should not have been called because the array is being repeatedly set to
    // `[0, 2]` which is deeply equal to the initial value.
    expect(fn).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText(/Odd/))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('waitUntilExists', () => {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'setFoo':
        return {
          ...state,
          foo: action.value,
        }
      default:
        return state
    }
  }

  it('Returns the value without waiting if it already exists', () => {
    const fn = jest.fn()
    function* saga() {
      const val = yield* waitUntilExists((state) => state.foo)
      fn(val)
    }
    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, { foo: 'exists' })
      useSaga({ state, dispatch: reducerDispatch }, saga)
      return <button>Nothing</button>
    }
    render(<TestComp />)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('exists')
  })

  it('Waits to return until the value does exist', () => {
    const fn = jest.fn()
    function* saga() {
      const val = yield* waitUntilExists((state) => state.foo)
      fn(val)
    }
    const TestComp = () => {
      const [state, reducerDispatch] = useReducer(reducer, { foo: null })
      const { dispatch } = useSaga({ state, dispatch: reducerDispatch }, saga)
      const onClick = () => {
        dispatch({ type: 'setFoo', value: 'something' })
      }
      return <button onClick={onClick}>Click</button>
    }
    render(<TestComp />)
    expect(fn).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText(/Click/))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('something')
  })
})
