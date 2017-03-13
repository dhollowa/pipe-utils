'use babel'

let pipeUtils = null

export function activate (state) {
  const PipeUtils = require('./pipe_utils')
  pipeUtils = new PipeUtils()
  pipeUtils.activate(state)
}

export function deactivate () {
  if (pipeUtils) {
    pipeUtils.deactivate()
    pipeUtils.destroy()
    pipeUtils = null
  }
}
