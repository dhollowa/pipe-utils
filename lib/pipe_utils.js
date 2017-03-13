'use babel'

import {CompositeDisposable} from 'atom'
import {Range} from 'atom'
import {spawn} from 'child_process'
import EditScope from './edit_scope'

export default class PipeUtils {
  constructor () {
    this.subscriptions = null
  }

  activate (state) {
    this.subscriptions = new CompositeDisposable
    return this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pipe-utils:pipe-selection': this.pipeSelection
    }))
  }

  deactivate () {
    this.subscriptions.dispose()
  }

  pipeSelection () {
    editor = atom.workspace.getActiveTextEditor()
    view = atom.views.getView(editor)
    if (!editor) {
      return
    }

    scope = new EditScope(() => {
      editor.groupChangesSinceCheckpoint()
      view.focus()
    })

    ranges = editor.getSelectedBufferRanges()
    scope.add(ranges.length)
    editor.createCheckpoint()

    properties = { reversed: true, invalidate: 'never' }
    ranges.forEach(range => {
      marker = editor.markBufferRange(range, properties)
      pipeRange(marker, editor, scope)
    })
  }
}

function pipeRange (marker, editor, scope) {
  stdout = ''
  stderr = ''

  selection = editor.getTextInBufferRange(marker.getBufferRange())
  commandString = `${ atom.config.get('pipe-utils.pipeExecutable') } `
  child = spawn(process.env.SHELL, ["-l", "-c", commandString])

  child.stdout.on('data', text => {
    stdout += text
  })

  child.stderr.on('data', text => {
    stderr += text
  })

  child.on('close', code => {
    text = stderr || stdout
    editor.setTextInBufferRange(marker.getBufferRange(), text)
    scope.done()
  })

  child.stdin.write(selection)
  child.stdin.end()
}
