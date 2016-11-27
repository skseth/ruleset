const RuleKey = require("./rulekey").RuleKey

class ScopeEntry {
  constructor(rulekey, scope) {
    this._rulekey = rulekey
    this._scope = scope
  }

  get Key() { return this._rulekey }
  get Scope() { return this._scope }

  addScope(scope) {
    this._scope += scope
  }

  toString() {
    return `${this.Key.toString()},${this.Scope}`
  }
}

class ScopeDB {
  constructor() {
    this.scopes = new Map()
  }

  add(rulekey, scope) {
    if (scope > 0) {
      this.scopes.set(rulekey.toString(), new ScopeEntry(rulekey, scope))
      this.addAllParents(rulekey, scope)
    }
  }

  scope(rulekey) {
    const entry = this.scopes.get(rulekey.toString())
    if (typeof entry === "undefined") {
      return 0
    }
    else {
      return entry.Scope
    }
  }

  addAllParents(rulekey, scope) {
    const ps = rulekey.pid.split('.')
    const ls = rulekey.lid.split('.')
    const ts = rulekey.tid.split('.')

    var pid = ""
    var lid = ""
    var tid = ""

    for (const p of ps) {
      pid = pid === ""? p : `${pid}.${p}`
      lid = ""
      for (const l of ls) {
        lid = lid == ""? l : `${lid}.${l}`
        tid = ""
        for (const t of ts) {
          tid = tid == ""? t : `${tid}.${t}`
          const parentrulekey = new RuleKey(pid, lid, tid)
          const parentscopeentry = this.scopes.get(parentrulekey.toString())
          
          if (typeof parentscopeentry == "undefined") {
            this.add(parentrulekey, scope)
          }
          else {
            parentscopeentry.addScope(scope)
          }
        }
      }
    }

  } 

  print() {
    for (var [key, value] of this.scopes) {
      console.log(value.toString());
    }
  }
}

module.exports.ScopeDB = ScopeDB