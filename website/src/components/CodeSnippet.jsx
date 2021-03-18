/* eslint-disable react/jsx-key */

import React from 'react';
import PropTypes from 'prop-types';
import Highlight, { defaultProps } from 'prism-react-renderer';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useThemeContext from '@theme/hooks/useThemeContext';

function CodeSnippet({ code }) {
  const { siteConfig: { themeConfig: { prism = {} }}} = useDocusaurusContext();
  const { isDarkTheme } = useThemeContext();
  const prismTheme = isDarkTheme ? prism.darkTheme : prism.theme;

  return (
    <Highlight
      {...defaultProps}
      code={code}
      theme={prismTheme}
      language="js">
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
  );
}

CodeSnippet.propTypes = {
  code: PropTypes.string,
};

export default CodeSnippet;