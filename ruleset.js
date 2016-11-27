const RuleKey = require("./rulekey").RuleKey
const RuleSetEntry = require("./rulesetentry").RuleSetEntry

class RuleSet {
  constructor(scopedb) {
    this._scopedb = scopedb
    this._rules = new Map()
    this._rootkey = new RuleKey("1", "1", "1")
    this._rootentry = this._newEntry(this._rootkey)
    this._addEntry(this._rootentry)
  }

  // basic stuff
  get Root() {
    return this._rootkey
  }

  get Entries() {
    return this._rules
  }

  keyExists(key) {
    return this._rules.has(key.toString())
  }

  getEntry(key) {
    return this._rules.get(key.toString())
  }


  print() {
    for (var [key, value] of this._rules) {
      console.log(value.toString());
    }
  }

  _newEntry(key) {
    return new RuleSetEntry(key,
                  this._scopedb.scope(key))
  }

  _addEntry(entry) {
    this._rules.set(entry.Key.toString(), entry)
  }


  // add, remove, hide, unhide children
  addNew(newkey, hide = false) {
    if (this.keyExists(newkey)) { 
      this.unhide(newkey)
      return 
    }

    var newentry = this._newEntry(newkey)
    newentry.setParent(0, this.Root)
    if (hide) {
      newentry.hide()
    }

    const impactingChildren = this._setParentGetChildren(newentry)

    if (impactingChildren.size > 0) {
      for (const [keystr, childvalue] of impactingChildren) {
        this._addNewEntryAsParent(newentry, childvalue)
      }      
    }

    if (!newentry.Hidden) {
      const parentEntry = this.getEntry(newentry.getParent(0))
      parentEntry.addChildValue(newentry.Scope, false)
    }

    this._addEntry(newentry)
    return newentry
  }

  remove(key) {
    var removeentry = this._newEntry(key)
  }

  unhide(newkey) {
    const entry = this.getEntry(newkey)

    if (entry.Hidden) {
      entry.Unhide()
      this.getEntry(child.getParent(0)).addChildValue(child.Scope, false)      
    }
  }

  hide(newkey) {
    const entry = this.getEntry(newkey)

    if (!entry.Hidden) {
      entry.Hide()
      this.getEntry(child.getParent(0)).removeChildValue(child.Scope, false)      
    }    
  }

  _addNewEntryAsParent(newentry, child) {
    const noOfExistingParents = child.Parents.length

    for (var i = 0; i < noOfExistingParents; i++) {
      const parentkey = child.getParent(i)
      if (parentkey.isAncestorOf(newentry.Key)) {
        this._replaceParentWithDescendent(child, i, newentry)
        return
      }
      else if (parentkey.isMoreDistantIntersectionParent(newentry.Key)) {
        this._insertParentWithNearerIntersection(child, i, newentry)
        return
      }
    }

    if (noOfExistingParents >= 3) {
      console.log("No place to add new parent!!!")
      return
    }

    // can only be descoped, because every node except root has one parent for sure
    child.setParent(noOfExistingParents, newentry.Key)
    newentry.addChildValue(child.Scope, true)
  }

  _replaceParentWithDescendent(child, idx, newentry) {
    const currentParent = this.getEntry(child.getParent(idx));
    const scopeToAdjust = (idx === 0 && child.Hidden) ? 0 : child.Scope
    const isDescoped = (idx !== 0)

    currentParent.removeChildValue(scopeToAdjust, isDescoped)
    newentry.addChildValue(child.Scope, isDescoped)
    child.setParent(idx, newentry.Key)
  }

  _insertParentWithNearerIntersection(child, idx, newentry) {
    const currentParent = this.getEntry(child.getParent(idx));
    const scopeToAdjust = (idx === 0 && child.Hidden) ? 0 : child.Scope
    const isDescoped = (idx !== 0)

    if (!isDescoped) {
      // we only need to do this for first parent
      // as it is now descoped
      currentParent.removeChildValue(scopeToAdjust, isDescoped)
      this._propogateDescope(currentParent.Key, newentry.Key, child.Scope)      
    }

    newentry.addChildValue(scopeToAdjust, isDescoped)    
    child.insertParentAt(idx, newentry.Key)
  }

  _propogateDescope(currentParentKey, intersectionKey, scopetoadjust) {
    // we know currentParentKey cannot be root
    // because root is ancestor of all nodes
    const unionKey = currentParentKey.unionKey(intersectionKey)

    var curKey = currentParentKey;

    while (!curKey.isAncestorOrEqualOf(unionKey)) {
      const entry = this.getEntry(curKey)
      entry.addChildValue(scopetoadjust, true)
      curKey = entry.getParent(0)
    }

    // union guy gets some impacted back, as child's scope is reduced
    this.getEntry(curKey).removeChildValue(scopetoadjust, false)
  }

  // find 
  _setParentGetChildren(newentry) {

    const descendentEntries = new Map()

    // create impactedchild list
    for (const [keystr, value] of this._rules) {
      if (newentry.Key.isAncestorOf(value.Key)) {
        descendentEntries.set(keystr, value)
      }
      else if (value.Key.isAncestorOf(newentry.Key)) {
        if (newentry.getParent(0).isAncestorOf(value.Key) ) {
          newentry.setParent(0, value.Key)
        }
      }
      else if (newentry.Key.isIntersecting(value.Key)) {
        const intersectionKey = newentry.Key.intersectionKey(value.Key)
        if (!this.keyExists(intersectionKey)) {
          // relies on Map property that entries are always added at the end
          // so items will end up in descendentEntries
          const intersectionEntry = this.addNew(intersectionKey, true)
        }
      }
    }

    return RuleSet._lub(descendentEntries)
  }

  static _lub(rulemap) {
    const lub = new Map()

    for (const [keystr, value] of rulemap) {
      var include = true

      for (const parentKey of value.Parents) {
        if (rulemap.has(parentKey.toString())) {
          include = false
        }
      }

      if (include) {
        lub.set(keystr, value)
      }
    }

    return lub
  }
}

module.exports.RuleSet = RuleSet
