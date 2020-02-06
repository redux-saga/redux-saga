const cp = require('child_process')

console.log('what is npm version?')
const child = cp.spawn('npm', ['-v'])

let stdout = Buffer.from('')

child.stdout.on('data', data => {
  stdout = Buffer.concat([stdout, data])
})

child.on('close', () => {
  console.log({ stdout: String(stdout) })
})
