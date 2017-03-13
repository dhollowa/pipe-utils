'use babel'

// A utility class for tracking a count of remaining operations and invoking a
// finalization operation @c onScopeClose when the operations are done.
export default class EditScope {
  constructor (onScopeClose) {
    this.operationCount = 0
    this.onScopeClose = onScopeClose
  }

  add (operationCount) {
    this.operationCount += operationCount
  }

  done () {
    this.operationCount -= 1
    if (this.operationCount <= 0) {
      this.onScopeClose()
    }
  }
}
