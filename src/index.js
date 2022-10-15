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
        this.handleHooks()
        
        this.triggerHook('created')
    }
    handleHooks() {
        this.hooks = {}
        if (this.opts.hooks) {
            for (let k in this.opts.hooks) {
                let v = this.opts.hooks[k]
                this.hooks[k] = [v]
            }
        }
    }
    triggerHook(name, bubbleDown = false) {
        try {
            for (let k in this.hooks[name]) {
                let v = this.hooks[name][k]
                if (typeof v == 'function')
                    v.call(this)
            }
        } catch (ex) {
            Util.triggerError('Runtime error', '(hook) ' + name, '', ex)
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
    handleSetupFunctions(tree) {
        for (let k in tree) {
            let v = tree[k]
            if (! v.deleted_dom) {
                for (let k2 in v.setups) {
                    let v2 = v.setups[k2]
                    if (typeof v2 == 'function')
                        v2(v, v.dom)
                }
            } else {
                for (let k2 in v.unsetups) {
                    let v2 = v.unsetups[k2]
                    if (typeof v2 == 'function') {
                        v2(v, v.deleted_dom)
                        delete v.deleted_dom
                    }
                }
            }
            if (v.children && v.children.length)
                this.handleSetupFunctions(v.children)
        }
    }
    update() {
        if (! this.mounted || this.isComponent)
            return
        if (this.updating) {
            this.debts = (this.debts || 0) + 1
            return
        }
        this.updating = true
        
        let vdom = this.vdom,
            renderer = this.renderer
        let oldVTree = this.currentVTree,
            newVTree = renderer.render(this.originVTree)
        vdom.patch(oldVTree, newVTree)
        this.currentVTree = newVTree
        
        this.handleSetupFunctions(oldVTree.children)
        this.handleSetupFunctions(newVTree.children)
        
        this.updating = false
        if (this.debts) {
            this.debts --
            this.update()
        }
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