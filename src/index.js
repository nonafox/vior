import Util from './util.js'
import VDom from './vdom.js'
import Renderer from './renderer.js'
import Dep from './dep.js'
import Ref from './ref.js'

export default class Vior {
    constructor(opts) {
        try {
            this.uniqueId = 'vior_' + Util.randomText()
            this.vdom = new VDom()
            this.renderer = new Renderer(this)
            
            opts = opts ? opts : {}
            this.opts = opts
            this.handlePlugins()
            
            if (opts.html) {
                this.html = opts.html
                this.originVNode = this.vdom.readFromText(opts.html)
                if (opts.events) {
                    for (let k in opts.events) {
                        let v = opts.events[k]
                        opts.events[k] = Util.kebab2CamelCase(v).toLowerCase()
                    }
                }
                this.isComponent = true
            }
            
            this.handleHooks()
            this.handleFunctions()
            this.vars = Ref.createRef(this, opts.vars ? opts.vars() : {})
            this.handleDynamicVars()
            this.handleWatchers()
            this.handleComponents()
            
            this.triggerHook('created')
        } catch (ex) {
            Util.triggerError('Initialize error', '(inner) constructor', null, ex)
        }
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
    handlePlugins() {
        if (this.opts.plugins) {
            for (let k in this.opts.plugins) {
                let v = this.opts.plugins[k]
                v.plugin.setup(this.opts, v.arg)
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
    handleDynamicVars() {
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
        try {
            if (this.isComponent)
                return
            
            this.mounted = elm
            this.originVNode = this.vdom.read(elm)
            this.currentVNode = Util.deepCopy(this.originVNode)
            Dep.createDepContext(this, function () {
                this.update()
            })
            
            this.triggerHook('mounted')
            return this
        } catch (ex) {
            Util.triggerError('Initialize error', '(inner) mount', null, ex)
        }
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
        try {
            if (! this.mounted || this.isComponent)
                return
            if (this.updating) {
                this.debts = (this.debts || 0) + 1
                return
            }
            this.updating = true
            
            let vdom = this.vdom,
                renderer = this.renderer
            let oldVNode = this.currentVNode,
                newVNode = renderer.render(this.originVNode)
            vdom.patch(oldVNode, newVNode)
            this.currentVNode = newVNode
            
            this.handleSetupFunctions(oldVNode.children)
            this.handleSetupFunctions(newVNode.children)
            
            this.updating = false
            if (this.debts) {
                this.debts --
                this.update()
            }
        } catch (ex) {
            Util.triggerError('Update error', null, null, ex)
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
        
        return this.renderer.render(this.originVNode, {}, true, [], vnode.slots).children
    }
    unmount() {
        this.mounted = null
        this.originVNode = null
        this.currentVNode = null
        
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