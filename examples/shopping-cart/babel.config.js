module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        forceAllTransforms: true,
      },
    ],
    '@babel/preset-react',
  ],
}
