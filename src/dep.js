export default class Dep {
    static createDepContext(_this, func) {
        let doit = () => {
            Dep.currentContext = doit
            func.call(_this)
            Dep.currentContext = null
        }
        doit()
    }
    
    constructor(_this) {
        this.visInstance = _this
        this.deps = new Map()
    }
    add() {
        this.deps.set(Dep.currentContext)
    }
    notify() {
        let visInstance = this.visInstance
        this.deps.forEach((v, k) => {
            if (typeof k == 'function')
                k.call(visInstance)
        })
    }
}