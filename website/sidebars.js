module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'introduction/beginner-tutorial',
        'introduction/saga-background'
      ],
    },
    {
      type: 'category',
      label: 'Basics Concepts',
      items: [
        'basics/declarative-effects',
        'basics/dispatching-actions',
        'basics/effect',
        'basics/error-handling',
        'basics/using-saga-helpers'
      ]
    },
    {
      type: 'category',
      label: 'Advanced Concepts',
      items: [
        'advanced/channels',
        'advanced/composing-sagas',
        'advanced/concurrency',
        'advanced/fork-model',
        'advanced/future-actions',
        'advanced/non-blocking-calls',
        'advanced/racing-effects',
        'advanced/root-saga',
        'advanced/running-tasks-in-parallel',
        'advanced/task-cancellation',
        'advanced/testing',
        'advanced/using-run-saga'
      ]
    },
    {
      type: 'doc',
      id: 'recipes/recipes'
    },
    {
      type: 'doc',
      id: 'external-resources'
    },
    {
      type: 'doc',
      id: 'troubleshooting'
    },
    {
      type: 'doc',
      id: 'glossary'
    },
    {
      type: 'doc',
      id: 'api/api-reference'
    },
  ]
};
