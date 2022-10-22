import Util from './util.js'
import Dep from './dep.js'

export default class Ref {
    static createRef(_this, _obj, _deps = null, depTag = null) {
        let obj = _obj && Util.isPlainObject(_obj) ? Util.deepCopy(_obj) : _obj,
            nobj = Array.isArray(obj) ? [] : {},
            deps = _deps || new Dep(_this)
        
        if (Util.isPlainObject(obj)) {
            for (let k in obj) {
                let v = obj[k]
                if (Util.isPlainObject(v))
                    nobj[k] = Ref.createRef(_this, v, deps, depTag || k)
                else
                    nobj[k] = v
            }
        } else {
            return obj
        }
        
        return new Proxy({
            __isViorRef: true,
            __isArray: Array.isArray(obj),
            __viorInstance: _this,
            __rawValue: obj,
            __realValue: nobj,
            __deps: deps,
            __depTag: depTag,
            __traffic: null
        }, {
            get(target, key) {
                if (key == '__getRaw')
                    return (k = '__rawValue') => target[k]
                if (key == '__setRaw') {
                    return (k, v) => {
                        target.__rawValue[k] = v
                        target.__realValue[k] = Ref.createRef(_this, v, target.__deps, target.__depTag)
                    }
                }
                if (key == '__setTraffic') {
                    return (val) => {
                        target.__traffic = val
                    }
                }
                if (key == '__notify') {
                    return () => {
                        target.__deps.notify(target.__depTag)
                    }
                }
                
                target.__deps.add(target.__depTag || key)
                return target.__realValue[key]
            },
            getOwnPropertyDescriptor(target, key) {
                return {
                    enumerable: true,
                    configurable: true
                }
            },
            ownKeys(target) {
                return Object.keys(target.__rawValue)
            },
            has(target, key) {
                return key in target.__rawValue
            },
            set(target, key, value) {
                let changed = value !== target.__rawValue[key]
                if (changed) {
                    target.__rawValue[key] = value
                    target.__realValue[key] = Ref.createRef(_this, value, deps, depTag)
                    if (! target.__traffic)
                        target.__deps.notify(target.__depTag || key)
                }
                return true
            },
            deleteProperty(target, key) {
                delete target.__rawValue[key], target.__realValue[key]
                if (! target.__traffic)
                    target.__deps.notify(target.__depTag || key)
                return true
            }
        })
    }
    static isRef(obj) {
        return obj && typeof obj.__getRaw == 'function' && obj.__getRaw('__isViorRef')
    }
    static isArrayRef(obj) {
        return this.isRef(obj) && obj.__getRaw('__isArray')
    }
}

Array.prototype.push = function (...items) {
    if (Ref.isRef(this))
        this.__setTraffic('push')
    
    for (let i = 0; i < items.length; i ++) {
        this[this.length] = items[i]
    }
    
    if (Ref.isRef(this)) {
        this.__setTraffic(null)
        this.__notify()
    }
    return items.length
}
Array.prototype.unshift = function (...items) {
    if (Ref.isRef(this))
        this.__setTraffic('unshift')
    
    for (let k = this.length + items.length - 1; k >= 0; k --) {
        if (k >= items.length)
            this[k] = this[k - items.length]
        else
            this[k] = items[k]
    }
    
    if (Ref.isRef(this)) {
        this.__setTraffic(null)
        this.__notify()
    }
    return items.length
}
Array.prototype.reverse = function () {
    if (Ref.isRef(this))
        this.__setTraffic('reverse')
    
    for (let k = 0; k < Math.floor(this.length / 2); k ++) {
        let ek = this.length - 1 - k
        let a = this[k], b = this[ek]
        this[k] = b
        this[ek] = a
    }
    
    if (Ref.isRef(this)) {
        this.__setTraffic(null)
        this.__notify()
    }
    return this
}
Array.prototype.sort = function (func = (a, b) => {
    a = parseInt(('' + a).substr(0, 1))
    b = parseInt(('' + b).substr(0, 1))
    return a > b
}) {
    if (Ref.isRef(this))
        this.__setTraffic('sort')
    
    for (let k = 0; k < this.length; k ++) {
        for (let k2 = k + 1; k2 < this.length; k2 ++) {
            let a = this[k], b = this[k2]
            if (func(a, b)) {
                this[k] = b
                this[k2] = a
            }
        }
    }
    
    if (Ref.isRef(this)) {
        this.__setTraffic(null)
        this.__notify()
    }
    return this
}
Array.prototype.splice = function (sk = 0, count = 1, ...items) {
    if (Ref.isRef(this))
        this.__setTraffic('splice')
    
    if (sk < 0)
        sk = this.length + sk
    if (count < 0)
        count = 0
    
    let bin = [], diff = items.length - count,
        length = this.length + diff
    let doit = (k, order) => {
        if (k >= sk && k < sk + count) {
            if (order == 1)
                bin.push(this[k])
            else
                bin.unshift(this[k])
        }
        
        if (k - sk <= items.length - 1)
            this[k] = items[k - sk]
        else
            this[k] = this[k - diff]
    }
    if (diff >= 0) {
        for (let k = length - 1; k >= sk; k --)
            doit(k, 2)
    } else {
        for (let k = sk; k < length; k ++)
            doit(k, 1)
    }
    if (length < this.length) {
        for (let k = length; k < this.length; k ++)
            bin.push(this[k])
        this.length = length
    }
    
    if (Ref.isRef(this)) {
        this.__setTraffic(null)
        this.__notify()
    }
    return bin
}