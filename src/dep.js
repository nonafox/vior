import Util from './util.js'

export default class Dep {
    static createDepContext(_this, func, favourTag = null) {
        let doit = () => {
            Dep.currentContext = doit
            Dep.currentContextFavourTag = favourTag
            func.call(_this)
            Dep.currentContext = null
            Dep.currentContextFavourTag = null
        }
        doit()
    }
    
    constructor(_this) {
        this.visInstance = _this
        this.deps = new Map()
        this.depKeys = []
    }
    add(tag) {
        if (! Dep.currentContext)
            return
        
        let oriVal = this.deps.get(Dep.currentContext),
            newVal = { tags: oriVal ? (oriVal.tags || {}) : {}, key: null, favour: null }
        newVal.tags[tag] = true
        newVal.favourTag = Dep.currentContextFavourTag
        
        this.deps.set(Dep.currentContext, newVal)
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