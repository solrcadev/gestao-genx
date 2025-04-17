
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Add useMediaQuery as an alias for useIsMobile or as a more flexible version
export function useMediaQuery(breakpoint: number | string) {
  const [matches, setMatches] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    let query: string
    if (typeof breakpoint === 'number') {
      query = `(max-width: ${breakpoint - 1}px)`
    } else {
      query = breakpoint
    }
    
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }
    
    onChange() // Set initial value
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])
  
  return matches
}
