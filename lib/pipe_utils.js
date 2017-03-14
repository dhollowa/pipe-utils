'use babel'

import {CompositeDisposable} from 'atom'
import {Range} from 'atom'
import {spawn} from 'child_process'
import EditScope from './edit_scope'
import PipeView from './pipe_view'

export default class PipeUtils {
  constructor () {
    this.subscriptions = null
  }

  activate (state) {
    this.subscriptions = new CompositeDisposable
    this.subscriptions.add(atom.commands.add('atom-workspace', {
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

    this.view = new PipeView(this)
    this.tile = this.statusBar.addRightTile({item: this.view.element, priority: 100})

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

  getText () {
    const editor = this.workspace.getActiveTextEditor()

    if (!editor) {
      return ''
    }

    const softTabs = editor.getSoftTabs()
    const length = editor.getTabLength()
    const separator = this.config.get('indentation-indicator.spaceAfterColon') ? ': ' : ':'

    return `${this.softTabsSettingToText(softTabs)}${separator}${length}`
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
