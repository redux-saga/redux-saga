import React from 'react';
import Layout from '@theme/Layout';
import Header from '../components/Header';
import Feature from '../components/Feature';
import Supporters from '../components/Supporters';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

const features = [
  {
    title: 'Asynchronous',
    description: `
      ES6 generators make asynchronous flows easy to read, write, and test.
      Create complex side effects without getting bogged down by the details.
    `,
  },
  {
    title: 'Composition-focused',
    description: `
      Sagas enable numerous approaches to tackling parallel execution, task concurrency,
      task racing, task cancellation, and more. Keep total control over the flow of your code. 
    `,
  },
  {
    title: 'Easy To Test',
    description: `
      Assert results at each step of a generator or for a saga as a whole.
      Either way, side effect testing is quick, concise, and painless, as testing should be.
    `,
  },
];

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="An open source Redux middleware library for efficiently handling asynchronous side effects">
      <Header />
      <main>
        <section className={'feature ' + styles.features}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <section className="feature">
          <div className="container container--l">
            <div className="row">
              <div className="col col--6">
                <h1>Backers</h1>
                <p>Support us with a monthly donation and help us continue our activities. <a href="https://opencollective.com/redux-saga#backer">Become a backer</a></p>
                <Supporters type="backer" />
              </div>
              <div className="col col--6">
                <h1>Sponsors</h1>
                <p>Become a sponsor and have your logo shown below and on Github with a link to your site. <a href="https://opencollective.com/redux-saga#sponsor">Become a sponsor</a></p>
                <Supporters type="sponsor" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
