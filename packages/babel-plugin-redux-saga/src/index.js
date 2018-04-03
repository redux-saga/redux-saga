var SourceMapConsumer = require('source-map').SourceMapConsumer
var pathFS = require('path')

var globalSymbolName = '@@redux-saga/LOCATION'

function getSourceCode (path){
  // use `toString` for babel v7, `getSource` for older versions
  return Object.prototype.hasOwnProperty.call(path, 'toString') ? path.toString() : path.getSource();
}

function isSaga (path){
  return path.node.generator;
}

module.exports = function(babel) {
  var { types: t, template } = babel
  var sourceMap = null
  var alreadyVisited = new WeakSet();

  const extendExpressionWithLocation = template(`
    (function reduxSagaSource() {
      return Object.defineProperty(TARGET, SYMBOL_NAME, {
        value: {
          fileName: FILENAME,
          lineNumber: LINE_NUMBER,
          code: SOURCE_CODE
        }
      });
    })();
  `);

  const extendDeclarationWithLocation = template(`
    Object.defineProperty(TARGET, SYMBOL_NAME, {
      value: {
        fileName: FILENAME,
        lineNumber: LINE_NUMBER
      }
    });
  `)

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

      const extendedDeclaration = extendDeclarationWithLocation({
        TARGET: t.identifier(functionName),
        SYMBOL_NAME: getSymbol(state.opts.useSymbol),
        FILENAME: t.stringLiteral(locationData.fileName),
        LINE_NUMBER: t.numericLiteral(locationData.lineNumber),
      })

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

      const extendedExpression = extendExpressionWithLocation({
        TARGET: node,
        SYMBOL_NAME: getSymbol(state.opts.useSymbol),
        FILENAME: t.stringLiteral(locationData.fileName),
        LINE_NUMBER: t.numericLiteral(locationData.lineNumber),
        SOURCE_CODE:  t.stringLiteral(sourceCode),
      });

      path.replaceWith(extendedExpression)
    },
    /**
     * attach location info object to effect descriptor
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
    CallExpression(path, state) {
      var node = path.node
      // NOTE: we are interested only in 2 levels in depth. even that approach is error-prone, probably will be removed
      var isParentYield = path.parentPath.isYieldExpression()
      var isGrandParentYield = path.parentPath.parentPath.isYieldExpression() // NOTE: we don't check whether parent is logical / binary / ... expression
      if (!isParentYield && !isGrandParentYield) return

      if (!node.loc) return
      // if (path.parentPath.node.delegate) return // should we ignore delegated?

      var file = state.file
      var locationData = calcLocation(node.loc, file.opts.filename, state.opts.basePath)
      var sourceCode = getSourceCode(path);

      const extendedExpression = extendExpressionWithLocation({
        TARGET: node,
        SYMBOL_NAME: getSymbol(state.opts.useSymbol),
        FILENAME: t.stringLiteral(locationData.fileName),
        LINE_NUMBER: t.numericLiteral(locationData.lineNumber),
        SOURCE_CODE:  t.stringLiteral(sourceCode),
      });

      path.replaceWith(extendedExpression)
    },
  }

  return {
    visitor,
  }
}
