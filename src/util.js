export default {
    singleTags: ['br', 'hr', 'area', 'base', 'img', 'input', 'link', 'meta', 'basefont',
                 'param', 'col', 'frame', 'embed', 'keygen', 'source'],
    
    triggerError(desc, name, code, ex) {
        console.group('[Vior error]:')
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
        throw new Error('[Vior error]')
    },
    isPlainObject(obj) {
        // From: https://segmentfault.com/a/1190000013338935
        
        if (! obj)
            return
        if (Array.isArray(obj))
            return true
        if (obj.toString() == '[object Object]') {
            let hasOwn = Object.prototype.hasOwnProperty
            
            let proto = Object.getPrototypeOf(obj)
            if (! proto)
                return false
            let ctor = hasOwn.call(proto, 'constructor') && proto.constructor,
                cond = hasOwn.toString.call(ctor) == hasOwn.toString.call(Object)
            return typeof ctor == 'function' && cond
        } else {
            return false
        }
    },
    deepCopy(...arrs) {
        let res = Array.isArray(arrs[0]) ? [] : {},
            merges = []
        for (let _k in arrs) {
            let arr = arrs[_k],
                _res = Array.isArray(arr) ? [] : {}
            for (let k in arr) {
                let v = arr[k]
                
                if (this.isPlainObject(v))
                    _res[k] = this.deepCopy(v)
                else
                    _res[k] = v
            }
            merges.push(_res)
        }
        for (let k in merges) {
            let v = merges[k]
            for (let k2 in v) {
                let v2 = v[k2]
                res[k2] = v2
            }
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
                    if (this.isPlainObject(v1) && this.isPlainObject(v2)) {
                        if (! this.deepCompare(v1, v2))
                            return false
                    } else if (v1 !== v2) {
                        return false
                    }
                    return true
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
    },
    realLength(arr) {
        if (Array.isArray(arr))
            return arr.length
        let i = 0
        for (let k in arr) {
            i ++
        }
        return i
    }
}