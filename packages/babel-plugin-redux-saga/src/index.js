var SourceMapConsumer = require('source-map').SourceMapConsumer
var pathFS = require('path')

var symbolName = '@@redux-saga/LOCATION'

function getSourceCode(path) {
  // use `toString` for babel v7, `getSource` for older versions
  const rawCode = Object.prototype.hasOwnProperty.call(path, 'toString') ? path.toString() : path.getSource()
  return rawCode.replace(/^(yield\*?)\s+/, '').replace(/\r/g, '')
}

function getFilename(fileOptions, useAbsolutePath) {
  if (useAbsolutePath) {
    return fileOptions.filename.replace(/\\/g, '/')
  }
  // babel v7 defines cwd. for v6 use fallback
  const cwd = fileOptions.cwd || fileOptions.sourceRoot || process.cwd()
  return pathFS.relative(cwd, fileOptions.filename).replace(/\\/g, '/')
}

function isSaga(path) {
  return path.node.generator
}

module.exports = function (babel) {
  var { types: t, template } = babel
  var sourceMap = null
  var alreadyVisited = new WeakSet()
  // Identifier of the per-file location helper. Created lazily the first time
  // a yield needs it and reset for every Program so files don't share state.
  var locationHelperId = null

  var extendExpressionWithLocationTemplate = template(`
    Object.defineProperty(TARGET, SYMBOL_NAME, {
      value: {
        fileName: FILENAME,
        lineNumber: LINE_NUMBER,
        code: SOURCE_CODE,
      },
    });
  `)

  // A single hoisted helper is emitted once per file. It guards the
  // Object.defineProperty call so yielding a primitive doesn't crash, and
  // returns the value untouched either way.
  var locationHelperDeclarationTemplate = template(`
    function HELPER(value, location) {
      if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        Object.defineProperty(value, SYMBOL_NAME, {
          value: location,
        });
      }
      return value;
    }
  `)

  var locationHelperCallTemplate = template(`
    HELPER(TARGET, {
      fileName: FILENAME,
      lineNumber: LINE_NUMBER,
      code: SOURCE_CODE,
    })
  `)

  /**
   *  Generates location descriptor
   */

  function createLocationExtender(node, location, sourceCode) {
    const extendExpressionWithLocation = extendExpressionWithLocationTemplate({
      TARGET: node,
      SYMBOL_NAME: t.stringLiteral(symbolName),
      FILENAME: t.stringLiteral(location.fileName),
      LINE_NUMBER: t.numericLiteral(location.lineNumber),
      SOURCE_CODE: sourceCode ? t.stringLiteral(sourceCode) : t.nullLiteral(),
    })

    return extendExpressionWithLocation.expression
  }

  /**
   *  Builds a call into the shared location helper for a yielded expression.
   */

  function createLocationHelperCall(node, location, sourceCode) {
    const helperCall = locationHelperCallTemplate({
      // fresh reference per call site so a single node isn't shared across the tree
      HELPER: t.identifier(locationHelperId.name),
      TARGET: node,
      FILENAME: t.stringLiteral(location.fileName),
      LINE_NUMBER: t.numericLiteral(location.lineNumber),
      SOURCE_CODE: sourceCode ? t.stringLiteral(sourceCode) : t.nullLiteral(),
    })

    return helperCall.expression
  }

  function calcLocation(loc, fileName) {
    var lineNumber = loc.start.line

    if (!sourceMap) {
      return {
        lineNumber: lineNumber,
        fileName: fileName,
      }
    }
    var mappedData = sourceMap.originalPositionFor({
      line: loc.start.line,
      column: loc.start.column,
    })

    return {
      lineNumber: mappedData.line,
      fileName: fileName + ' (' + mappedData.source + ')',
    }
  }

  var visitor = {
    Program: {
      enter: function (path, state) {
        // clean up state for every file
        sourceMap = state.file.opts.inputSourceMap ? new SourceMapConsumer(state.file.opts.inputSourceMap) : null
        locationHelperId = null
      },
      exit: function (path) {
        // emit the shared helper once, only if some yield actually used it
        if (!locationHelperId) return

        path.unshiftContainer(
          'body',
          locationHelperDeclarationTemplate({
            HELPER: locationHelperId,
            SYMBOL_NAME: t.stringLiteral(symbolName),
          }),
        )
      },
    },
    /**
     * attach location info object to saga
     *
     * @example
     * input
     *  function * effectHandler(){}
     * output
     *  function * effectHandler(){}
     *  Object.defineProperty(effectHandler, "@@redux-saga/LOCATION", {
     *    value: { fileName: ..., lineNumber: ... }
     *  })
     */
    FunctionDeclaration(path, state) {
      var node = path.node
      if (!node.loc || !isSaga(path)) return

      var functionName = node.id.name
      var filename = getFilename(state.file.opts, state.opts.useAbsolutePath)

      var locationData = calcLocation(node.loc, filename)

      const extendedDeclaration = createLocationExtender(t.identifier(functionName), locationData)

      // https://github.com/babel/babel/issues/4007
      if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportDeclaration()) {
        path.parentPath.insertAfter(extendedDeclaration)
      } else {
        path.insertAfter(extendedDeclaration)
      }
    },
    FunctionExpression(path, state) {
      var node = path.node
      if (!node.loc || !isSaga(path) || alreadyVisited.has(node)) return
      alreadyVisited.add(node)

      var filename = getFilename(state.file.opts, state.opts.useAbsolutePath)

      var locationData = calcLocation(node.loc, filename)
      var sourceCode = getSourceCode(path)

      const extendedExpression = createLocationExtender(node, locationData, sourceCode)

      path.replaceWith(extendedExpression)
    },
    /**
     * attach location info object to effect descriptor
     * ignores delegated yields
     * routes the value through a shared helper that only attaches location
     * metadata to objects, so yielding a primitive doesn't crash (issue #2088)
     *
     * @example
     * input
     *  yield call(smthelse)
     * output
     *  yield _extendSagaSourceLocation(call(smthelse), {
     *    fileName: ..., lineNumber: ..., code: ...
     *  })
     */
    YieldExpression(path, state) {
      var node = path.node
      var yielded = node.argument
      if (!node.loc || node.delegate) return
      if (!t.isCallExpression(yielded) && !t.isLogicalExpression(yielded)) return

      var filename = getFilename(state.file.opts, state.opts.useAbsolutePath)

      var locationData = calcLocation(node.loc, filename)
      var sourceCode = getSourceCode(path)

      if (!locationHelperId) {
        locationHelperId = path.scope.generateUidIdentifier('extendSagaSourceLocation')
      }

      node.argument = createLocationHelperCall(yielded, locationData, sourceCode)
    },
  }

  return {
    visitor,
  }
}
