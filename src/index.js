import VDom from './vdom.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vis {
    constructor(opts) {
        this.__vdom = new VDom(this)
        this.__opts = opts
        
        this.refs = Ref.createRef(this, opts.refs ? opts.refs() : {})
        this.funcs = opts.funcs || {}
        this.triggerEvent('created')
    }
    triggerEvent(name) {
        if (this.__opts.events && this.__opts.events[name]) {
            try {
                this.__opts.events[name].call(this)
            } catch (ex) {
                throw new Error(`[Vis error] Unhandled error during '${name}' event: \n${ex}`)
            }
        }
    }
    mount(elm) {
        this.__vdom.mount(elm)
        Dep.createDepContext(this, () => {
            this.__vdom.update()
        })
        
        this.triggerEvent('mounted')
    }
    unmount() {
        this.__vdom.unmount()
        
        this.triggerEvent('unmounted')
    }
}