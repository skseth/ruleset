const RuleKey = require("./rulekey").RuleKey

class RuleSetEntry {
  constructor(rulekey, scope) {
    this._rulekey = rulekey
    this._originalscope = scope
    this._descoped = 0
    this._impacted = this._originalscope
    this._parents = []
    this._hidden = false
  }

  get Key() { return this._rulekey }
  get OriginalScope() { return this._originalscope }
  get Scope() { return this._originalscope - this._descoped}
  get Impacted() { return this._impacted}
  get Parents() { return this._parents }
  get Hidden() { return this._hidden }

  // hide / unhide
  unhide() {
    this._hidden = false
  }

  hide() {
    this._hidden = true
  }

  setParent(idx, parentkey) {
    this._parents[idx] = parentkey
  }

  getParent(idx) {
    if (this._parents.length > idx) {
      return this._parents[idx]
    }
  }

  insertParentAt(idx, parentKey) {
    if (idx < this._parents.length) {
      for (var i = this._parents.length; i > idx; i--) {
        this._parents[i] = this._parents[i-1]
      }
    }
    this._parents[idx] = parentKey
  }

  removeParentAt(parentKey, idx) {
    if (idx < this._parents.length) {
      for (var i = idx; i < this._parents.length-1; i++) {
        this._parents[i] = this._parents[i+1]
      }
    }
    this._parents.pop()
  }

  // descoped + impacted
  addChildValue(value, isDescoping) {
    if (isDescoping) {
      this._descoped += value
    }

    this._impacted -= value    
  }

  removeChildValue(value, isDescoping) {
    if (isDescoping) {
      this._descoped -= value
    }

    this._impacted += value    
  }

  toString() {
    const k = this.Key
    const parentKeyStrs = this.Parents.map(pkey => pkey.toString())
    return `${k.pid}\t${k.lid}\t${k.tid}\t${this.OriginalScope}\t${this.Impacted}\t${this.Scope}\t${this.Hidden}\t${parentKeyStrs}`
  }
}

module.exports.RuleSetEntry = RuleSetEntry