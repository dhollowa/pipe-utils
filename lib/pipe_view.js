'use babel'
/** @jsx etch.dom */

import etch from 'etch'

export default class PipeView {
  constructor (model) {
    this.model = model
    console.log(model);

    etch.initialize(this)
  }

  render () {
    return (
      <div className="pipe-view inline-block">
        {this.model.getText()}
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
