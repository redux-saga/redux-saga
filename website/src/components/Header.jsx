import React from 'react'
import Link from '@docusaurus/Link'
import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from '../pages/styles.module.css'

function Header() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className="row">
          <div className="col">
            <h1 className="hero__title">{siteConfig.title}</h1>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <p className="hero__subtitle">Easy to manage, easy to test, and executes efficiently.</p>
            <div className={styles.buttons}>
              <Link
                className={clsx('button button--secondary button--lg', styles.getStarted)}
                to={useBaseUrl('docs/introduction/GettingStarted')}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
