module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'About',
    },
    {
      type: 'category',
      label: 'Introduction',
      items: ['introduction/GettingStarted', 'introduction/BeginnerTutorial', 'introduction/SagaBackground'],
    },
    {
      type: 'category',
      label: 'Basics Concepts',
      items: [
        'basics/DeclarativeEffects',
        'basics/DispatchingActions',
        'basics/Effect',
        'basics/ErrorHandling',
        'basics/UsingSagaHelpers',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Concepts',
      items: [
        'advanced/Channels',
        'advanced/ComposingSagas',
        'advanced/Concurrency',
        'advanced/ForkModel',
        'advanced/FutureActions',
        'advanced/NonBlockingCalls',
        'advanced/RacingEffects',
        'advanced/RootSaga',
        'advanced/RunningTasksInParallel',
        'advanced/TaskCancellation',
        'advanced/Testing',
        'advanced/UsingRunSaga',
      ],
    },
    {
      type: 'doc',
      id: 'recipes',
    },
    {
      type: 'doc',
      id: 'ExternalResources',
    },
    {
      type: 'doc',
      id: 'Troubleshooting',
    },
    {
      type: 'doc',
      id: 'Glossary',
    },
    {
      type: 'doc',
      id: 'api',
    },
  ],
}
