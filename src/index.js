import Util from './util.js'
import VDom from './vdom.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vis {
    constructor(opts) {
        this.vdom = new VDom(this)
        this.opts = opts
        
        this.funcs = opts.funcs || {}
        this.refs = Ref.createRef(this, opts.refs ? opts.refs() : {})
        this.handleDynamicRefs()
        this.handleWatchers()
        this.triggerHook('created')
    }
    handleDynamicRefs() {
        for (let k in this.refs) {
            let v = this.refs[k]
            if (typeof v == 'function') {
                Dep.createDepContext(this, function () {
                    this.refs[k] = v.call(this)
                })
            }
        }
    }
    handleWatchers() {
        for (let k in this.opts.watchers) {
            let v = this.opts.watchers[k]
            Dep.createDepContext(this, function () {
                void this.refs[k]
                v.call(this)
            })
        }
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
        Dep.createDepContext(this, function () {
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