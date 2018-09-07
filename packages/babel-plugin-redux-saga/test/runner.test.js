var fs = require('fs')
var path = require('path')
var babel7 = require('@babel/core')
var babel6 = require('babel-core')

var plugin = require('babel-plugin-redux-saga')

function normalizeFilename(filename) {
  return path.normalize(filename).replace(/\\/g, '/')
}

function getExpected(expectedPath, sourcePath) {
  return fs
    .readFileSync(expectedPath, 'utf8')
    .replace(/\{\{absolutePath\}\}/g, normalizeFilename(sourcePath))
    .replace(/\r/g, '')
    .trim()
}

var testCases = [
  {
    desc: 'attach source to declaration',
    fixture: 'declaration',
  },
  {
    desc: 'attach source to export declaration',
    fixture: 'declaration-es6-modules',
  },
  {
    desc: 'attach source to export declaration when processed with regenerator',
    fixture: 'declaration-regenerator',
    options: { presets: ['env'] },
  },
  {
    desc: 'should wrap yielded call expression (no name check)',
    fixture: 'effect-basic',
  },
  {
    desc: 'should wrap method call',
    fixture: 'effect-method',
  },
  {
    desc: "shouldn't wrap delegate",
    fixture: 'effect-delegate',
  },
  {
    desc: 'should handle nested structures',
    fixture: 'effect-nested',
  },
  {
    desc: 'should handle function expression',
    fixture: 'expression',
  },
  {
    desc: 'should handle simplest expression',
    fixture: 'effect-expression',
  },
  {
    desc: 'should handle expressions in object properties',
    fixture: 'effect-object-props',
  },
  {
    desc: 'should be compatible with es2015 preset regenerator',
    fixture: 'regenerator',
    options: { presets: ['env'] },
  },
  {
    desc: 'should be compatible with env preset regenerator',
    fixture: 'preset-env',
    options: { presets: ['env'] },
  },
  {
    desc: 'should handle passed sourcemaps',
    fixture: 'typescript',
  },
  {
    desc: 'should build absolute path if useAbsolutePath option = true',
    fixture: 'use-absolute-path',
    pluginOptions: { useAbsolutePath: true },
  },
]

var testSuits = [
  {
    name: 'babel6',
    transform: babel7.transformSync,
    availablePresets: {
      env: '@babel/env',
    },
  },
  {
    name: 'babel7',
    transform: babel6.transform,
    availablePresets: {
      env: 'env',
    },
  },
]

testSuits.forEach(function(testSuit) {
  describe(testSuit.name, function() {
    testCases.forEach(function(testCase) {
      test(testCase.desc, function() {
        var sourcePath = path.join(__dirname, 'fixtures', testCase.fixture, 'source.js')
        var sourceMapPath = path.join(__dirname, 'fixtures', testCase.fixture, 'source.js.map')
        var expectedPath = path.join(__dirname, 'fixtures', testCase.fixture, testSuit.name + '-' + 'expected.js')
        var sourceCode = fs.readFileSync(sourcePath).toString()

        var inputSourceMap = fs.existsSync(sourceMapPath)
          ? JSON.parse(fs.readFileSync(sourceMapPath).toString())
          : undefined

        var options = testCase.options || {}
        var pluginOptions = testCase.pluginOptions || {}
        var presets = options.presets
          ? options.presets.map(function(p) {
              return testSuit.availablePresets[p]
            })
          : options.presets

        var actual = testSuit.transform(sourceCode, {
          compact: 'auto',
          filename: sourcePath,
          presets: presets,
          sourceMaps: Boolean(inputSourceMap),
          inputSourceMap: inputSourceMap,
          plugins: [[plugin, pluginOptions]],
        }).code

        if (fs.existsSync(expectedPath)) {
          var expected = getExpected(expectedPath, sourcePath)
          expect(actual).toBe(expected)
        } else {
          fs.writeFileSync(expectedPath, actual)
        }
      })
    })
  })
})
