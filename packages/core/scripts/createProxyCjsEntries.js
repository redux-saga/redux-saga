const fs = require('fs')

const DIST_DIR = `${__dirname}/../dist`

const createEntryFile = entry => `"use strict";

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${entry}.prod.cjs.js')
} else {
  module.exports = require('./${entry}.dev.cjs.js')
}
`

const entries = fs
  .readdirSync(DIST_DIR)
  .filter(file => /\.prod\.cjs\.js/.test(file))
  .map(file => file.split('.')[0])

entries.forEach(entry => fs.writeFileSync(`${DIST_DIR}/${entry}.cjs.js`, createEntryFile(entry), 'utf8'))
// eslint-disable-next-line no-console
console.log(`\tCreated proxy commonjs entries: ${entries.join(', ')}.\n`)
