import { useEffect, useRef } from 'react'
import { saveAppState } from '../utils/localPersistence'

// Pass a useMemo'd snapshot so this only fires when watched values actually change.
export function useAppPersistence(snapshot) {
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    saveAppState(snapshot)
  }, [snapshot])
}
