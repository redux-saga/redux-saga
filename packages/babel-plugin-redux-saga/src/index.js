var SourceMapConsumer = require('source-map').SourceMapConsumer
var pathFS = require('path')

var globalSymbolName = '@@redux-saga/LOCATION'

function getSourceCode (path){
  // use `toString` for babel v7, `getSource` for older versions
  const rawCode = Object.prototype.hasOwnProperty.call(path, 'toString') ? path.toString() : path.getSource();
  return rawCode.replace(/^(yield\*?)\s+/, '')
}

function isSaga (path){
  return path.node.generator;
}

module.exports = function(babel) {
  var { types: t, template } = babel
  var sourceMap = null
  var alreadyVisited = new WeakSet();

  var extendExpressionWithLocationTemplate = template(`
    Object.defineProperty(TARGET, SYMBOL_NAME, {
      value: {
        fileName: FILENAME,
        lineNumber: LINE_NUMBER,
        code: SOURCE_CODE,
      },
    });
  `);

  /**
   *  Genetares location descriptor
   */

  function createLocationExtender(node, useSymbol, fileName, lineNumber, sourceCode){
    const extendExpressionWithLocation = extendExpressionWithLocationTemplate({
        TARGET: node,
        SYMBOL_NAME: getSymbol(useSymbol),
        FILENAME: t.stringLiteral(fileName),
        LINE_NUMBER: t.numericLiteral(lineNumber),
        SOURCE_CODE: sourceCode ? t.stringLiteral(sourceCode) : t.nullLiteral(),
      })

    return extendExpressionWithLocation.expression;
  }

  function getSymbol(useSymbol) {
    return useSymbol === false
      ? t.stringLiteral(globalSymbolName)
      : t.callExpression(
        t.memberExpression(t.identifier('Symbol'), t.identifier('for')),
        [t.stringLiteral(globalSymbolName)]
      )
  }

  function calcLocation(loc, fullName, basePath) {
    var lineNumber = loc.start.line
    var fileName = basePath ? pathFS.relative(basePath, fullName) : fullName

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
    Program: function(path, state) {
      // clean up state for every file
      sourceMap = state.file.opts.inputSourceMap ? new SourceMapConsumer(state.file.opts.inputSourceMap) : null
    },
    /**
     * attach location info object to saga
     *
     * @example
     * input
     *  function * effectHandler(){}
     * output
     *  function * effectHandler(){}
     *  Object.defineProperty(effectHandler, Symbol.for("@@redux-saga/LOCATION"), {
     *    value: { fileName: ..., lineNumber: ... }
     *  })
     */
    FunctionDeclaration(path, state) {
      if (!isSaga(path)) return

      var functionName = path.node.id.name
      var locationData = calcLocation(path.node.loc, state.file.opts.filename, state.opts.basePath)

      const extendedDeclaration =  createLocationExtender(
        t.identifier(functionName),
        state.opts.useSymbol,
        locationData.fileName,
        locationData.lineNumber
      )

      // https://github.com/babel/babel/issues/4007
      if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportDeclaration()) {
        path.parentPath.insertAfter(extendedDeclaration)
      } else {
        path.insertAfter(extendedDeclaration)
      }
    },
    FunctionExpression(path, state) {
      var node = path.node
      var file = state.file

      if (!isSaga(path) || alreadyVisited.has(node)) return
      alreadyVisited.add(node);

      var locationData = calcLocation(node.loc, file.opts.filename, state.opts.basePath);
      var sourceCode = getSourceCode(path);

      const extendedExpression = createLocationExtender(
        node,
        state.opts.useSymbol,
        locationData.fileName,
        locationData.lineNumber,
        sourceCode
      )

      path.replaceWith(extendedExpression)
    },
    /**
     * attach location info object to effect descriptor
     * ignores delegated yields
     *
     * @example
     * input
     *  yield call(smthelse)
     * output
     *  yield (function () {
     *    return Object.defineProperty(test1, Symbol.for("@@redux-saga/LOCATION"), {
     *      value: { fileName: ..., lineNumber: ... }
     *    })
     *  })()
     */
    YieldExpression(path, state) {
      var node = path.node
      var file = state.file
      var yielded = node.argument

      if (!node.loc) return
      if (!t.isCallExpression(yielded) && !t.isLogicalExpression(yielded)) return

      var locationData = calcLocation(node.loc, file.opts.filename, state.opts.basePath)
      var sourceCode = getSourceCode(path);

      node.argument = createLocationExtender(
        yielded,
        state.opts.useSymbol,
        locationData.fileName,
        locationData.lineNumber,
        sourceCode
      )
    },
  }

  return {
    visitor,
  }
}
