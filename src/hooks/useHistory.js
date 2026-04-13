import { useCallback, useRef, useState } from 'react'

export function useHistory(initialState) {
  const [index, setIndex] = useState(0)
  const stack = useRef([initialState])
  const state = stack.current[index]

  const setState = useCallback((newState) => {
    setIndex(i => {
      const next = typeof newState === 'function' ? newState(stack.current[i]) : newState
      stack.current = stack.current.slice(0, i + 1)
      stack.current.push(next)
      return i + 1
    })
  }, [])

  const undo = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const redo = useCallback(() => setIndex(i => Math.min(stack.current.length - 1, i + 1)), [])

  return [state, setState, undo, redo,
    index > 0,
    index < stack.current.length - 1
  ]
}
