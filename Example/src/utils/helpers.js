import readline from 'node:readline'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close()
    resolve(answer.trim())
  }))
}
