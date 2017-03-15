'use babel'

import {CompositeDisposable} from 'atom'
import {Range} from 'atom'
import {spawnSync} from 'child_process'

import EditScope from './edit_scope'
import PipeView from './pipe_view'

export default class PipeUtils {
  constructor () {
    this.subscriptions = null
  }

  activate () {
    this.subscriptions = new CompositeDisposable
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pipe-utils:show': () => this.showPanel(),
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
      this.pipeView.focusPipeEditor()
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
    if (!editor) {
      return
    }
    view = atom.views.getView(editor)
    if (!view) {
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
      this.pipeRange(command, marker, editor, scope)
    })
  }

  pipeRange (command, marker, editor, scope) {
    selection = editor.getTextInBufferRange(marker.getBufferRange())
    output = spawnSync(
      process.env.SHELL,
      ["-l", "-c", command],
      { input:selection, encoding: 'utf8' })

    if (output.stdout) {
      editor.setTextInBufferRange(marker.getBufferRange(), output.stdout)
    }

    if (output.stderr) {
      atom.notifications.addWarning(output.stderr)
    }
    scope.done()
  }

  createViews () {
    if (this.pipeView) {
      return
    }
    this.pipeView = new PipeView(this)
    this.pipePanel = atom.workspace.addBottomPanel({
      item: this.pipeView, visible: false, className: 'tool-panel panel-bottom'})
    this.pipeView.setPanel(this.pipePanel)
  }

  // Delegate method. Called when the pipeView confirms the command.
  confirm(command) {
    this.pipePanel.hide()
    this.focusActiveTextEditor()
    this.pipeSelection(command)
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
