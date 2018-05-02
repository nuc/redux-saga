import fsmIterator, { qEnd } from './fsmIterator'
import { fork, delay } from '../io'

export default function retry(maxTries, ms, worker, ...args) {
  let result, tries = 0

  const yFork = () => {
    let value
    try {
      value = fork(worker, ...args)
    } catch (error) {
      // debugger
    }
    return { done: false, value }
  }
  const yDelay = { done: false, value: delay(ms) }

  const setResult = res => (result = res)

  return fsmIterator(
    {
      q1() {
        tries++
        // console.log(`Trying ${tries} time`)
        return ['q2', yFork(), setResult]
      },
      q2() {
        return result.error ? ['q3'] : [qEnd]
      },
      q3() {
        return tries < maxTries ? ['q1', yDelay] : [qEnd]
      },
    },
    'q1',
    `retry(${worker.name})`
  )
}
