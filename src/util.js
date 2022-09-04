export default {
    triggerError(desc, name, code, ex) {
        console.group('[Vis error]:')
        console.group('Describe: ')
        console.log(desc)
        console.groupEnd()
        console.group('Position: ')
        console.log(name)
        console.groupEnd()
        console.group('Code: ')
        console.log(code)
        console.groupEnd()
        console.group('Error: ')
        console.log(ex)
        console.groupEnd()
        console.groupEnd()
        throw new Error('[Vis error]')
    },
    isPlainObject(obj) {
        // refer to: https://segmentfault.com/a/1190000013338935
        
        if (! obj)
            return
        if (Array.isArray(obj))
            return true
        if (obj.toString() == '[object Object]') {
            let hasOwn = Object.prototype.hasOwnProperty
            
            let proto = Object.getPrototypeOf(obj)
            if (! proto)
                return false
            let ctor = hasOwn.call(proto, 'constructor') && proto.constructor
            return typeof ctor == 'function' && hasOwn.toString.call(ctor) == hasOwn.toString.call(Object)
        } else {
            return false
        }
    },
    deepCopy(arr) {
        let res = Array.isArray(arr) ? [] : {}
        for (let k in arr) {
            let v = arr[k]
            if (this.isPlainObject(v))
                res[k] = this.deepCopy(v)
            else
                res[k] = v
        }
        return res
    },
    deepCompare(a1, a2) {
        if (a1 === a2)
            return true
        if (this.isPlainObject(a1) && this.isPlainObject(a2)) {
            if (Array.isArray(a1) && Array.isArray(a2) && a1.length != a2.length)
                return false
            let i1 = 0, i2 = 0, res = true
            for (let k in a1) {
                res = res && (() => {
                    let v1 = a1[k],
                        v2 = a2[k]
                    if (this.isPlainObject(v1) && this.isPlainObject(v2))
                        if (! this.deepCompare(v1, v2))
                            return false
                    else if (v1 !== v2)
                        return false
                })()
                i1 ++
            }
            for (let k in a2) {
                i2 ++
            }
            return res && i1 == i2
        } else {
            return false
        }
    }
}