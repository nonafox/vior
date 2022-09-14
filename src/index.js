import Util from './util.js'
import VDom from './vdom.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vis {
    constructor(opts) {
        this.vdom = new VDom(this)
        this.opts = opts
        
        this.refs = Ref.createRef(this, opts.refs ? opts.refs() : {})
        this.hooks = opts.hooks || {}
        this.triggerHook('created')
    }
    triggerHook(name) {
        if (this.opts.hooks && this.opts.hooks[name]) {
            try {
                this.opts.hooks[name].call(this)
            } catch (ex) {
                Util.triggerError('Runtime error', '(hook) ' + name, '', ex)
            }
        }
    }
    mount(elm) {
        this.vdom.mount(elm)
        Dep.createDepContext(this, () => {
            this.vdom.update()
        })
        this.triggerHook('mounted')
        
        return this
    }
    unmount() {
        this.vdom.unmount()
        this.triggerHook('unmounted')
        
        return this
    }
}