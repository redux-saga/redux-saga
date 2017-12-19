var SourceMapConsumer = require('source-map').SourceMapConsumer;
var pathFS = require('path');

var traceId = '__source';
var fnId = 'reduxSagaSource';
var tempVarId = 'res';

module.exports = function (babel) {
    var { types: t } = babel;
    var sourceMap = null;

    function getAssignementWithPlainProperty(name) {
        return t.memberExpression(t.identifier(name), t.identifier(traceId));
    }

    function getAssignementWithSymbolProperty(name, symbolName) {
        return t.memberExpression(
            t.identifier(name),
            t.callExpression(
                t.memberExpression(t.identifier('Symbol'), t.identifier('for')),
                [t.stringLiteral(symbolName)]
            ),
            true);
    }

    function getParentData(path, state){
        var parent = path.findParent((path) => path.isFunction()); // path.isFunctionDeclaration() || path.isFunctionExpression()
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
            var file = state.file;
            if (file.opts.inputSourceMap) {
                sourceMap = new SourceMapConsumer(file.opts.inputSourceMap);
            }
        },
        // FROM function * effectHandler(){}
        // TO function * effectHandler(){}
        // effectHandler.__source = { fileName: ..., lineNumber: ... };
        FunctionDeclaration(path, state){
            if (path.node.generator !== true) return;
            var locationData = calcLocation(path.node.loc, state.file.opts.filename, state.opts.basePath);

            const functionName = path.node.id.name;

            const objectExtensionNode = state.opts.useSymbol ?
                getAssignementWithSymbolProperty(functionName, state.opts.symbolName) :
                getAssignementWithPlainProperty(functionName);

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
        // FROM: yield call(smthelse)
        // TO yield (function () {var res = call(smthelse); res.__source = { fileName: ..., lineNumber: ... }; return res})()
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

            var sourceCode = path.getSource();

            const objectExtensionNode = state.opts.useSymbol ?
                getAssignementWithSymbolProperty(tempVarId, state.opts.symbolName) :
                getAssignementWithPlainProperty(tempVarId);

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
