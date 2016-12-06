const RuleKey = require("./rulekey").RuleKey

var namefunc = (key) => { return key.toString() }

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

  isEqual(other) {
    return this.Key.isEqual(other.Key)
  }

  // hide / unhide
  unhide() {
    this._hidden = false
  }

  hide() {
    this._hidden = true
  }

  isChildOf(key) {
    const idx = this.getParentInsertionIndex(key)
    return (idx < this.Parents.length) && (this.getParent(idx).isEqual(key))
  }

  getParent(idx) {
    if (this._parents.length > idx) {
      return this._parents[idx]
    }
  }

  pushParent(p) {
    this._assert(p instanceof RuleKey, "invalid parent type")
    if (this._parents.length < 3) {
      this._parents.push(p)
    }
    else {
      throw new Error(`Add Parent ${p} - One too many for ${this.Key.toString()}.\nExisting parents are : ${this._parents}`);
    }
  }

  popParent() {
    return this._parents.pop()
  }

  hasMoreDistantParent(otherkey) {
    if (this.Parents.length > 0) {
      const parentKey = this.Parents[this.Parents.length -1]
      const parentdistance = parentKey.distanceFromRelated(this.Key)

      return parentdistance > otherkey.distanceFromRelated(this.Key)
    }
    return false
  }

  changeImpactedBy(value) {
    this._impacted += value
    //this._info(`Impacted changed by ${value} to ${this._impacted}`)
  }

  changeDescopedBy(value) {
    this._descoped += value
    //this._info(`Descoped changed by ${value} to ${this._descoped}`)
  }

  _assert(cond, msg) {
    if (!cond) {
      throw new Error(msg)
    }
  }

  _info(msg) {
    console.log(`${namefunc(this.Key)} - ${msg}`)
  }

  static setNameFunc(newnamefunc) {
    namefunc = newnamefunc
  }

  toString() {
    const k = this.Key
    const parentKeyStrs = this.Parents.map(pkey => pkey.toString())
    return `${k.pid}\t${k.lid}\t${k.tid}\t${this.OriginalScope}\t${this.Impacted}\t${this.Scope}\t${this.Hidden}\t${parentKeyStrs}`
  }
}

module.exports.RuleSetEntry = RuleSetEntry