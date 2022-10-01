import Util from './util.js'

let currentContext, currentContextFavourTag

export default class Dep {
    static createDepContext(_this, func, favourTag = null) {
        let doit = () => {
            currentContext = doit
            currentContextFavourTag = favourTag
            func.call(_this)
            currentContext = null
            currentContextFavourTag = null
        }
        doit()
    }
    
    constructor(_this) {
        this.visInstance = _this
        this.deps = new Map()
    }
    add(tag) {
        if (! currentContext)
            return
        
        let oriVal = this.deps.get(currentContext),
            newVal = { tags: oriVal ? (oriVal.tags || {}) : {}, key: null, favour: null }
        newVal.tags[tag] = true
        newVal.favourTag = currentContextFavourTag
        
        this.deps.set(currentContext, newVal)
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