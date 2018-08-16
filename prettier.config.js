module.exports = {
  printWidth: 120,
  singleQuote: true,
  semi: false,
  excludeFiles: 'fixtures/**/*-expected.js',
  overrides: [
    {
      files: ['packages/**/src/**/*.js', 'examples/**/src/**/*.js'],
      options: {
        trailingComma: 'all',
      },
    },
  ],
}
