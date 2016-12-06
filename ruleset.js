const RuleKey = require("./rulekey").RuleKey
const RuleSetEntry = require("./rulesetentry").RuleSetEntry

class RuleSet {
  constructor(scopedb, nodenamefunc) {
    this._scopedb = scopedb
    this._rules = new Map()
    this._rootkey = new RuleKey("1", "1", "1")
    this._rootentry = this._newEntry(this._rootkey)
    this._addEntry(this._rootentry)
    this._nodenamefunc = nodenamefunc
  }

  // basic stuff
  get Root() {
    return this._rootkey
  }

  get Entries() {
    return this._rules
  }

  NodeName(key) {
    return this._nodenamefunc(key)
  }

  keyExists(key) {
    return this._rules.has(key.toString())
  }

  getEntry(key) {
    return this._rules.get(key.toString())
  }

  getParentEntry(child, idx) {
    return this.getEntry(child.getParent(idx))
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
  add(newkey, hide = false) {

    var newentry = this._newEntry(newkey)

    const family = this._getChildrenAndParents(newentry)

    // TBD - not sure if it is possible for some other entry to have added this one
    // shouldn't happen
    this.AssertEntryDoesNotExist(newentry)

    const parentkeys = family.parents.map(p => p.Key)

    for (const child of family.children) {
      this._addToChild(child, newentry, parentkeys)
    }

    if (hide) {
      newentry.hide()
    }

    this._addParents(newentry, family.parents)

    this._addEntry(newentry)

    return newentry
  }

  _addToChild(child, newparent, grandparentkeys) {
    const removedParentKeys = []

    while (child.hasMoreDistantParent(newparent.Key)) {
      removedParentKeys.push(this._removeParent(child))
    }

    this._addParent(child, newparent)

    removedParentKeys
      .filter(k => grandparentkeys.indexOf(k) < 0)
      .forEach(k => this._addParent(child, this.getEntry(k)))
   }

  _removeParent(child) {

    const parentEntry = this.getEntry(child.popParent())

    if (child.Parents.length === 0) {
      this._propogateHiddenImpacted(child, parentEntry, true)
    }

    parentEntry.changeImpactedBy(child.Scope)      

    if (child.Parents.length > 0) {
      this._changeDescopeForParent(child, parentEntry, -child.Scope)
    }

    return parentEntry.Key
  }

  _addParents(entry, parentEntries) {
    for (const parentEntry of parentEntries) {
      this._addParent(entry, parentEntry)
    }
  }

  _addParent(child, newparent) {

    if (child.Parents.length === 0) {
      this._propogateHiddenImpacted(child, newparent, false)
    }

    newparent.changeImpactedBy(-child.Scope)

    if (child.Parents.length > 0) {
      this._changeDescopeForParent(child, newparent, child.Scope)
    }

    child.pushParent(newparent.Key)
  }

  _changeDescopeForParent(child, parentEntry, descopeChangeAmt) {
    const unionKeys = child.Parents.map(p => parentEntry.Key.unionKey(p))

    function isNotImpactingUnionKey(curkey) {
      for (var i = 0; i < unionKeys.length; i++) {
        if (curkey.isAncestorOrEqualOf(unionKeys[i])) {
          return false
        }
      }
      return true
    }

    var parentKey = parentEntry.Key

    while (isNotImpactingUnionKey(parentKey)) {
      const parentEntry = this.getEntry(parentKey)
      parentEntry.changeDescopedBy(descopeChangeAmt)
      parentKey = parentEntry.getParent(0)
    }

    // since scope of child has reduced / increased, the ultimate parent's
    // impacted must change by same amount
    this.getEntry(parentKey).changeImpactedBy(descopeChangeAmt)
  }

  _propogateHiddenImpacted(child, parentEntry, remove = false) {
    while (child.Hidden && (typeof parentEntry !== 'undefined')) {

      if (remove) {
        parentEntry.changeHiddenImpactedBy(-child.Impacted - child.HiddenImpacted)
      }
      else {
        parentEntry.changeHiddenImpactedBy(child.Impacted + child.HiddenImpacted)        
      }

      child = parentEntry

      parentEntry = child.getParent(0)
    }
  }

  _getChildrenAndParents(newentry) {

    const descendentEntries = new Map()
    const parentEntries = new Map()

    /*
      TBD - We can maintain a nodes by product hierarchy to cut down the search space
    */

    for (const [keystr, value] of this.Entries) {
      if (newentry.Key.isAncestorOf(value.Key)) {
        descendentEntries.set(keystr, value)
      }
      else if (value.Key.isAncestorOf(newentry.Key)) {
        parentEntries.set(keystr, value)
      }
      else if (newentry.Key.isIntersecting(value.Key)) {
        const intersectionKey = newentry.Key.intersectionKey(value.Key)
        // relies on Map property that entries are always added at the end
        // so items will end up in descendentEntries or parentEntries
        if (!this.keyExists(intersectionKey)) {
          const intersectionEntry = this.add(intersectionKey, true)
        }
      }
    }

    const immParentEntries = RuleSet._glb(parentEntries)
                              .sort((a,b) => {
                                      a.Key.distanceFromRelated(newkey) - b.Key.distanceFromRelated(newkey)
                                    })

    return {
      "children": RuleSet._lub(descendentEntries),
      "parents" : immParentEntries
    }
  }


  static _glb(rulemap) {
    const glb = new Map(rulemap)

    for (const [keystr, value] of rulemap) {
      for (const parentkey of value.Parents) {
        glb.delete(parentkey.toString())
      }
    }

    return [...glb.values()]
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

    return [...lub.values()]
  }

  static _info(msg) {
    console.log(msg)
  }

  static _assert(cond, msg) {
    if (!cond) {
      throw new Error(msg)
    }
  }

  AssertParentsAreIntersectingOrParentsOfNew(child, newparent) {
    RuleSet._info(` ASSERT ${this.NodeName(child.Key)} : AssertParentsAreIntersectingOrParentsOfNew`)
    RuleSet._info(`  New Parent Key ${this.NodeName(newparent.Key)}`)
    const newparentkey = newparent.Key
    var cParents = 0

    for (var idx = 0; idx < child.Parents.length; idx++) {
      const parentkey = child.getParent(idx)
      if (newparent.isChildOf(parentkey)) {
        cParents++
        RuleSet._info(`  ${this.NodeName(parentkey)} is parent of new`)        
      }
      else if (parentkey.isIntersecting(newparentkey)) {
          RuleSet._info(`  ${this.NodeName(parentkey)} is intersecting new`)
          const intersectionKey = parentkey.intersectionKey(newparentkey)
      }
      else {
        RuleSet._assert(false, `${this.NodeName(parentkey)} is neither parent nor intersecting`)        
      }
    }

    RuleSet._assert(cParents <= 1, "More than one parent found")         
  }

  AssertEntryDoesNotExist(entry) {
    if (this.keyExists(entry.Key)) {
      throw new Error(`Entry ${this.NodeName(entry.Key)} already exists!`)
    }
  }

  AssertParentsAreIntersecting(entry) {
    RuleSet._info(` ASSERT ${this.NodeName(entry.Key)} : AssertParentsAreIntersecting`)
    const parents = entry.Parents

    if (parents.length === 0) {
      throw new Error(`Entry ${this.NodeName(entry.Key)} has no parents!`)      
    }
    else if (parents.length > 1) {
      for (var i = 0; i < parents.length - 1; i++) {
        for (var j = 1; j < parents.length; j++) {
          if (!entry.getParent(i).isIntersecting(entry.getParent(j))) {
            const intersectionKey = entry.getParent(i).intersectionKey(entry.getParent(j))

            throw new Error(` Parent ${i} - ${this.NodeName(entry.getParent(i))} does not intersect ${j} - ${this.NodeName(entry.getParent(j))}`);
          }
          else {
            console.log(` Parent ${i} - ${this.NodeName(entry.getParent(i))} intersects ${j} - ${this.NodeName(entry.getParent(j))}`)
          }
        }
      }
    }
    else {
      console.log(` Parent ${this.NodeName(entry.getParent(0))}`)      
    }
  }

  VerifyEntry(key) {
    const name = (key) => {
      return this.NodeName(key)
    }

    const log = (type, entry) => {
      console.log(`${type}\t${entry.OriginalScope}\t${entry.Scope}\t${entry.Impacted}\t${entry.HiddenImpacted}\t${entry.Hidden}\t${name(entry.Key)}`)
    }

    const entry = this.getEntry(key)

    console.log(`\n\nVerifying ${name(key)}`)
    log(" Parent ", entry)        


    const descendentEntries = new Map()

    for (const [keystr, value] of this.Entries) {
      if (key.isAncestorOf(value.Key)) {
        descendentEntries.set(keystr, value)
      }      
    }

    const children = RuleSet._lub(descendentEntries)

    var totalDescoped = 0
    var totalImpacted = 0
    var expectedHiddenImpacted = 0

    for (const cvalue of children) {
      if (cvalue.getParent(0).isEqual(key)) {
        if (cvalue.Hidden) {
          log(" HImpact", cvalue)        
          expectedHiddenImpacted += (cvalue.Impacted + cvalue.HiddenImpacted)
          totalImpacted += cvalue.Scope
        }
        else {
          log(" Impact ", cvalue)        
          totalImpacted += cvalue.Scope
        }
      }
      else if (cvalue.getParent(1) && cvalue.getParent(1).isEqual(key)) {
        log(" Dscop1 ", cvalue)                
        totalDescoped += cvalue.Scope
      }
      else if (cvalue.getParent(2) && cvalue.getParent(2).isEqual(key)) {
        log(" Dscop2 ", cvalue)                
        totalDescoped += cvalue.Scope
      }
    }

    console.log(` Parents : ${entry.Parents.map(p => this.NodeName(p))}`)

    const expectedScope = entry.OriginalScope - totalDescoped
    const expectedImpacted =  expectedScope - totalImpacted 

    if (expectedScope !== entry.Scope) {
      console.log(`***Failed expected Scope : ${expectedScope}`)
    }

    if (expectedImpacted !== entry.Impacted) {
      console.log(`***Failed expected Impact : ${expectedImpacted}`)
    }

    if (expectedHiddenImpacted !== entry.HiddenImpacted) {
      console.log(`***Failed expected Hidden Impact : ${expectedHiddenImpacted}`)      
    }

  }

}


module.exports.RuleSet = RuleSet


