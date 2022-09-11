import Dep from './dep.js'

export default class Ref {
    static createRef(_this, obj) {
        return new Proxy({
            __viorInstance: _this,
            __rawValue: obj,
            __deps: new Dep(_this)
        }, {
            get(target, key) {
                if (key == '__getRaw')
                    return () => target.__rawValue
                
                target.__deps.add()
                return target.__rawValue[key]
            },
            set(target, key, value) {
                let changed = value != target.__rawValue[key]
                target.__rawValue[key] = value
                if (changed)
                    target.__deps.notify()
                return true
            }
        })
    }
}