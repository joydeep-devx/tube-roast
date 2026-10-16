import { useEffect } from 'react'
import { useLocation } from 'react-router'

const MAX_FRAMES_TO_WAIT = 30

/**
 * Client-side navigation doesn't reset scroll like a full page load does.
 * New page → scroll to top. URL with #section → scroll to that section once it has rendered.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }

    // The target may not exist yet right after navigating, so retry for a few frames.
    let frame = 0
    let requestId
    const tryScroll = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView()
      } else if (frame++ < MAX_FRAMES_TO_WAIT) {
        requestId = requestAnimationFrame(tryScroll)
      }
    }
    tryScroll()
    return () => cancelAnimationFrame(requestId)
  }, [pathname, hash])

  return null
}

export default ScrollManager
