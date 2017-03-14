'use babel'
/** @jsx etch.dom */

import etch from 'etch'

export default class PipeView {
  constructor (model, buffer) {
    this.model = model
    this.buffer = buffer
    etch.initialize(this)
  }

  setPanel (panel) {
    this.panel = panel
  }

  render () {
    return (
      <div className="pipe-view inline-block">
        { this.model.getText() }
      </div>
    )
  }

  update () {
    return etch.update(this)
  }

  destroy () {
    return etch.destroy(this)
  }
}
