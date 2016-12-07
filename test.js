const Hierarchy = require("./hierarchy").Hierarchy
const RuleKey = require("./rulekey").RuleKey
const RuleSet = require("./ruleset").RuleSet
const RuleSetEntry = require("./rulesetentry").RuleSetEntry
const ScopeDB = require("./scopedb").ScopeDB


const products = Hierarchy.createHierarchy(
    ["All", [
      ["Jeans", [
        ["Faded Jeans", [
          ["Torn Jeans"]
        ]],
        ["Classic Jeans"]
      ]]
    ]]
)

const locations = Hierarchy.createHierarchy(
    ["All", [
      ["India", [
        ["Karnataka",[
          ["Bangalore", [
            ["Koramangala"],
            ["Indiranagar"]
          ]],
          ["Mysore"]
        ]]
      ]]
    ]]
)


const itemtypes = Hierarchy.createHierarchy(
    ["All", [
      ["KVI"],
      ["General"]
    ]]
)

const name = (key) => {
  const nvl_name = (node, nvl) => {
    return node ? node.Name : nvl
  }

  const pn = nvl_name(products.getNodeByHierarchyId(key.pid), key.pid)
  const ln = nvl_name(locations.getNodeByHierarchyId(key.lid), key.lid)
  const tn = nvl_name(itemtypes.getNodeByHierarchyId(key.tid), key.tid)
  return `${pn}\\${ln}\\${tn}`   
}


function printData() {
  products.print()
  locations.print()
  itemtypes.print()
  scopedb.print()
  ruleset.print()
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateData() {

  for (const p of products.Leafs) {
    for (const l of locations.Leafs) {
      for (const t of itemtypes.Leafs) {
        scopedb.add(new RuleKey(p,l,t), getRandomInt(0,200) )
      }
    }
  }
}

function printRuleSet(ruleset) {
  console.log(`O.Scope\tImp.\tHImp.\tScope\tHidden\tName`)

  var impactedTotal = 0
  var hiddenImpactedTotal = 0

  for (var [k, v] of ruleset.Entries) {
    impactedTotal += v.Impacted
    if (!v.Hidden) {
      hiddenImpactedTotal += v.Impacted + v.HiddenImpacted
    }
    const pn = products.getNodeByHierarchyId(v.Key.pid).Name
    const ln = locations.getNodeByHierarchyId(v.Key.lid).Name
    console.log(`${v.OriginalScope}\t${v.Impacted}\t${v.HiddenImpacted}\t${v.Scope}\t${v.Hidden}\t${pn}\\${ln}`);
  }

  console.log(`Impacted Total : ${impactedTotal}`)
  console.log(`Hidden Impacted Total : ${hiddenImpactedTotal}`)
}

const scopedb = new ScopeDB()
generateData()
const ruleset = new RuleSet(scopedb, name)

const rootkey = new RuleKey("1", "1", "1")
const FJeansKarKey = new RuleKey(products.byName("Faded Jeans"), 
                              locations.byName("Karnataka"),
                              "1")
const JeansBlrKey = new RuleKey(products.byName("Jeans"), 
                              locations.byName("Bangalore"),
                              "1")
const JeansKarKey = new RuleKey(products.byName("Jeans"), 
                              locations.byName("Karnataka"),
                              "1")

const JeansKorKey = new RuleKey(products.byName("Jeans"), 
                              locations.byName("Koramangala"),
                              "1")

const FJeansBlrKey = new RuleKey(products.byName("Faded Jeans"), 
                              locations.byName("Bangalore"),
                              "1")

const FJeansKorKey = new RuleKey(products.byName("Faded Jeans"), 
                              locations.byName("Koramangala"),
                              "1")


const TJeansKorKey = new RuleKey(products.byName("Torn Jeans"), 
                              locations.byName("Koramangala"),
                              "1")

const TJeansIndKey = new RuleKey(products.byName("Torn Jeans"), 
                              locations.byName("Indiranagar"),
                              "1")

const TJeansKarKey = new RuleKey(products.byName("Torn Jeans"), 
                              locations.byName("Karnataka"),
                              "1")

function addToRuleset(key) {

  console.log(`----------${name(key)}---------`)
  ruleset.add(key)

  for (const entry of ruleset.Entries.values()) {
    ruleset.VerifyEntry(entry.Key)    
  }
  console.log(`----------END ${name(key)}---------\n\n`)
}


function removeFromRuleset(key) {

  console.log(`xxxxxxxxxx REMOVE ${name(key)}xxxxxxxxxx`)
  ruleset.remove(key)

  for (const entry of ruleset.Entries.values()) {
    ruleset.VerifyEntry(entry.Key)    
  }
  console.log(`xxxxxxxxxx END ${name(key)}xxxxxxxxxx`)
}

console.log(name(FJeansKarKey.unionKey(JeansKarKey)))


RuleSetEntry.setNameFunc(name)

addToRuleset(JeansBlrKey)
//addToRuleset(FJeansBlrKey)
//addToRuleset(JeansKarKey)
addToRuleset(FJeansKarKey)

printRuleSet(ruleset)

removeFromRuleset(FJeansKarKey)

removeFromRuleset(JeansBlrKey)

printRuleSet(ruleset)






