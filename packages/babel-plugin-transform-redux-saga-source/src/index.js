var SourceMapConsumer = require('source-map').SourceMapConsumer;
var pathFS = require('path');
var importHelper = require('@babel/helper-module-imports');

var fnId = 'reduxSagaSource';
var tempVarId = 'res';
var locationSymbolPath = 'redux-saga';
var locationSymbolExportName = 'SAGA_LOCATION';
var hintedLocationSymbolExportName = locationSymbolExportName;

module.exports = function (babel) {
  var { types: t } = babel;
  var sourceMap = null;
  var symbolNameBinding = null;

  function getAssignementWithSymbolProperty(name, symbolName) {
    return t.memberExpression(t.identifier(name), t.identifier(symbolName), true);
  }

  function getObjectExtensionNode (path, functionName){
    if(!symbolNameBinding){
      const { name: locationSymbolName } = importHelper.addNamed(
        path,
        locationSymbolExportName,
        locationSymbolPath,
        { nameHint: hintedLocationSymbolExportName }
      );

      symbolNameBinding = locationSymbolName;
    }
    return getAssignementWithSymbolProperty(functionName, symbolNameBinding);
  }

  function getParentData(path, state){ //  eslint-disable-line
    var parent = path.findParent((path) => path.isFunction());
    var locationData = calcLocation(parent.node.loc, state.file.opts.filename, state.opts.basePath);
    var name = parent.node.id ? parent.node.id.name : 'λ';
    return {
      name,
      location: locationData
    }
  }

  function assignLoc(objectExtensionNode, fileName, lineNumber){
    return t.expressionStatement(
      t.assignmentExpression(
        "=",
        objectExtensionNode,
        t.objectExpression([
          t.objectProperty(
            t.identifier("fileName"),
            t.stringLiteral(fileName)
          ),
          t.objectProperty(
            t.identifier("lineNumber"),
            t.numericLiteral(lineNumber)
          )
        ])
      )
    )
  }

  function wrapIIFE(node, objectExtension, fileName, lineNumber, sourceCode){
    const body = [
      t.variableDeclaration("var", [
        t.variableDeclarator(
          t.identifier(tempVarId),
          node
        )
      ]),
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          objectExtension,
          t.objectExpression([
            t.objectProperty(
              t.identifier("fileName"),
              t.stringLiteral(fileName)
            ),
            t.objectProperty(
              t.identifier("lineNumber"),
              t.numericLiteral(lineNumber)
            ),
            t.objectProperty(
              t.identifier("code"),
              t.stringLiteral(sourceCode)
            )
          ])
        )
      ),
      t.returnStatement(
        t.identifier(tempVarId)
      )
    ];
    const container = t.functionExpression(
      t.identifier(fnId),
      [],
      t.blockStatement(body)
    );
    return t.callExpression(
      container, []
    )
  }

  function calcLocation(loc, fullName, basePath){
    var lineNumber = loc.start.line;
    var fileName = basePath ? pathFS.relative(basePath, fullName) : fullName;

    if (!sourceMap){
      return {
        lineNumber: lineNumber,
        fileName: fileName
      };
    }
    var mappedData = sourceMap.originalPositionFor({
      line: loc.start.line,
      column: loc.start.column
    });

    return {
      lineNumber: mappedData.line,
      fileName: fileName + ' (' + mappedData.source + ')'
    }
  }

  var visitor = {
    Program: function(path, state) {
      // clean up state for every file
      symbolNameBinding = null;
      sourceMap = state.file.opts.inputSourceMap
        ? new SourceMapConsumer(state.file.opts.inputSourceMap)
        : null;
    },
    /**
     * attach location info object to saga
     *
     * @example
     * input
     *  function * effectHandler(){}
     * output
     *  function * effectHandler(){}
     *  effectHandler[_SAGA_LOCATION] = { fileName: ..., lineNumber: ... };
     */
    FunctionDeclaration(path, state){
      if (path.node.generator !== true) return;

      const functionName = path.node.id.name;
      const objectExtensionNode = getObjectExtensionNode(path, functionName);

      var locationData = calcLocation(path.node.loc, state.file.opts.filename, state.opts.basePath);

      var declaration = assignLoc(
        objectExtensionNode,
        locationData.fileName,
        locationData.lineNumber
      );

      // https://github.com/babel/babel/issues/4007
      if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportDeclaration()) {
        path.parentPath.insertAfter(declaration);
      } else {
        path.insertAfter(declaration);
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
     *    var res = call(smthelse);
     *    res[_SAGA_LOCATION] = { fileName: ..., lineNumber: ... };
     *    return res
     *  })()
     */
    CallExpression(path, state) {
      var node = path.node;
      // NOTE: we are interested only in 2 levels in depth. even that approach is error-prone, probably will be removed
      const isParentYield = path.parentPath.isYieldExpression();
      const isGrandParentYield = path.parentPath.parentPath.isYieldExpression(); // NOTE: we don't check whether parent is logical / binary / ... expression
      if (!isParentYield && !isGrandParentYield) return;

      if (!node.loc) return;
      // if (path.parentPath.node.delegate) return; // should we ignore delegated?

      var file = state.file;
      var locationData = calcLocation(node.loc, file.opts.filename, state.opts.basePath);

      const objectExtensionNode = getObjectExtensionNode(path, tempVarId);

      var sourceCode = path.getSource();

      var iife = wrapIIFE(
        path.node,
        objectExtensionNode,
        locationData.fileName,
        locationData.lineNumber,
        sourceCode
      );

      path.replaceWith(iife);
    }
  };

  return {
    visitor
  };
}
