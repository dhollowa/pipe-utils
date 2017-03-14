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
    console.log("showPanel");
  }

  togglePanel () {
    this.createViews()
    console.log("togglePanel")
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
      this.pipeRange(marker, editor, scope)
    })
  }

  pipeRange (marker, editor, scope) {
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

  getText () {
    return "Foo"
  }

  createViews () {
    if (this.pipeView) {
      return
    }
    pipeBuffer = new TextBuffer
    this.pipeView = new PipeView(this, pipeBuffer)
    this.pipePanel = atom.workspace.addBottomPanel({
      item: this.pipeView, visible: false, className: 'tool-panel panel-bottom'})
    this.pipeView.setPanel(this.pipePanel)
  }
}
