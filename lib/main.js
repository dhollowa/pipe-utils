'use babel'

import PipeUtils from './pipe_utils'

let pipeUtils = null

export function activate () {
  pipeUtils = new PipeUtils()
  pipeUtils.activate()
}

export function deactivate () {
  if (pipeUtils) {
    pipeUtils.deactivate()
    pipeUtils.destroy()
    pipeUtils = null
  }
}
