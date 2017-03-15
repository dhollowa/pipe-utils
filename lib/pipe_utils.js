'use babel'

import {CompositeDisposable} from 'atom'
import {Range} from 'atom'
import {spawn} from 'child_process'
import {TextBuffer} from 'atom'
import EditScope from './edit_scope'
import PipeView from './pipe_view'

export default class PipeUtils {
  constructor () {
    this.subscriptions = null
  }

  activate () {
    this.subscriptions = new CompositeDisposable
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pipe-utils:show': () => this.showPanel()
    }))
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pipe-utils:toggle': () => this.togglePanel()
    }))
  }

  deactivate () {
    this.pipePanel.destroy()
    this.pipePanel = null

    this.pipeView.destroy()
    this.pipeView = null

    this.subscriptions.dispose()
    this.subscriptions = null
  }

  showPanel () {
    this.createViews()
    this.pipePanel.show()
    this.pipeView.focusPipeEditor()
  }

  togglePanel () {
    this.createViews()
    if (this.pipePanel.isVisible()) {
      this.pipePanel.hide()
    } else {
      this.pipePanel.show()
    }
  }

  focusActiveTextEditor () {
    editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      return
    }
    view = atom.views.getView(editor)
    if (!view) {
      return
    }
    view.focus()
  }

  pipeSelection (command) {
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
    // TODO(dhollowa): Un-confuse the child processes to get multi-select working.
    scope.add(1)
    editor.createCheckpoint()

    properties = { reversed: true, invalidate: 'never' }
    ranges.every(range => {
      marker = editor.markBufferRange(range, properties)
      this.pipeRange(command, marker, editor, scope)
      // TODO(dhollowa): Un-confuse the child processes to get multi-select working.
      return false
    })
  }

  pipeRange (command, marker, editor, scope) {
    stdout = ''
    stderr = ''

    selection = editor.getTextInBufferRange(marker.getBufferRange())
    child = spawn(process.env.SHELL, ["-l", "-c", command])
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

  createViews () {
    if (this.pipeView) {
      return
    }
    this.buffer = new TextBuffer
    this.pipeView = new PipeView(this, this.buffer)
    this.pipePanel = atom.workspace.addBottomPanel({
      item: this.pipeView, visible: false, className: 'tool-panel panel-bottom'})
    this.pipeView.setPanel(this.pipePanel)
  }

  // Delegate method. Called when the pipeView confirms the command.
  confirm(buffer) {
    this.pipePanel.hide()
    this.focusActiveTextEditor()
    this.pipeSelection(buffer.getText())
  }

  // Delegate method. Called when the window closes.
  close() {
    this.pipePanel.hide()
    this.focusActiveTextEditor()
  }

  // Delegate method. Called when the pipeView cancels the interaction.
  cancel() {
    this.pipePanel.hide()
    this.focusActiveTextEditor()
  }
}
