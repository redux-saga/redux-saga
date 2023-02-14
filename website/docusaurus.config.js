module.exports = {
  title: 'Redux-Saga',
  tagline: 'An intuitive Redux side effect manager.',
  url: 'https://redux-saga.js.org/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon/favicon.ico',
  organizationName: 'redux-saga',
  projectName: 'redux-saga',
  themeConfig: {
    image: 'img/Redux-Saga-Logo-Portrait.png',
    colorMode: {
      defaultMode: 'light',
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
    },
    announcementBar: {
      id: 'stop-war-in-ukraine',
      content:
        '<a style="font-size: 24px; font-weight: bold; line-height: 30px; text-decoration: none;" href="https://supportukrainenow.org">🇺🇦 STOP WAR IN UKRAINE 🇺🇦</a>',
      backgroundColor: '#000',
      textColor: '#FFF',
      isCloseable: false,
    },
    navbar: {
      title: 'Redux-Saga',
      logo: {
        alt: 'Redux-Saga Logo',
        src: 'img/Redux-Saga-Logo.png',
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
        {
          label: 'discord',
          href: 'https://discord.gg/AKz29HvK2h',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: 'docs/introduction/BeginnerTutorial',
              target: '_self',
            },
            {
              label: 'Basic Concepts',
              to: 'docs/basics/DeclarativeEffects',
              target: '_self',
            },
            {
              label: 'Advanced Concepts',
              to: 'docs/advanced/Channels',
              target: '_self',
            },
            {
              label: 'API Reference',
              to: 'docs/api',
              target: '_self',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Glossary',
              to: 'docs/Glossary',
              target: '_self',
            },
            {
              label: 'Troubleshooting',
              to: 'docs/Troubleshooting',
              target: '_self',
            },
            {
              label: 'External Resources',
              to: 'docs/ExternalResources',
              target: '_self',
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
        src: 'img/Redux-Saga-Logo-Landscape.png',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Redux-Saga. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/redux-saga/redux-saga/edit/main/docs/',
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.scss'),
            require.resolve('./src/css/theme-light.scss'),
            require.resolve('./src/css/theme-dark.scss'),
          ],
        },
      },
    ],
  ],
  plugins: ['docusaurus-plugin-sass', ['@docusaurus/plugin-client-redirects', { fromExtensions: ['html'] }]],
}
