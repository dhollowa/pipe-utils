
const {TextEditor, CompositeDisposable} = require('atom');
const etch = require('etch');
const $ = etch.dom;

module.exports =
class PipeView {
  constructor(model, {pipeBuffer} = {}) {
    this.model = model;
    this.pipeBuffer = pipeBuffer;
    this.subscriptions = new CompositeDisposable();

    etch.initialize(this)
  }

  update(props) {}

  render() {
    return (
      $.div({tabIndex: -1, className: 'pipe-command'},
        $.header({className: 'header'},
          $.span({ref: 'descriptionLabel', className: 'header-item description'},
            '$'
          ),
        $.section({className: 'input-block pipe-container'},
          $.div({className: 'input-block-item input-block-item--flex editor-container'},
            $(TextEditor, {
              ref: 'pipeEditor',
              mini: true,
              placeholderText: 'sort',
              buffer: this.pipeBuffer
            }),
          ),
        ),
      )
    );
  }

  get pipeEditor() { return this.refs.pipeEditor; }

  destroy() {
    if (this.subscriptions) this.subscriptions.dispose();
  }

  setPanel(panel) {
    this.panel = panel;
    this.subscriptions.add(this.panel.onDidChangeVisible(visible => {
      if (visible) {
        this.didShow();
      } else {
        this.didHide();
      }
    }));
  }

  didShow() {
    atom.views.getView(atom.workspace).classList.add('pipe-visible');
  }

  didHide() {
    let workspaceElement = atom.views.getView(atom.workspace);
    workspaceElement.focus();
    workspaceElement.classList.remove('pipe-visible');
  }
};
