import Util from './util.js'
import Dep from './dep.js'
import Ref from './ref.js'
import VDom from './vdom.js'

export default class Renderer {
    constructor(viorIns) {
        this.viorInstance = viorIns
        this.vdom = new VDom()
    }
    insertNode(pvlist, svnode, vnode) {
        let i = pvlist.indexOf(svnode)
        if (i >= 0)
            pvlist.splice(i + 1, 0, vnode)
        else
            pvlist.push(vnode)
    }
    runInEvalContext(__code, __ctx) {
        return eval(__code)
    }
    runInContext(vnode, key, code, isEvt = false) {
        let refKeysArr = Object.keys(this.viorInstance.vars.__getRaw()),
            refKeys = refKeysArr.join(', '),
            funcKeysArr = Object.keys(this.viorInstance.funcs),
            ctxKeys = Object.keys(vnode.ctx).join(', '),
            ctxSetup = ! isEvt ? '__ctx' : 'this ? this.__viorCtx : __ctx',
            thises = ! isEvt ? 'null, this.viorInstance' : 'this, this ? this.__viorCtx.__viorInstance : __ctx.__viorInstance'
        let oriCode = code
        code = ! isEvt ? `return (${code})` : `${code}`
        
        let funcsSetup = ''
        for (let kk in funcKeysArr) {
            let k = funcKeysArr[kk]
            funcsSetup += `let ${k} = function (...args) { __syncRefs(); $this.funcs.${k}.call($this, ...args) }; `
        }
        let refsSyncSetup = '', refKeys_origin = []
        for (let kk in refKeysArr) {
            let k = refKeysArr[kk]
            refsSyncSetup += `if (__origin_value__${k} !== ${k}) { $this.vars.${k} = ${k} }; `
            refKeys_origin.push(`${k}: __origin_value__${k}`)
        }
        refKeys_origin = refKeys_origin.join(', ')
        
        let setup = `
            (function ($this) {
                let ____ctx = ${ctxSetup}
                try {
                    let __syncRefs = () => {
                            ${refsSyncSetup}
                        },
                        $emit = (__evtName, ...__args) => {
                            ____ctx['__component_' + $this.uniqueId + '__event__' + __evtName](...__args)
                        }
                    let { ${refKeys} } = $this.vars,
                        { ${refKeys_origin} } = $this.vars,
                        { ${ctxKeys} } = ____ctx;
                    ${funcsSetup}
                    ${code};
                    __syncRefs()
                } catch (ex) {
                    ____ctx.__triggerError('Runtime error', \`${key}\`, null, ex)
                }
            }).call(${thises})
        `
        
        if (isEvt) {
            return setup
        } else {
            try {
                return this.runInEvalContext(setup, vnode.ctx)
            } catch (ex) {
                Util.triggerError('Render error', key, oriCode, ex)
            }
        }
    }
    parseCommand(pvnode, vnode, ovnode, key, val, oriKey) {
        try {
            if (key == 'for') {
                let reg = /^\s*(.*?)\s+in\s+(.*?)\s*$/i,
                    matched = reg.exec(val), vars, arrCode
                if (matched)
                    ({ 1: vars, 2: arrCode } = matched)
                if (! vars || ! arrCode) {
                    vnode.deleted = true
                    return
                }
                vars = vars.replace(/[\(\)\[\]{}\s]/g, '').split(',')
                let { 0: keyName, 1: valName, 2: idName } = vars
                let arr = this.runInContext(vnode, key, arrCode)
                delete vnode.attrs[oriKey]
                
                let i = 0, lastNode = vnode
                let __setDomsNull = (node, setSelfNull = true) => {
                    if (setSelfNull)
                        node.dom = null
                    for (let kkk in node.children)
                        __setDomsNull(node.children[kkk])
                }
                for (let k in arr) {
                    let v = arr[k]
                    k = parseInt(k)
                    if (i == 0) {
                        if (keyName) vnode.ctx[keyName] = k
                        if (valName) vnode.ctx[valName] = v
                        if (idName) vnode.ctx[idName] = i
                        __setDomsNull(vnode, false)
                    } else {
                        let nnode = Util.deepCopy(ovnode)
                        delete nnode.attrs[oriKey]
                        __setDomsNull(nnode)
                        
                        let ctx = nnode.ctx
                        if (keyName) ctx[keyName] = k
                        if (valName) ctx[valName] = v
                        if (idName) ctx[idName] = i
                        this.insertNode(pvnode.children, lastNode, nnode)
                        lastNode = nnode
                    }
                    i ++
                }
                
                if (i == 0) {
                    vnode.deleted = true
                    return
                }
            } else if (key == 'if') {
                let res = this.runInContext(vnode, key, val)
                if (! res)
                    vnode.deleted = true
                pvnode.ctx.__if__value = res
            } else if (key == 'else') {
                let res = pvnode.ctx.__if__value
                if (res)
                    vnode.deleted = true
            } else if (key == 'elseif') {
                let res = pvnode.ctx.__if__value
                    res2 = this.runInContext(vnode, key, val)
                if (! (! res && res2))
                    vnode.deleted = true
            } else if (key == 'html') {
                let res = this.runInContext(vnode, key, val)
                vnode.children = this.vdom.readFromText(res).children
            }
        } catch (ex) {
            Util.triggerError('Render error', oriKey, val, ex)
        }
    }
    __render(pvnode, vnode, ovnode, type, data) {
        switch (type) {
            case 'attr':
                let { key, val } = data
                let prefix = data.key.substr(0, 1),
                    newKey = data.key.substr(1), newVal
                switch (prefix) {
                    case ':':
                        newVal = this.runInContext(vnode, key, val)
                        break
                    case '@':
                        let reg = /::(.*?)$/, propName = reg.exec(newKey)
                        if (propName) {
                            propName = propName[1]
                            newKey = newKey.replace(reg, '')
                            
                            vnode.data[propName] = this.viorInstance.vars[val]
                            val = `${val} = this.${propName}`
                        }
                        
                        newKey = '__unhandled_functions__on' + newKey
                        let funcs = vnode.data[newKey] || []
                        funcs.push(this.runInContext(vnode, key, val, true))
                        vnode.data[newKey] = funcs
                        
                        newKey = newVal = null
                        break
                    case '$':
                        this.parseCommand(pvnode, vnode, ovnode, newKey, val, key)
                        newKey = newVal = null
                        break
                    default:
                        newKey = key
                        newVal = val
                        break
                }
                return { newKey: newKey, newVal: newVal }
            case 'text':
                let reg = /{{(.*?)}}/g, _res = data, res = data, matched
                while (matched = reg.exec(_res)) {
                    res = res.replace(matched[0], this.runInContext(vnode, '(HTML template) [unknown]', matched[1]))
                }
                return res
            default:
                return null
        }
    }
    handleEvtFunctions(vnode) {
        let res = []
        for (let _k in vnode.data) {
            let v = vnode.data[_k]
            let k = /^__unhandled_functions__(.*)$/.exec(_k)
            if (! k)
                continue
            k = k[1]
            
            let _tmp = v.join('; '), tmp
            eval(`tmp = function (...$args) { ${_tmp} }`)
            
            delete vnode.data[_k]
            vnode.data[k] = tmp
            
            res.push(k)
        }
        return res
    }
    render(_onode, ctx = {}, rootRender = true, cachedCompIns = [], slots = []) {
        let onode = rootRender ? Util.deepCopy(_onode) : _onode
        let tree = onode.children
        let defaultCtx = {
            __viorInstance: this.viorInstance,
            __triggerError: Util.triggerError
        }
        onode.ctx = Util.deepCopy(defaultCtx, ctx)
        
        if (rootRender)
            cachedCompIns = Util.deepCopy(this.viorInstance.cachedComponentIns)
        
        for (let k = 0; k < tree.length; k ++) {
            let v = tree[k],
                ov = Util.deepCopy(v)
            if (! v) continue
            
            v.ctx = Util.deepCopy(v.ctx || {}, onode.ctx)
            
            let deleted = false
            for (let _k2 in v.attrs) {
                let k2 = _k2,
                    v2 = v.attrs[k2]
                let { newKey, newVal } = this.__render(onode, v, ov, 'attr', { key: k2, val: v2 })
                if (v.deleted) {
                    tree.splice(k, 1)
                    k --
                    deleted = true
                    break
                }
                if (newKey && newVal)
                    v.attrs[newKey] = newVal
                if (newKey != k2)
                    delete v.attrs[k2]
            }
            if (deleted)
                continue
            let handledEvtFuncs = this.handleEvtFunctions(v)
            
            if (this.viorInstance.componentTags && this.viorInstance.componentTags.indexOf(v.tag) >= 0) {
                let _this = this.viorInstance,
                    compTag = v.tag,
                    compIndex = _this.componentTags.indexOf(compTag),
                    compName = _this.componentNames[compIndex],
                    compOpts = _this.opts.comps[compName],
                    compIns = null
                if (cachedCompIns[compName] && cachedCompIns[compName][0]) {
                    compIns = cachedCompIns[compName][0]
                    cachedCompIns[compName].splice(0, 1)
                } else {
                    let viorConstructor = Object.getPrototypeOf(_this).constructor
                    compIns = new viorConstructor(compOpts)
                    if (! _this.cachedComponentIns[compName])
                        _this.cachedComponentIns[compName] = []
                    _this.cachedComponentIns[compName].push(compIns)
                }
                
                let octx = v.ctx
                v.ctx = Util.deepCopy(defaultCtx)
                v.ctx.__viorInstance = compIns
                let ctxKey = '__component_' + compIns.uniqueId + '__parentCtx'
                v.ctx[ctxKey] = octx
                for (let kk2 in handledEvtFuncs) {
                    let k2 = handledEvtFuncs[kk2],
                        v2 = v.data[k2]
                    let evtKey = '__component_' + compIns.uniqueId + '__event__' + k2
                    let tmp
                    eval(`tmp = function (...$args) { let __ctx = this.${ctxKey}; (${v2}).call(null, ...$args) }`)
                    v.ctx[evtKey] = tmp
                }
                
                v.children = this.render(v, v.ctx, false, cachedCompIns, null).children
                let __slots = {}
                for (let k2 in v.children) {
                    let v2 = v.children[k2]
                    if (v2.tag == 'slot') {
                        let name = v2.attrs.name || 'default'
                        if (! __slots[name])
                            __slots[name] = []
                        for (let k3 in v2.children)
                            __slots[name].push(v2.children[k3])
                    } else {
                        if (! __slots.default)
                            __slots.default = []
                        __slots.default.push(v2)
                    }
                }
                v.children = null
                v.slots = __slots
                let res = compIns.renderAsComponent(v)
                res.reverse()
                tree.splice(k, 1)
                for (let k2 in res)
                    tree.splice(k, 0, res[k2])
                k += res.length - 1
                
                continue
            } else if (v.tag == 'slot' && slots) {
                v.type = 'void'
                v.children = slots[v.attrs.name] || []
            }
            
            if (v.type == 'text' && v.text)
                v.text = this.__render(onode, v, ov, 'text', v.text)
            if (v.children) {
                let children = this.render(v, v.ctx, false, cachedCompIns, slots).children
                if (v.type != 'void') {
                    v.children = children
                } else {
                    let pushCount = children.length
                    tree.splice(k, 1)
                    children.reverse()
                    for (let k2 in children)
                        tree.splice(k, 0, children[k2])
                    k += pushCount - 1
                }
            }
        }
        return onode
    }
}