var test = require('tape');
var fs = require('fs');
var path = require('path');
var babel = require('@babel/core');

var pluginPath = require.resolve('../src/');

function normalizeFilename(filename) {
  return path.normalize(filename).replace(/\\/g, '/');
}

function processFile(sourcePath, sourceMapPath, options, pluginOptions) {
  var inputSourceMap;
  if (fs.existsSync(sourceMapPath)) {
    inputSourceMap = JSON.parse(fs.readFileSync(sourceMapPath).toString());
  }

  return babel.transformFileSync(sourcePath, {
    presets: options.presets,
    sourceMaps: Boolean(inputSourceMap),
    inputSourceMap: inputSourceMap,
    plugins: [
      [require(pluginPath), pluginOptions]
    ]
  }).code;
}

function getExpected(expectedPath, sourcePath) {
  return fs.readFileSync(expectedPath, 'utf-8')
    .replace(/\{\{filename\}\}/g, normalizeFilename(sourcePath))
    .replace(/\r/g, '')
    .trim();
}

var utilTests = [{
  desc: 'attach source to declaration',
  fixture: 'declaration'
}, {
  desc: 'attach source to export declaration',
  fixture: 'declaration-es6-modules'
}, {
  desc: 'attach source to export declaration when processed with regenerator',
  fixture: 'declaration-regenerator',
  options: { presets: ['@babel/env'] }
}, {
  desc: 'should wrap yielded call expression (no name check)',
  fixture: 'effect-basic',
}, {
  desc: 'should wrap method call',
  fixture: 'effect-method'
}, {
  desc: 'shouldn\'t wrap delegate (for now)',
  fixture: 'effect-delegate'
}, {
  desc: 'should handle nested structures',
  fixture: 'effect-nested'
}, {
  desc: 'should handle simplest expression',
  fixture: 'effect-expression'
}, {
  desc: 'should handle expressions in object properties',
  fixture: 'effect-object-props'
}, {
  desc: 'should be compatible with es2015 preset regenerator',
  fixture: 'regenerator',
  options: { presets: ['@babel/env'] }
}, {
  desc: 'should be compatible with env preset regenerator',
  fixture: 'preset-env',
  options: { presets: ['@babel/env'] }
}, {
  desc: 'should build path relative to basePath option',
  fixture: 'base-path',
  pluginOptions: { basePath: process.cwd() }
}, {
  desc: 'should handle passed sourcemaps',
  fixture: 'typescript'
}];

utilTests.forEach(function(config){
  test(config.desc, function(t) {
    var expectedPath = path.join(__dirname, 'fixtures', config.fixture, 'expected.js');
    var sourcePath = path.join(__dirname, 'fixtures', config.fixture, 'source.js');
    var sourceMapPath = path.join(__dirname, 'fixtures', config.fixture, 'source.js.map');

    var expected = getExpected(expectedPath, sourcePath);
    var actual = processFile(
      sourcePath,
      sourceMapPath,
      config.options || {},
      config.pluginOptions || {}
    );

    t.equal(expected, actual);

    t.end();
  });
});
