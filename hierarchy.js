class HierarchyNode {
  constructor(level, hierarchyid, name) {
    this._level = level
    this._hierarchyid = hierarchyid
    this._name = name
  }

  get Level() { return this._level }
  get HierarchyId() { return this._hierarchyid }
  get Name() { return this._name }

  toString() {
    return `${this.Level},${this.HierarchyId},${this.Name}`
  }
}

class Hierarchy {
  constructor() {
    this.nodes = new Map()
  }

  getNodeByHierarchyId(hierarchyid) {
    return this.nodes.get(hierarchyid)
  }

  addNode(node) {
    this.nodes.set(node.HierarchyId, node)
  }

  addNodeValue(nodevalue, level, parentid, childno) {
    const dot = level == 0? "" : "."
    const hierarchyid = `${parentid}${dot}${childno}`
    const name = nodevalue[0]
    const children = nodevalue[1]

    this.addNode(new HierarchyNode(level, hierarchyid, name))

    if (children) {
      childno = 1
      for (const child of children) {
        this.addNodeValue(child, level + 1, hierarchyid, childno++)
      }
    }
  }

  get Leafs() {
    return Hierarchy.glb([...this.nodes.keys()])
  }

  byName(name) {
    for (var [key, value] of this.nodes) {
      if (value.Name === name) {
        return key
      }
    }    
  }

  print() {
    for (var [key, value] of this.nodes) {
      console.log(value.toString());
    }
  }

  static createHierarchy(nodevalue) {
    const hierarchy = new Hierarchy()
    hierarchy.addNodeValue(nodevalue, 0, "", 1)
    return hierarchy
  }

  static glb(hierarchyids) {
    const sortedids = hierarchyids
                        .sort()
    const glb_ids = [sortedids[sortedids.length - 1]]

    for (var i = sortedids.length - 2; i >= 0; i--) {
      if (!sortedids[i+1].startsWith(sortedids[i])) {
        glb_ids.push(sortedids[i])
      }
    }

    return glb_ids
  }
}

module.exports.Hierarchy = Hierarchy
