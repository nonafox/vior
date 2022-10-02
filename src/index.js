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
        
        if (opts.html) {
            this.html = opts.html
            this.originVTree = this.vdom.readFromText(opts.html)
            this.isComponent = true
        }
        
        this.opts = opts
        this.handleFunctions()
        this.vars = Ref.createRef(this, opts.vars ? opts.vars() : {})
        this.handleDynamicRefs()
        this.handleWatchers()
        this.handleComponents()
        
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
        for (let k in this.vars) {
            let v = this.vars[k]
            if (typeof v == 'function') {
                Dep.createDepContext(this, function () {
                    this.vars[k] = v.call(this)
                })
            }
        }
    }
    handleWatchers() {
        for (let k in this.opts.watchers) {
            let v = this.opts.watchers[k]
            Dep.createDepContext(this, function () {
                void this.vars[k]
                v.call(this)
            }, k)
        }
    }
    handleComponents() {
        this.cachedComponentIns = {}
        this.componentNames = Object.keys(this.opts.comps || {})
        this.componentTags = []
        for (let k in this.componentNames) {
            let v = this.componentNames[k]
            let tmp = v.replace(/([A-Z]{1})/g, '-$1').split('-')
            tmp.splice(0, 1)
            for (let k2 in tmp)
                tmp[k2] = tmp[k2].toLowerCase()
            v = tmp.join('-')
            this.componentTags[k] = v
        }
    }
    mount(elm) {
        if (this.isComponent)
            return
        
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
        if (! this.mounted || this.isComponent)
            return
        
        let vdom = this.vdom,
            renderer = this.renderer
        let oldVTree = this.currentVTree,
            newVTree = renderer.render(this.originVTree)
        vdom.patch(oldVTree, newVTree)
        this.currentVTree = newVTree
    }
    renderAsComponent(vnode) {
        if (! this.isComponent)
            return
        
        for (let k in vnode.attrs) {
            let v = vnode.attrs[k]
            if (this.opts.attrs && this.opts.attrs.indexOf(k) >= 0)
                this.vars.__setRaw(k, v)
        }
        
        return this.renderer.render(this.originVTree, {}, true, [], vnode.slots).children
    }
    unmount() {
        this.mounted = null
        this.originVTree = null
        this.currentVTree = null
        
        this.triggerHook('unmounted')
        return this
    }
}