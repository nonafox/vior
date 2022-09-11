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
                if (key == '__getKeys')
                    return () => Object.keys(target.__rawValue)
                
                target.__deps.add()
                return target.__realValue[key]
            },
            set(target, key, value) {
                if (target.__isArray && key == 'length') {
                    target.__rawValue.length = value
                    return true
                }
                
                let changed = value != target.__rawValue[key]
                target.__rawValue[key] = value
                target.__realValue[key] = Ref.createRef(_this, value)
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