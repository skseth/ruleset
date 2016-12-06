
const INFINITY = 100*100*100+1

class RuleKey {
  constructor(pid, lid, tid) {
    this._pid = pid
    this._pidl = RuleKey._level(pid)
    this._lid = lid
    this._lidl = RuleKey._level(lid)
    this._tid = tid
    this._tidLevel = RuleKey._level(tid)
  }

  get pid() { return this._pid }
  get pidLevel() { return this._pidl }
  get lid() { return this._lid }
  get lidLevel() { return this._lidl }
  get tid() { return this._tid }
  get tidLevel() { return this._tidLevel }
  get INFINITY() { return INFINITY }

  // convention : distance from root = +ve
  // meaningless if not related
  distanceFromRelated(related) {
    return 100*100*(related.pidLevel - this.pidLevel) +
           100*(related.lidLevel - this.lidLevel) +
           related.tidLevel - this.tidLevel
  }

  isRelatedTo(other) {
    return (this.isAncestorOrEqualOf(other) || other.isAncestorOf(this))
  }

  distance(other) {
    if (this.isRelatedTo(other)) {
      return this.distanceFromRelated(other)
    }
    else {
      return RuleKey.INFINITY
    }
  }

  hasEqualLevelsTo(other) {
    return other.pidLevel === this.pidLevel && 
            other.lidLevel === this.lidLevel &&
            other.tidLevel === this.tidLevel
  }

  hasAncestorOrEqualLevelsTo(other) {
    return other.pidLevel >= this.pidLevel && 
            other.lidLevel >= this.lidLevel &&
            other.tidLevel >= this.tidLevel
  }

  isEqual(other) {
    return (this.hasEqualLevelsTo(other) &&
            other.pid === this.pid &&
            other.lid === this.lid &&
            other.tid === this.tid)
  }

  isAncestorOrEqualOf(other) {
    return (other.pidLevel >= this.pidLevel && 
            other.lidLevel >= this.lidLevel &&
            other.tidLevel >= this.tidLevel &&
            other.pid.startsWith(this.pid) &&
            other.lid.startsWith(this.lid) &&
            other.tid.startsWith(this.tid))
  }

  isAncestorOf(other) {
    return this.isAncestorOrEqualOf(other) && !this.hasEqualLevelsTo(other)
  }

  // 
  isMoreDistantIntersectionParent(other) {
    return RuleKey.compare(this, other, RuleKey._isMoreDistantIntersectionParent)    
  }

  isIntersecting(other) {
    function oneIsPrefixOfOther(str1, str2) {
      var len = (str1.length < str2.length) ? str1.length : str2.length
      for (var i = len - 1; (i >= 0) && (str1[i] === str2[i]); --i)
          continue;
      return i < 0;
    }

    return   !this.hasAncestorOrEqualLevelsTo(other) &&
             !other.hasAncestorOrEqualLevelsTo(this) &&
             oneIsPrefixOfOther(this.pid,other.pid) &&
             oneIsPrefixOfOther(this.lid,other.lid) &&   
             oneIsPrefixOfOther(this.tid,other.tid) 
  }

  // other cross-related
  intersectionKey(other_cr) {
    const pid = this.pidLevel <= other_cr.pidLevel ? other_cr.pid : this.pid
    const lid = this.lidLevel <= other_cr.lidLevel ? other_cr.lid : this.lid
    const tid = this.tidLevel <= other_cr.tidLevel ? other_cr.tid : this.tid

    return new RuleKey(pid, lid, tid)
  }

  // other cross-related
  unionKey(other_cr) {
    const pid = this.pidLevel >= other_cr.pidLevel ? other_cr.pid : this.pid
    const lid = this.lidLevel >= other_cr.lidLevel ? other_cr.lid : this.lid
    const tid = this.tidLevel >= other_cr.tidLevel ? other_cr.tid : this.tid

    return new RuleKey(pid, lid, tid)
  }

  static _level(hid) {
    for (var count = 0, index = 0; index != -1; count++, index = hid.indexOf(".", index + 1));
    return count;
  }

  toString() {
    return `${this.pid}|${this.lid}|${this.tid}`
  }
}

module.exports.RuleKey = RuleKey