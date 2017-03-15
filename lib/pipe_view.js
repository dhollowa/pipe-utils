'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'

import etch from 'etch'

export default class PipeView {
  constructor (delegate, buffer) {
    this.delegate = delegate
    this.buffer = buffer
    this.subscriptions = new CompositeDisposable();
    etch.initialize(this)
    this.handleEvents()
  }

  setPanel (panel) {
    this.panel = panel
  }

  render () {
    return (
      <div tabIndex="-1" className="pipe-view inline-block">
        <section className="input-block pipe-container">
          <div className="input-block-item input-block-item--flex editor-container">
            <atom-text-editor ref="pipeEditor" attributes={{mini: true}}/>
          </div>
        </section>
      </div>
    )
  }

  update () {
    return etch.update(this)
  }

  destroy () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
      this.subscriptions = null
    }
    return etch.destroy(this)
  }

  handleEvents() {
    this.subscriptions.add(atom.commands.add(this.refs.pipeEditor, {
      'core:confirm': () => this.delegate.confirm(this.refs.pipeEditor.getModel().buffer),
      'core:close': () => this.delegate.close(),
      'core:cancel': () => this.delegate.cancel()
    }));
  }

  focusPipeEditor() {
    this.refs.pipeEditor.focus()
    this.refs.pipeEditor.getModel().selectAll();
  }
}
