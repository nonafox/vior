export default class Dep {
    static createDepContext(_this, func) {
        let doit = () => {
            Dep.__currentContext = doit
            func.call(_this)
            Dep.__currentContext = null
        }
        doit()
    }
    
    constructor(_this) {
        this.__visInstance = _this
        this.__deps = new Map()
    }
    add() {
        this.__deps.set(Dep.__currentContext)
    }
    notify() {
        let visInstance = this.__visInstance
        this.__deps.forEach((v, k) => {
            if (typeof k == 'function')
                k.call(visInstance)
        })
    }
}