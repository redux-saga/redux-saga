var SourceMapConsumer = require('source-map').SourceMapConsumer
var pathFS = require('path')

var wrapperFunctionName = 'reduxSagaSource'
var tempVarName = 'res'

var globalSymbolNames = '@@redux-saga/LOCATION'
var symbolName = globalSymbolNames
var plainPropertyName = globalSymbolNames

module.exports = function(babel) {
  var { types: t } = babel
  var sourceMap = null

  function getAssignementWithSymbolProperty(name) {
    return t.memberExpression(
      t.identifier(name),
      t.callExpression(
        t.memberExpression(t.identifier('Symbol'), t.identifier('for')),
        [t.stringLiteral(symbolName)]
      ),
      true);
  }

  function getAssignementWithPlainProperty(name) { 
    return t.memberExpression(t.identifier(name), t.stringLiteral(plainPropertyName), true); 
  }

  function getObjectExtensionNode(path, functionName, useSymbol) {
    return useSymbol === false
      ? getAssignementWithPlainProperty(functionName)
      : getAssignementWithSymbolProperty(functionName);
  }

  //  eslint-disable-next-line no-unused-vars
  function getParentData(path, state) {
    var parent = path.findParent(path => path.isFunction())
    var locationData = calcLocation(parent.node.loc, state.file.opts.filename, state.opts.basePath)
    var name = parent.node.id ? parent.node.id.name : 'λ'
    return {
      name,
      location: locationData,
    }
  }

  function assignLoc(objectExtensionNode, fileName, lineNumber) {
    return t.expressionStatement(
      t.assignmentExpression(
        '=',
        objectExtensionNode,
        t.objectExpression([
          t.objectProperty(t.identifier('fileName'), t.stringLiteral(fileName)),
          t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(lineNumber)),
        ]),
      ),
    )
  }

  function wrapIIFE(node, objectExtension, fileName, lineNumber, sourceCode) {
    var body = [
      t.variableDeclaration('var', [t.variableDeclarator(t.identifier(tempVarName), node)]),
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          objectExtension,
          t.objectExpression([
            t.objectProperty(t.identifier('fileName'), t.stringLiteral(fileName)),
            t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(lineNumber)),
            t.objectProperty(t.identifier('code'), t.stringLiteral(sourceCode)),
          ]),
        ),
      ),
      t.returnStatement(t.identifier(tempVarName)),
    ]
    var container = t.functionExpression(t.identifier(wrapperFunctionName), [], t.blockStatement(body))
    return t.callExpression(container, [])
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
     *  effectHandler[_SAGA_LOCATION] = { fileName: ..., lineNumber: ... }
     */
    FunctionDeclaration(path, state) {
      if (path.node.generator !== true) return

      var functionName = path.node.id.name
      var objectExtensionNode = getObjectExtensionNode(path, functionName, state.opts.useSymbol)

      var locationData = calcLocation(path.node.loc, state.file.opts.filename, state.opts.basePath)

      var declaration = assignLoc(objectExtensionNode, locationData.fileName, locationData.lineNumber)

      // https://github.com/babel/babel/issues/4007
      if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportDeclaration()) {
        path.parentPath.insertAfter(declaration)
      } else {
        path.insertAfter(declaration)
      }
    },
    /**
     * attach location info object to effect descriptor
     *
     * @example
     * input
     *  yield call(smthelse)
     * output
     *  yield (function () {
     *    var res = call(smthelse)
     *    res[_SAGA_LOCATION] = { fileName: ..., lineNumber: ... }
     *    return res
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

      var objectExtensionNode = getObjectExtensionNode(path, tempVarName, state.opts.useSymbol)

      var sourceCode = path.getSource()

      var iife = wrapIIFE(path.node, objectExtensionNode, locationData.fileName, locationData.lineNumber, sourceCode)

      path.replaceWith(iife)
    },
  }

  return {
    visitor,
  }
}
