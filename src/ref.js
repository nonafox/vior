import Util from './util.js'
import Dep from './dep.js'

export default class Ref {
    static createRef(_this, _obj) {
        let obj = typeof _obj == 'object' ? Util.deepCopy(_obj) : _obj,
            nobj = Array.isArray(obj) ? [] : {}
        
        if (Util.isPlainObject(obj)) {
            for (let k in obj) {
                let v = obj[k]
                if (Util.isPlainObject(v))
                    nobj[k] = Ref.createRef(_this, v)
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
            __deps: new Dep(_this)
        }, {
            get(target, key) {
                if (key == '__getRaw')
                    return (k = '__rawValue') => target[k]
                
                target.__deps.add()
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
                let changed = value != target.__rawValue[key]
                target.__rawValue[key] = value
                target.__realValue[key] = Ref.createRef(_this, value)
                if (changed)
                    target.__deps.notify()
                return true
            },
            deleteProperty(target, key) {
                let changed = target.__rawValue[key]
                delete target.__rawValue[key], target.__realValue[key]
                if (changed)
                    target.__deps.notify()
                return true
            }
        })
    }
    static isRef(obj) {
        return typeof obj.__getRaw == 'function' && obj.__getRaw('__isViorRef')
    }
}