/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Highlight } from 'prism-react-renderer'

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useColorMode } from '@docusaurus/theme-common'

function CodeSnippet({ code }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    siteConfig: {
      themeConfig: { prism = {} },
    },
  } = useDocusaurusContext()
  const { colorMode } = useColorMode()
  const prismTheme = colorMode === 'dark' ? prism.darkTheme : prism.theme

  return (
    <Highlight key={mounted} code={code} theme={prismTheme} language="js">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

CodeSnippet.propTypes = {
  code: PropTypes.string,
}

export default CodeSnippet
