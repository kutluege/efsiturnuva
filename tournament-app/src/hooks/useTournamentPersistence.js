import { useEffect, useRef } from 'react'
import { saveLocalState } from '../utils/localPersistence'

export function useTournamentPersistence(state) {
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    saveLocalState(state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.tournamentName,
    state.participantCount,
    state.matchType,
    state.participants,
    state.currentView,
    state.tournament,
    state.sync
  ])
}
