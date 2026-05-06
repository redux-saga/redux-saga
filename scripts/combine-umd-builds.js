const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const mainUmdPath = path.join(repoRoot, 'packages/redux-saga/dist/redux-saga.umd.min.js')
const mainMapPath = `${mainUmdPath}.map`
const effectsUmdPath = path.join(repoRoot, 'packages/redux-saga/effects/dist/redux-saga-effects.umd.min.js')
const effectsMapPath = `${effectsUmdPath}.map`

function stripSourceMapComment(source) {
  return source.replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
}

function extractFactory(source, filePath) {
  const cleaned = stripSourceMapComment(source).trim()
  const factoryStart = cleaned.indexOf('(function(')
  if (factoryStart === -1) {
    throw new Error(`Could not find UMD factory start in ${filePath}`)
  }

  const paramStart = factoryStart + '(function('.length
  const paramEnd = cleaned.indexOf('){', paramStart)
  if (paramEnd === -1) {
    throw new Error(`Could not find UMD factory parameter in ${filePath}`)
  }

  const bodyEnd = cleaned.lastIndexOf('}));')
  if (bodyEnd === -1) {
    throw new Error(`Could not find UMD factory end in ${filePath}`)
  }

  return {
    cleaned,
    param: cleaned.slice(paramStart, paramEnd),
    body: cleaned.slice(paramEnd + 2, bodyEnd),
  }
}

function removeFileIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function main() {
  const mainSource = fs.readFileSync(mainUmdPath, 'utf8')
  const effectsSource = fs.readFileSync(effectsUmdPath, 'utf8')

  const mainFactory = extractFactory(mainSource, mainUmdPath)
  const effectsFactory = extractFactory(effectsSource, effectsUmdPath)

  const injection =
    `;(function(${effectsFactory.param}){${effectsFactory.body}})` + `(${mainFactory.param}.effects={});`

  const combined = mainFactory.cleaned.replace(/}\)\);\s*$/, `${injection}}));`)
  if (combined === mainFactory.cleaned) {
    throw new Error(`Could not inject effects UMD into ${mainUmdPath}`)
  }

  fs.writeFileSync(mainUmdPath, `${combined}\n`)
  fs.writeFileSync(effectsUmdPath, `${effectsFactory.cleaned}\n`)

  removeFileIfExists(mainMapPath)
  removeFileIfExists(effectsMapPath)
}

main()
