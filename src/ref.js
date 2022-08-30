import Dep from './dep.js'

export function ref(obj, insContext) {
    return new Proxy(obj, {
        __deps: new Dep(insContext),
        get (target, key) {
            this.__deps.add()
            return target[key]
        },
        set (target, key, val) {
            let changed = val != target[key]
            target[key] = val
            if (changed) {
                this.__deps.notify()
            }
            return true
        }
    })
}