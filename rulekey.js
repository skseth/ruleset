
class RuleKey {
  constructor(pid, lid, tid) {
    this._pid = pid
    this._lid = lid
    this._tid = tid
  }

  get pid() { return this._pid }
  get lid() { return this._lid }
  get tid() { return this._tid }

  isAncestorOrEqualOf(other) {
    return RuleKey.compare(this, other, RuleKey._isAncestorOrEqual)
  }

  isAncestorOf(other) {
    return RuleKey.compare(this, other, RuleKey._isAncestor)
  }

  // 
  isMoreDistantIntersectionParent(other) {
    return RuleKey.compare(this, other, RuleKey._isMoreDistantIntersectionParent)    
  }

  isIntersecting(other) {
    return RuleKey.compare(this, other, RuleKey._isIntersecting)
  }

  // other cross-related
  intersectionKey(other_cr) {
    const pid = this.pid.startsWith(other_cr.pid) ? this.pid : other_cr.pid
    const lid = this.lid.startsWith(other_cr.lid) ? this.lid : other_cr.lid
    const tid = this.tid.startsWith(other_cr.tid) ? this.tid : other_cr.tid    

    return new RuleKey(pid, lid, tid)
  }

  // other cross-related
  unionKey(other_cr) {
    const pid = this.pid.startsWith(other_cr.pid) ? other_cr.pid : this.pid
    const lid = this.lid.startsWith(other_cr.lid) ? other_cr.lid : this.pid
    const tid = this.tid.startsWith(other_cr.tid) ? other_cr.tid : this.pid

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

  toString() {
    return `${this.pid}|${this.lid}|${this.tid}`
  }
}

module.exports.RuleKey = RuleKey