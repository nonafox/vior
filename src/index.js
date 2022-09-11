import Util from './util.js'
import VDom from './vdom.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vis {
    constructor(opts) {
        this.vdom = new VDom(this)
        this.opts = opts
        
        this.refs = Ref.createRef(this, opts.refs ? opts.refs() : {})
        this.funcs = opts.funcs || {}
        this.triggerEvent('created')
    }
    triggerEvent(name) {
        if (this.opts.events && this.opts.events[name]) {
            try {
                this.opts.events[name].call(this)
            } catch (ex) {
                Util.triggerError('Runtime error', '(event) ' + name, '', ex)
            }
        }
    }
    mount(elm) {
        this.vdom.mount(elm)
        Dep.createDepContext(this, () => {
            this.vdom.update()
        })
        
        this.triggerEvent('mounted')
    }
    unmount() {
        this.vdom.unmount()
        
        this.triggerEvent('unmounted')
    }
}