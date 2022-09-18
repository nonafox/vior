export default class Dep {
    static createDepContext(_this, func, favourTag = null, key = null) {
        let doit = () => {
            Dep.currentContext = doit
            Dep.currentContextKey = key
            Dep.currentContextFavourTag = favourTag
            func.call(_this)
            Dep.currentContext = null
            Dep.currentContextKey = null
            Dep.currentContextFavourTag = null
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
            newVal = { tags: oriVal ? (oriVal.tags || {}) : {}, key: null, favour: null }
        newVal.tags[tag] = true
        newVal.key = Dep.currentContextKey
        newVal.favourTag = Dep.currentContextFavourTag
        this.deps.set(Dep.currentContext, newVal)
        
        let searchRes = this.searchDepByKey(Dep.currentContextKey)
        if (searchRes) {
            this.deps.delete(searchRes)
        }
    }
    notify(tag) {
        let visInstance = this.visInstance
        for (let vv of this.deps.entries()) {
            let k = vv[0], v = vv[1]
            if (v.tags[tag] && (v.favourTag ? v.favourTag == tag : true) && typeof k == 'function')
                k.call(visInstance)
        }
    }
}