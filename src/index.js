import Util from './util.js'
import VDom from './vdom.js'
import Renderer from './renderer.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vior {
    constructor(opts) {
        this.uniqueId = 'VisInstance_' + Math.floor(Math.random() * 1e8)
        this.vdom = new VDom()
        this.renderer = new Renderer(this)
        
        this.opts = opts
        this.handleFunctions()
        this.refs = Ref.createRef(this, opts.refs ? opts.refs() : {})
        this.handleDynamicRefs()
        this.handleWatchers()
        
        this.triggerHook('created')
    }
    handleFunctions() {
        this.funcs = {}
        for (let k in this.opts.funcs) {
            let v = this.opts.funcs[k],
                _this = this
            this.funcs[k] = function (...args) {
                _this.opts.funcs[k].call(_this, ...args)
            }
        }
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
            }, k)
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
        this.mounted = elm
        this.originVTree = this.vdom.read(elm)
        this.currentVTree = Util.deepCopy(this.originVTree)
        
        Dep.createDepContext(this, function () {
            this.update()
        })
        
        this.triggerHook('mounted')
        return this
    }
    update() {
        if (! this.mounted)
            return
        
        let vdom = this.vdom,
            renderer = this.renderer
        let oldVTree = this.currentVTree,
            newVTree = renderer.render(this.originVTree)
        vdom.patch(oldVTree, newVTree)
        this.currentVTree = newVTree
    }
    unmount() {
        this.mounted = null
        this.originVTree = null
        this.currentVTree = null
        
        this.triggerHook('unmounted')
        return this
    }
}