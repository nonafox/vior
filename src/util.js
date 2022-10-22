export default {
    selfClosingTags: ['br', 'hr', 'area', 'base', 'img', 'input', 'link', 'meta', 'basefont',
                      'param', 'col', 'frame', 'embed', 'keygen', 'source', '!doctype'],
    inputTags: ['input', 'textarea', 'select'],
    voidTags: ['template', 'slot-receiver'],
    textOnlyTags: ['script', 'style'],
    
    randomText(len = 6) {
        let sets = 'abcdefghijklmnopqrstuvwxyz0123456789',
            res = ''
        for (let k = 0; k < len; k ++) {
            let c = sets[Math.floor(Math.random() * (sets.length - 1))]
            res += c
        }
        return res
    },
    triggerError(desc, name, code, ex) {
        console.group('[Vior error]:')
        console.group('Type:')
        console.log(desc || '[unknown]')
        console.groupEnd()
        console.group('Position:')
        console.log(name || '[unknown]')
        console.groupEnd()
        console.group('Code:')
        console.log(code || '[unknown]')
        console.groupEnd()
        console.group('Error:')
        console.log(ex || '[unknown]')
        console.groupEnd()
        console.groupEnd()
        throw new Error('[Vior error]')
    },
    isPlainObject(obj) {
        if (! obj)
            return
        if (Array.isArray(obj))
            return true
        if (obj.toString() == '[object Object]') {
            return Object.getPrototypeOf(obj).constructor.toString()
                == Object.getPrototypeOf({}).constructor.toString()
        } else {
            return false
        }
    },
    deepCopy(...arrs) {
        let res = Array.isArray(arrs[0]) ? [] : {},
            merges = []
        for (let _k = 0; _k < arrs.length; _k ++) {
            let arr = arrs[_k],
                _res = Array.isArray(arr) ? [] : {},
                keys = Object.keys(arr)
            for (let kk = 0; kk < keys.length; kk ++) {
                let k = keys[kk],
                    v = arr[k]
                
                if (this.isPlainObject(v))
                    _res[k] = this.deepCopy(v)
                else
                    _res[k] = v
            }
            merges.push(_res)
        }
        for (let k = 0; k < merges.length; k ++) {
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
            let res = true
            let keys = Object.keys(a1)
            for (let kk = 0; kk < keys.length; kk ++) {
                let k = keys[kk]
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
            }
            return res && this.realLength(a1) === this.realLength(a2)
        } else {
            return false
        }
    },
    deepIndexof(arr, item) {
        let keys = Object.keys(arr)
        for (let kk = 0; kk < keys.length; kk ++) {
            let k = keys[kk],
                v = arr[k]
            if (this.deepCompare(v, item))
                return k
        }
        return undefined
    },
    realLength(arr) {
        return Object.keys(arr).length
    },
    firstCharUpper(text) {
        return text.substr(0, 1).toUpperCase() + text.substr(1)
    },
    firstCharLower(text) {
        return text.substr(0, 1).toLowerCase() + text.substr(1)
    },
    camel2KebabCase(text) {
        let tmp = this.firstCharLower(text).replace(/([A-Z]{1})/g, '-$1').split('-')
        let keys = Object.keys(tmp)
        for (let kk = 0; kk < keys.length; kk ++) {
            let k = keys[kk]
            tmp[k] = tmp[k].toLowerCase()
        }
        return tmp.join('-')
    },
    kebab2CamelCase(text) {
        let tmp = text.split('-'), res = ''
        let keys = Object.keys(tmp)
        for (let kk = 0; kk < keys.length; kk ++) {
            let k = keys[kk],
                v = tmp[k]
            res += this.firstCharUpper(v)
        }
        return res
    },
    isScriptQuote(text, k) {
        return (text[k] == `'` || text[k] == `"` || text[k] == '`') && text[k - 1] != '\\'
    },
    scriptReplace(_script, regexp, replace) {
        let script = _script.split(''), quoteStarter = null, addup = ''
        
        let reps = [], repsid = -1
        for (let k in script) {
            k = parseInt(k)
            let v = script[k]
            if (! quoteStarter) {
                if (! this.isScriptQuote(script, k)) {
                    addup += v
                } else {
                    quoteStarter = v
                    repsid += 1
                    reps[repsid] = ''
                    addup += quoteStarter + '[[[#{{{' + repsid + '}}}#]]]'
                }
            } else {
                if (this.isScriptQuote(script, k) && v == quoteStarter) {
                    addup += v
                    quoteStarter = null
                } else {
                    reps[repsid] += v
                }
            }
        }
        
        addup = addup.replace(regexp, replace)
        for (let k in reps) {
            let v = reps
            addup = addup.replace('[[[#{{{' + k + '}}}#]]]', v)
        }
        
        return addup
    }
}