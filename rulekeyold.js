
const INFINITY = 100*100*100+1

class RuleKey {
  constructor(pid, lid, tid) {
    this._pid = pid
    this._pidl = RuleKey._level(pid)
    this._lid = lid
    this._lidl = RuleKey._level(lid)
    this._tid = tid
    this._tidl = RuleKey._level(tid)
  }

  get pid() { return this._pid }
  get pidLevel() { return this._pidl }
  get lid() { return this._lid }
  get lidLevel() { return this._lidl }
  get tid() { return this._tid }
  get tidLevel() { return this._tidl }
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
      return distanceFromRelated(other)
    }
    else {
      return RuleKey.INFINITY
    }
  }

  isEqual(other) {
    return (other.pidl === this.pidl && 
            other.lidl === this.lidl &&
            other.tidl === this.tidl &&
            other.pid === this.pid &&
            other.lid === this.lid &&
            other.tid === this.tid)
  }

  isAncestorOrEqualOf(other) {
    return (other.pidl >= this.pidl && 
            other.lidl >= this.lidl &&
            other.tidl >= this.tidl &&
            other.pid.startsWith(this.pid) &&
            other.lid.startsWith(this.lid) &&
            other.tid.startsWith(this.tid))
  }

  isAncestorOf(other) {
    return this.isAncestorOrEqualOf(other) && (this.distance(other) !== 0)
  }

  // 
  isMoreDistantIntersectionParent(other) {
    return RuleKey.compare(this, other, RuleKey._isMoreDistantIntersectionParent)    
  }

  isIntersecting(other) {
    function oneIsPrefixOfOther(str1, str2) {
      var len = (str1.length < str2.length) ? str1.length : str2.length
      for (var i = len - 1; (i >= 0) && (str[i] === prefix[i]); --i)
          continue;
      return i < 0;
    }

    return  (other.pidl !== this.pidl  ||
             other.lidl !== this.lidl  ||
             other.tidl !== this.tidl) &&
             oneIsPrefixOfOther(this.pid,other.pid) &&
             oneIsPrefixOfOther(this.lid,other.lid) &&   
             oneIsPrefixOfOther(this.tid,other.tid) 
  }

  // other cross-related
  intersectionKey(other_cr) {
    const pid = this.pidl <= other.pidl ? this.pid : other_cr.pid
    const lid = this.lidl <= other.lidl ? this.lid : other_cr.lid
    const tid = this.tidl <= other.tidl ? this.tid : other_cr.tid    

    return new RuleKey(pid, lid, tid)
  }

  // other cross-related
  unionKey(other_cr) {
    const pid = this.pid.startsWith(other_cr.pid) ? other_cr.pid : this.pid
    const lid = this.lid.startsWith(other_cr.lid) ? other_cr.lid : this.lid
    const tid = this.tid.startsWith(other_cr.tid) ? other_cr.tid : this.tid

    return new RuleKey(pid, lid, tid)
  }

  static _isEqual(comparep, comparel, comparet) {
    return (comparep + comparel + comparet) === 0
  }

  static _areUnrelated(comparep, comparel, comparet) {
    return isNaN(comparep + comparel + comparet)
  }

  static _isDescendent(comparep, comparel, comparet) {
    return !RuleKey._isEqual(comparep, comparel, comparet)
    && (comparep >= 0 && comparel >= 0 && comparet >= 0)
  }

  static _isAncestor(comparep, comparel, comparet) {
    return !RuleKey._isEqual(comparep, comparel, comparet)
    && (comparep <= 0 && comparel <= 0 && comparet <= 0)
  }

  static _isAncestorOrEqual(comparep, comparel, comparet) {
    return RuleKey._isEqual(comparep, comparel, comparet)
    || (comparep <= 0 && comparel <= 0 && comparet <= 0)
  }

  static _isMoreDistantIntersectionParent(comparep, comparel, comparet) {
    if (comparep != 0) {
      return comparep < 0
    }
    else if (comparel != 0) {
      return comparel < 0
    }
    else if (comparet != 0) {
      return comparet < 0
    }
    else {
      console.log('something wrong in _isMoreDistantIntersectionParent')
    }
  }

  static _isIntersecting(comparep, comparel, comparet) {
    return !RuleKey._areUnrelated(comparep, comparel, comparet) &&
           !RuleKey._isDescendent(comparep, comparel, comparet) && 
           !RuleKey._isAncestor(comparep, comparel, comparet)
  }

  static compare(keyc, keyp, comparefunc) {

    const comparep = RuleKey.compareHid(keyc.pid, keyp.pid)
    const comparel = RuleKey.compareHid(keyc.lid, keyp.lid)
    const comparet = RuleKey.compareHid(keyc.tid, keyp.tid)

    return comparefunc(comparep, comparel, comparet)
  }

  static compareHid(hidc, hidp) {
    if (hidc.startsWith(hidp)) {
      if (hidc.length == hidp.length) {
        return 0
      }
      else {
        return 1
      }
    }
    else if (hidp.startsWith(hidc)) {
      return -1
    }
    else {
      return NaN
    }
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