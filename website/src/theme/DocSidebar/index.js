import OriginalDocSidebar from '@theme-original/DocSidebar'
import useWindowSize from '@theme/hooks/useWindowSize'
import React from 'react'
import { useLocation } from 'react-router'
import styles from './styles.module.css'

function buildScript(src, attrs = {}) {
  const script = document.createElement('script')
  script.async = true
  Object.keys(attrs).forEach((attr) => script.setAttribute(attr, attrs[attr]))
  script.src = src

  return script
}

export default function DocSidebar(props) {
  const ref = React.useRef()
  const windowSize = useWindowSize()
  const { pathname } = useLocation()

  React.useEffect(() => {
    if (windowSize !== 'desktop') {
      return
    }
    const script = buildScript('//cdn.carbonads.com/carbon.js?serve=CESDV5Q7&placement=redux-sagajsorg', {
      type: 'text/javascript',
      id: '_carbonads_js',
    })
    const sidebarWrapper = ref.current
    sidebarWrapper.classList.remove(styles.roomForCarbon)

    const carbonWrapper = document.createElement('div')
    carbonWrapper.classList.add(styles.carbonWrapper)

    carbonWrapper.appendChild(script)
    // append at the end
    sidebarWrapper.firstChild.insertBefore(carbonWrapper, null)

    return () => {
      sidebarWrapper.classList.add(styles.roomForCarbon)
      carbonWrapper.parentElement.removeChild(carbonWrapper)
    }
  }, [pathname, windowSize])

  // use span to avoid creating containing block so that OriginalDocSidebar keeps being sticky positioned to the existing block ancestor
  return (
    <span ref={ref} className={styles.roomForCarbon}>
      <OriginalDocSidebar {...props} />
    </span>
  )
}
