import Util from './util.js'
import VDom from './vdom.js'
import Renderer from './renderer.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vior {
    constructor(opts) {
        this.uniqueId = 'ViorInstance_' + Math.floor(Math.random() * 1e8)
        this.vdom = new VDom()
        this.renderer = new Renderer(this)
        
        if (opts.html) {
            this.html = opts.html
            this.originVTree = this.vdom.readFromText(opts.html)
            if (opts.events) {
                for (let k in opts.events) {
                    let v = opts.events[k]
                    opts.events[k] = Util.kebab2CamelCase(v).toLowerCase()
                }
            }
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
    triggerHook(name, bubbleDown = false) {
        if (this.opts.hooks && this.opts.hooks[name]) {
            try {
                this.opts.hooks[name].call(this)
            } catch (ex) {
                Util.triggerError('Runtime error', '(hook) ' + name, '', ex)
            }
        }
        if (bubbleDown && this.$children && this.$children.length) {
            for (let k in this.$children) {
                let v = this.$children[k]
                v.triggerHook(name, true)
            }
        }
    }
    handleFunctions() {
        this.funcs = {}
        for (let k in this.opts.funcs) {
            let v = this.opts.funcs[k],
                _this = this
            this.funcs[k] = function (...args) {
                return _this.opts.funcs[k].call(_this, ...args)
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
            this.componentTags[k] = Util.camel2KebabCase(v)
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
        
        this.triggerHook('unmounted', true)
        return this
    }
    
    $triggerEvent(evtName, ...args) {
        evtName = Util.kebab2CamelCase(evtName).toLowerCase()
        if (! this.componentEvents || ! this.componentEvents[evtName])
            Util.triggerError('Runtime error', '(component event) ' + evtName, null, '(inner error) please make sure that you have registered the specific component event before you trigger it!')
        try {
            this.componentEvents[evtName](...args)
        } catch (ex) {
            Util.triggerError('Runtime error', '(component event) ' + evtName, null, ex)
        }
    }
}