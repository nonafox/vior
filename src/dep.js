window.__depContext = null

export default class Dep {
    constructor(insContext) {
        this.depsList = new Map()
        this.insContext = insContext
    }
    context(func) {
        window.__depContext = func
        func.call(this.insContext)
        window.__depContext = null
    }
    add() {
        if (window.__depContext)
            this.depsList.set(window.__depContext)
    }
    notify() {
        this.depsList.forEach((v, k) => {
            k.call(this.insContext)
        })
    }
}