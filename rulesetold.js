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
    if (hide) {
      newentry.hide()
    }
    newentry.setParent(0, this.Root)

    const impactingChildren = this._setParentGetChildren(newentry)

    if (impactingChildren.size > 0) {
      for (const [keystr, childvalue] of impactingChildren) {
        this._addNewEntryAsParent(newentry, childvalue)
      }      
    }

    // TBD - here a new node has been added
    // now for impacted parent, we need to propogate the impacted
    // if hidden : propogate Scope - Impacted (which is visible scope of children below)
    // if not hidden, propogate Scope
    this._propogateImpacted(newentry, newentry.getParent(0), false)
/*
    if (!newentry.Hidden) {
      const parentEntry = this.getEntry(newentry.getParent(0))
      parentEntry.addChildValue(newentry.Scope, false)
    }
*/

    this._addEntry(newentry)

    return newentry
  }

/*
  Pre-condition :

  n = newentry, known to be parent of child
  pn = parent of newentry
  p0 = existing first parent
  c = child
  d(node) = distance of ancestor from child
  d(node.pid) = distance of p dimension from child

  Case 1: Given d(n) < d(p0) & pn is ancestor of p0, p0 is not ancestor of n
      pn cannot be descoped by p0

  Assume pn is descoped. An ancestor a0 of pn must exist which is not descoped
  and which intersects with pn, with p0 or some ancestor of p0 as intersection.

  d(n.pid) < d(p0.pid)
              0 <= d(n.pid) < d(p0.pid) <= d(a0.pid) <= d(pn.pid)

  assume d(n.pid) < d(p0.pid)


  Since d(n) < d(p0), 0 <= d(n.pid) <= d(p0.pid) <= a0.pid <= pn.pid




  3 possibilities :

  A. newentry's parent is an existing parent of child (no of parents = 1,2,3)
  B. child's no of parents == 1 and the one descendent is a descendent of newentry's parent
  C. child's no of parents == 2 and one descendent is a descendent of newentry's parent, one is not
     C1. first parent is descendent, second is not
         => newentrys parent was not descoped
     C2. second parent is descendent, first is not
         => newentrys parent was descoped
  D. child's no of parents == 2, and both descendents are descendents of newentry's parent

Not possible :
  E. no of parents == 3 & newentry's parent is not an existing parent
     => one of the 3 is newentry's parent or child which is impossible as 
        newentry is known parent of child

  Case A. newentry replaces parent

  Case B. newentry inserted before or after. 
          if before, parent(0) to be descoped upto parent of newentry

  Case C1. if inserted after first parent, only newparent descoped, everything else same
           if inserted before first parent, first parent becomes descoped 
           descope first parent upto newentry's parent, or upto common parent of
           other node (because that should already be descoped)



  Case C2. parent already descoped. Just insert newentry in right place

  Case D. Like C1 or C2.

if 2 existing parents, find nearest common ancestor

if newentry parent is ancestor of this guy, and this common ancestor is not ancestor
of newentry (obviously), then 



*/

  _addNewEntryAsParent(newentry, child) {
    const noOfExistingParents = child.Parents.length


    // if parent of newentry is found, replace parent
    // can parent be further than child?

    //  
    for (var i = 0; i < noOfExistingParents; i++) {
      const parentkey = child.getParent(i)
      if (parentkey.isEqual(newentry.getParent(0))) {
        this._replaceParentWithChild(child, i, newentry)
        return
      }
    }

    if (noOfExistingParents == 1) {
      if ( parentkey.isMoreDistantIntersectionParent(newentry.Key) ) {
      }
    }
    else {
      
    }


      else if ( i == 0 && parentkey.isMoreDistantIntersectionParent(newentry.Key)) {
        this._propogateMoveToDescoped(child, newentry)

      }
    }

    if (noOfExistingParents >= 3) {
      console.log("No place to add new parent!!!")
      return
    }

    // can only be descoped, because every node except root has one parent for sure
    // should happen only if parent has another intersection child
    child.setParent(noOfExistingParents, newentry.Key)
    newentry.changeImpactedBy(-child.OriginalScope)
    newentry.changeDescopedBy(child.OriginalScope)
  }


  _replaceParentWithChild(child, idx, newentry) {
    const currentParent = this.getEntry(child.getParent(idx));

    if (idx === 0) {
      this._propogateImpacted(child, currentParent.Key, true)
      newentry.changeImpactedBy(this._impactValue(child, false))
    }
    else {
      newentry.changeDescopedBy(child.OriginalScope)
    }

    //newentry.addChildValue(child.Scope, isDescoped)
    child.setParent(idx, newentry.Key)
  }


  _replaceParentWithDescendent(child, idx, newentry) {
    const currentParent = this.getEntry(child.getParent(idx));

    if (idx === 0) {
      this._propogateImpacted(child, currentParent.Key, true)
      newentry.changeImpactedBy(this._impactValue(child, false))
    }
    else {
      newentry.changeDescopedBy(child.OriginalScope)
    }

    //newentry.addChildValue(child.Scope, isDescoped)
    child.setParent(idx, newentry.Key)
  }

  _insertParentWithNearerIntersection(child, idx, newentry) {
    const currentParent = this.getEntry(child.getParent(idx));
    const scopeToAdjust = (idx === 0 && child.Hidden) ? 0 : child.Scope
    const isDescoped = (idx !== 0)

    if (idx === 0) {
      this._propogateMoveToDescoped(child, currentParent.Key)
      newentry.changeImpactedBy(this._impactValue(child))
    }
    else {
      newentry.changeDescopedBy(child.OriginalScope)      
    }

    child.insertParentAt(idx, newentry.Key)
  }

  _impactValue(child, remove) {
    const impact = child.Hidden ? child.Scope - child.Impacted : child.Scope

    return remove ? impact : -impact
  }

  _propogateImpacted(child, parentkey, remove = false) {
    var parententry = this.getEntry(parentkey)

    // root is never hidden, don't worry
    while (parententry.Hidden) {
      parententry.changeImpactedBy(this._impactValue(child, remove))
      child = parententry
      parententry = this.getEntry(parententry.getParent(0))
    }

    // impacted affects only one visible parent
    parententry.changeImpactedBy(this._impactValue(child, remove))
  }

  _propogateMoveToDescoped(child, parentkey, remove = false) {
    // since this is a change
    const descopeValue = child.Scope
    var parententry = this.getEntry(parentkey)

      // root is never hidden, don't worry
      while (parententry.Hidden) {
      entry.changeDescopedBy(descopeValue)
      child = parententry
      parententry = this.getEntry(parententry.Parents(0))
    }

    // impacted affects only one visible parent
    parententry.changeImpactedBy(this._impactValue(child, remove))
  }


  _propogateDescoped(child, parentkey, remove = false) {
    var parententry = this.getEntry(parentkey)

    // root is never hidden, don't worry
    while (parententry.Hidden) {
      entry.changeImpactedBy(this._impactValue(child, remove))
      child = parententry
      parententry = this.getEntry(parententry.Parents(0))
    }

    // impacted affects only one visible parent
    parententry.changeImpactedBy(this._impactValue(child, remove))
  }


  _propogateDescope(currentParentKey, intersectionKey, scopetoadjust) {
    // we know currentParentKey cannot be root
    // because root is ancestor of all nodes
    const unionKey = currentParentKey.unionKey(intersectionKey)

    var curKey = currentParentKey;

    while (!curKey.isAncestorOrEqualOf(unionKey)) {
      const entry = this.getEntry(curKey)
      entry.addChildValue(scopetoadjust, true)
      // tbd - why only parent(0)
      curKey = entry.getParent(0)
    }

    // union guy gets some impacted back, as child's scope is reduced
    this.getEntry(curKey).removeChildValue(scopetoadjust, false)
  }

  remove(key) {
    if (key.toString() === this.Root.toString()) {
      console.log("Cannot delete root")
      return
    }

    var removeentry = this.getEntry(key)

    if (removeentry.Parents.length > 1) {
      // this is an intersection node - cannot be deleted
      this.unhide(removeentry)
      return
    }

    // Now just one parent
    // Such a node can always be deleted

    for (const [keystr, value] of this.Entries) {
      if (removeentry.isAncestorOf(value)) {
        this._removeParentIfExists(value, removeentry)        
      }
    }
  }

  _removeParentIfExists(child, removeentry) {
    const noOfExistingParents = child.Parents.length
    const parentOfRemoved = removeentry.getParent(0)
    const updateParent = true

    for (var i = 0; i < noOfExistingParents; i++) {
      const parentKey = child.getParent(i)
      const isDescoped = i !== 0
      if (parentKey.isEqual(removeentry.Key)) {
        if (updateParent) {
          child.setParent(i, parentOfRemoved)
          parentOfRemoved.addChildValue(child.Scope, isDescoped)
        }

        child.removeParentAt(i)
        if (child.Hidden && child.Parents.length < 1) {
          this.remove(child)
        }
        return
      }
      else if (parentOfRemoved.isAncestorOf(parentKey)) {
        updateParent = false
      }
    }
  }

  unhide(newkey) {
    const entry = this.getEntry(newkey)

    if (entry.Hidden) {
      entry.unhide()
      this.getEntry(entry.getParent(0)).addChildValue(entry.Impacted, false) 
    }
  }

  hide(newkey) {
    const entry = this.getEntry(newkey)

    if (!entry.Hidden) {
      entry.hide()
      this.getEntry(entry.getParent(0)).addChildValue(entry.Impacted, false)            
    }
  }



  /*
  For a new entry find all immediate children existing in the ruleset

  Also assign the one possible parent for a new node from the list of existing nodes

  In general a node can have more than one immediate parent, if they are intersecting, 
  and the node is an intersection node.

  However a *new* node can have at most one parent, because if it had two,
  then they would have to be intersecting (by definition), which would mean the node
  already exists in the ruleset, since intersection nodes are inserted before the
  second intersecting node is added.
  */

  _setParentGetChildren(newentry) {

    const descendentEntries = new Map()

    /*
      TBD - We can maintain a nodes by product hierarchy to cut down the search space
    */

    for (const [keystr, value] of this.Entries) {
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
        const unionKey = newentry.Key.unionKey(value.Key)
        if (!this.keyExists(intersectionKey)) {
          // relies on Map property that entries are always added at the end
          // so items will end up in descendentEntries
          const intersectionEntry = this.addNew(intersectionKey, true)
        }
      }
    }

    return RuleSet._lub(descendentEntries)
  }

  VerifyEntry(key, products, locations, items) {
    const name = (key) => {
      const pn = products.getNodeByHierarchyId(key.pid).Name
      const ln = locations.getNodeByHierarchyId(key.lid).Name   
      return `${pn}\\${ln}`   
    }

    const log = (type, entry) => {
      console.log(`${type}\t${entry.OriginalScope}\t${entry.Scope}\t${entry.Impacted}\t${entry.Hidden}\t${name(entry.Key)}`)
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
    var totalHiddenImpacted = 0

    for (const [ckeystr, cvalue] of children) {
      if (cvalue.getParent(0).isEqual(key)) {
        if (cvalue.Hidden) {
          log(" HImpact", cvalue)        
          totalHiddenImpacted += (cvalue.Scope - cvalue.Impacted)
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

    const expectedScope = entry.OriginalScope - totalDescoped
    const expectedImpacted =  expectedScope - totalImpacted - totalHiddenImpacted

    if (expectedScope !== entry.Scope) {
      console.log(`***Failed expected Scope : ${expectedScope}`)
    }

    if (expectedImpacted !== entry.Impacted) {
      console.log(`***Failed expected Impact : ${expectedImpacted}`)
    }

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
