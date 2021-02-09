module.exports = {
  title: 'Redux-Saga',
  tagline: 'An intuitive Redux side effect manager.',
  url: 'https://redux-saga.js.org/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'static/img/favicon/favicon.ico',
  organizationName: 'redux-saga',
  projectName: 'redux-saga',
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
    },
    navbar: {
      title: 'Redux-Saga',
      logo: {
        alt: 'Redux-Saga Logo',
        src: 'static/img/Redux-Saga-Logo.png',
      },
      items: [
        {
          label: 'Introduction',
          to: 'docs/introduction/GettingStarted',
          position: 'left',
        },
        {
          label: 'Basics',
          to: 'docs/basics/DeclarativeEffects',
          position: 'left',
        },
        {
          label: 'Advanced',
          to: 'docs/advanced/Channels',
          position: 'left',
        },
        {
          label: 'API',
          to: 'docs/api',
          position: 'left',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/redux-saga/redux-saga',
          position: 'right',
        },
        {
          label: 'npm',
          href: 'https://www.npmjs.com/package/redux-saga',
          position: 'right',
        },
        {
          label: 'cdnjs',
          href: 'https://cdnjs.com/libraries/redux-saga',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              href: 'docs/introduction/BeginnerTutorial',
            },
            {
              label: 'Basic Concepts',
              href: 'docs/basics/DeclarativeEffects',
            },
            {
              label: 'Advanced Concepts',
              href: 'docs/advanced/Channels',
            },
            {
              label: 'API Reference',
              href: 'docs/api',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Glossary',
              href: 'docs/Glossary',
            },
            {
              label: 'Troubleshooting',
              href: 'docs/Troubleshooting',
            },
            {
              label: 'External Resources',
              href: 'docs/ExternalResources',
            },
          ],
        },
        {
          title: 'Sources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/redux-saga/redux-saga',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/redux-saga',
            },
            {
              label: 'cdnjs',
              href: 'https://cdnjs.com/libraries/redux-saga',
            },
          ],
        },
      ],
      logo: {
        alt: 'Redux-Saga Logo',
        src: 'static/img/Redux-Saga-Logo-Landscape.png',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Redux-Saga. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/react-redux/react-redux/edit/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      },
    ],
  ],
  plugins: ['docusaurus-plugin-sass'],
};
