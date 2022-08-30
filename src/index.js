import Dep from './dep.js'
import { ref } from './ref.js'
import VDom from './vdom.js'

export default class Vis {
    constructor(opts) {
        if (window.__isVisAvailable) {
            throw new Error(`[Vis Error] Instance error: Vis instance is already available! You can only create one Vis instance in one document, and Vis will mount to <body></body> automaticly.`)
        }
        window.__isVisAvailable = true
        window.__visInstance = this
        
        this.data = ref(opts.data ? opts.data() : {}, this)
        this.funcs = opts.funcs || {}
        this.deps = new Dep(this)
        this.deps.context(this.render, this)
        
        opts.onMounted && opts.onMounted.call(this)
    }
    render() {
        if (! this.vdom) {
            this.vdom = new VDom(this)
        }
        this.vdom.sync()
    }
}