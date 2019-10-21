const path = require('path')
const fs = require('fs')

function findPkgRoot(directory) {
  const configPath = path.join(directory, 'package.json')

  if (fs.existsSync(configPath)) {
    return directory
  }

  return findPkgRoot(path.join(directory, '..'))
}

const cliPkg = path.join(findPkgRoot(require.resolve('@changesets/cli')), 'dist', 'cli.cjs.dev.js')

const content = fs.readFileSync(cliPkg, 'utf8')

const target = `let json = JSON.parse(result.stdout.toString());`
const transformed = content.replace(target, ';console.log({result: result.stdout.toString()});' + target)

fs.writeFileSync(cliPkg, transformed, 'utf8')
// eslint-disable-next-line
console.log('transformed!')
