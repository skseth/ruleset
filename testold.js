const Hierarchy = require("./hierarchy").Hierarchy
const RuleKey = require("./rulekey").RuleKey
const RuleSet = require("./ruleset").RuleSet
const ScopeDB = require("./scopedb").ScopeDB


const products = Hierarchy.createHierarchy(
    ["All Products", [
      ["Jeans", [
        ["Faded Jeans", [
          ["Torn Jeans"]
        ]],
        ["Classic Jeans"]
      ]]
    ]]
)

const locations = Hierarchy.createHierarchy(
    ["All Locations", [
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
    ["All Item Types", [
      ["KVI"],
      ["General"]
    ]]
)

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
  console.log(`O.Scope\tImp.\tScope\tHidden\tName`)

  impactedTotal = 0
  hiddenImpactedTotal = 0

  for (var [k, v] of ruleset.Entries) {
    if (v.Hidden) {
      hiddenImpactedTotal += v.Impacted
    }
    else {
      impactedTotal += v.Impacted
    }
    const pn = products.getNodeByHierarchyId(v.Key.pid).Name
    const ln = locations.getNodeByHierarchyId(v.Key.lid).Name
    console.log(`${v.OriginalScope}\t${v.Impacted}\t${v.Scope}\t${v.Hidden}\t${pn}\\${ln}`);
  }

  console.log(`Impacted Total : ${impactedTotal}`)
  console.log(`Hidden Impacted Total : ${hiddenImpactedTotal}`)
}

const scopedb = new ScopeDB()
generateData()
const ruleset = new RuleSet(scopedb)

const rootkey = new RuleKey("1", "1", "1")
const FJeansKarKey = new RuleKey(products.byName("Faded Jeans"), 
                              locations.byName("Karnataka"),
                              "1")
const JeansBlrKey = new RuleKey(products.byName("Jeans"), 
                              locations.byName("Bangalore"),
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
  const name = (key) => {
    const pn = products.getNodeByHierarchyId(key.pid).Name
    const ln = locations.getNodeByHierarchyId(key.lid).Name   
    return `${pn}\\${ln}`   
  }

  console.log(`----------${name(key)}---------`)
  ruleset.addNew(key)
  for (const [keystr, value] of ruleset.Entries) {
    ruleset.VerifyEntry(value.Key, products, locations, itemtypes)  
  }
  console.log(`----------END ${name(key)}---------\n\n`)
}

addToRuleset(JeansBlrKey)
addToRuleset(FJeansKarKey)
addToRuleset(FJeansBlrKey) // common to JeansBlr and FJeansKar
//ruleset.addNew(FJeansKorKey)
addToRuleset(TJeansKorKey)
addToRuleset(TJeansKarKey)
addToRuleset(TJeansIndKey)

printRuleSet(ruleset)



