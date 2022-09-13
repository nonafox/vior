export default class Dep {
    static createDepContext(_this, func, key = '') {
        let doit = () => {
            Dep.currentContext = doit
            Dep.currentContextKey = key
            func.call(_this)
            Dep.currentContext = null
            Dep.currentContextKey = null
        }
        doit()
    }
    
    constructor(_this) {
        this.visInstance = _this
        this.deps = new Map()
        this.depKeys = []
    }
    searchDepByKey(key) {
        if (! key)
            return null
        
        for (let vv of this.deps.entries()) {
            let k = vv[0], v = vv[1]
            if (v.key == key)
                return k
        }
        return null
    }
    add(tag) {
        if (! Dep.currentContext)
            return
        
        let oriVal = this.deps.get(Dep.currentContext),
            newVal = { tags: oriVal ? (oriVal.tags || {}) : {}, key: null }
        newVal.tags[tag] = true
        newVal.key = Dep.currentContextKey
        this.deps.set(Dep.currentContext, newVal)
        
        let searchRes = this.searchDepByKey(Dep.currentContextKey)
        if (searchRes) {
            this.deps.delete(searchRes)
        }
    }
    notify(tag) {
        let visInstance = this.visInstance
        this.deps.forEach((v, k) => {
            if (v.tags[tag] && typeof k == 'function')
                k.call(visInstance)
        })
    }
}