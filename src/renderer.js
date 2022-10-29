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
        let __tmp
        eval(`__tmp = (${__code})`)
        return __tmp
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
            funcsSetup += `let ${k} = function (...args) { __syncVars(); return $this.funcs.${k}.call($this, ...args) }; `
        }
        let varsSyncSetup = '', refKeys_origin = []
        for (let kk in refKeysArr) {
            let k = refKeysArr[kk]
            varsSyncSetup += `if (__origin_value__${k} !== ${k}) { $this.vars.${k} = ${k} }; `
            refKeys_origin.push(`${k}: __origin_value__${k}`)
        }
        refKeys_origin = refKeys_origin.join(', ')
        
        let setup = `
            (function ($this) {
                let ____ctx = ${ctxSetup},
                    $util = ____ctx.__util,
                    $parent = $this.$parent,
                    $children = $this.$children
                let __syncVars = () => {
                        try { ${varsSyncSetup} } catch (ex) {
                            $util.triggerError('Runtime error', \`${key}\`, null, '(inner error) sync reactive variables error.')
                        }
                    },
                    $triggerEvent = (evtName, ...__args) => {
                        evtName = $util.kebab2CamelCase(evtName).toLowerCase()
                        if (! $this.componentEvents || ! $this.componentEvents[evtName])
                            $util.triggerError('Runtime error', '(component event) ' + evtName, null, '(inner error) please make sure that you have registered the specific component event before you trigger it!')
                        try { $this.componentEvents[evtName](...__args) } catch (ex) {
                            $util.triggerError('Runtime error', '(component event) ' + evtName, null, ex)
                        }
                    }
                let { ${refKeys} } = $this.vars,
                    { ${refKeys_origin} } = $this.vars,
                    { ${ctxKeys} } = ____ctx
                ${funcsSetup}
                try { ${code} } catch (ex) {
                    $util.triggerError('Runtime error', \`${key}\`, null, ex)
                }
                __syncVars()
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
    pushEvtFunction(data, key, func) {
        let newKey = '__unhandled_functions__' + key
        if (! data[newKey])
            data[newKey] = []
        data[newKey].push(func)
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
            tmp = this.runInEvalContext(`function (...$args) { ${_tmp} }`)
            
            delete vnode.data[_k]
            vnode.data[k] = tmp
            
            res.push(k)
        }
        return res
    }
    parseCommand(pvnode, vnode, key, val, oriKey) {
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
                let arr = this.runInContext(vnode, oriKey, arrCode)
                delete vnode.attrs[oriKey]
                
                let i = 0, lastNode = vnode
                let setDomsNull = (node, setSelfNull = true) => {
                    if (setSelfNull)
                        node.dom = null
                    for (let kkk in node.children)
                        setDomsNull(node.children[kkk])
                }
                for (let k in arr) {
                    let v = arr[k]
                    k = parseInt(k)
                    if (i == 0) {
                        if (keyName) vnode.ctx[keyName] = k
                        if (valName) vnode.ctx[valName] = v
                        if (idName) vnode.ctx[idName] = i
                        setDomsNull(vnode, false)
                    } else {
                        let nnode = Util.deepCopy(vnode)
                        delete nnode.attrs[oriKey]
                        setDomsNull(nnode)
                        
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
                let res = this.runInContext(vnode, oriKey, val)
                if (! res)
                    vnode.deleted = true
                pvnode.ctx.__if_value = res ? true : false
            } else if (key == 'else') {
                let res = pvnode.ctx.__if_value
                if (res)
                    vnode.deleted = true
            } else if (key == 'elseif') {
                let res = pvnode.ctx.__if_value
                    res2 = this.runInContext(vnode, oriKey, val)
                if (! (! res && res2))
                    vnode.deleted = true
            } else if (key == 'html') {
                let res = this.runInContext(vnode, oriKey, val)
                vnode.children = this.vdom.readFromText(res).children
            } else if (key == 'is') {
                if (val) {
                    vnode.tag = Util.camel2KebabCase(this.runInContext(vnode, oriKey, val))
                    if (Util.voidTags.indexOf(vnode.tag) < 0)
                        vnode.type = 'common'
                    else
                        vnode.type = 'void'
                } else {
                    Util.triggerError('Render error', oriKey, val, '(inner error) can not set the element tag to null.')
                }
            } else if (key == 'value') {
                let value = this.runInContext(vnode, oriKey, val)
                if (Util.inputTags.indexOf(vnode.tag) >= 0) {
                    if (vnode.tag == 'input' || vnode.tag == 'textarea') {
                        let type = vnode.attrs.type || '',
                            code
                        switch (type) {
                            case '':
                            case 'text':
                                vnode.data.value = value
                                code = `${val} = this.value`
                                this.pushEvtFunction(vnode.data, 'oninput', this.runInContext(vnode, oriKey, code, true))
                                break
                            case 'checkbox':
                                let arrayMode = vnode.attrs.value !== undefined && (Array.isArray(value) || Ref.isArrayRef(value))
                                vnode.data.checked = arrayMode ? Util.deepIndexof(value, vnode.attrs.value) !== undefined : Boolean(value)
                                vnode.ctx.__special_attr__value = vnode.attrs.value
                                code = `
                                    if (! ${arrayMode}) {
                                        ${val} = this.checked
                                    } else {
                                        let v = this.__viorCtx.__special_attr__value
                                        if (this.checked) {
                                            if ($util.deepIndexof(${val}, v) === undefined)
                                                ${val}.push(v)
                                        } else {
                                            if ($util.deepIndexof(${val}, v) !== undefined)
                                                ${val}.splice($util.deepIndexof(${val}, v), 1)
                                        }
                                    }
                                `
                                this.pushEvtFunction(vnode.data, 'onchange', this.runInContext(vnode, oriKey, code, true))
                                break
                            case 'radio':
                                vnode.data.checked = Util.deepCompare(vnode.attrs.value, value)
                                code = `${val} = this.value`
                                this.pushEvtFunction(vnode.data, 'onchange', this.runInContext(vnode, oriKey, code, true))
                                break
                            default:
                                break
                        }
                    } else if (vnode.tag == 'select') {
                        let multiple = vnode.attrs.multiple !== undefined && (Array.isArray(value) || Ref.isArrayRef(value))
                        vnode.ctx.__father_select__value = value
                        vnode.ctx.__father_select__mutiple = multiple
                        let code = `
                            let __readOpts = (arr) => {
                                let list = Object.assign({}, arr), res = []
                                for (let k in list) {
                                    let v = list[k],
                                        sval = v.__viorCtx.__special_attr__value
                                    res.push(sval !== undefined ? sval : v.value)
                                }
                                return res
                            }
                            let __res = __readOpts(this.selectedOptions)
                            ${val} = ${multiple} ? __res : __res[0]
                        `
                        this.pushEvtFunction(vnode.data, 'onchange', this.runInContext(vnode, oriKey, code, true))
                    }
                } else if (this.viorInstance.componentTags && this.viorInstance.componentTags.indexOf(vnode.tag) >= 0) {
                    vnode.attrs.$value = value
                    let code = `${val} = $args[0]`
                    this.pushEvtFunction(vnode.data, 'on$value', this.runInContext(vnode, oriKey, code, true))
                    return true
                }
            } else if (key == 'ref') {
                let value = this.runInContext(vnode, oriKey, val),
                    multiple = value && (Array.isArray(value) || Ref.isArrayRef(value))
                
                let runInEvalContext = this.runInEvalContext, _this = this
                vnode.setups.push(function (node, dom) {
                    runInEvalContext(`
                        (function () {
                            if (! ${multiple})
                                __ctx.thisIns.vars.${val} = __ctx.domIns
                            else if (__ctx.thisIns.vars.${val}.indexOf(__ctx.domIns) < 0)
                                __ctx.thisIns.vars.${val}.push(__ctx.domIns)
                        })()
                    `, { thisIns: _this.viorInstance, domIns: dom })
                })
                vnode.unsetups.push(function (node, dom) {
                    runInEvalContext(`
                        (function () {
                            if (! ${multiple})
                                __ctx.thisIns.vars.${val} = null
                            else if (__ctx.thisIns.vars.${val}.indexOf(__ctx.domIns) >= 0)
                                __ctx.thisIns.vars.${val}.splice(__ctx.domIns, 1)
                        )()
                    `, { thisIns: _this.viorInstance, domIns: dom })
                })
                vnode.data.__special_attr__ref_origin = this.viorInstance
                vnode.data.__special_attr__ref_code = val
            } else if (key == 'ownstyle') {
                if (vnode.tag != 'style') {
                    Util.triggerError('Render error', oriKey, val,
                        '(inner error) you can only use command `$private` on <style><...> elements.')
                    return
                }
                let inner = vnode.children[0],
                    regexp = /([a-zA-Z0-9\-_#\*\.]+)\s*{/g
                inner.text = Util.scriptReg(inner.text, regexp, `$1[${this.viorInstance.uniqueId}] {`)
            }
        } catch (ex) {
            Util.triggerError('Render error', oriKey, val, ex)
        }
    }
    __render(pvnode, vnode, type, data) {
        switch (type) {
            case 'attr':
                let { key, val } = data
                let prefix = data.key.substr(0, 1),
                    newKey = Util.camel2KebabCase(data.key.substr(1)), newVal
                switch (prefix) {
                    case ':':
                        newVal = this.runInContext(vnode, key, val)
                        
                        let pushClass = (nval) => {
                            if (typeof newVal != 'string')
                                newVal = ''
                            for (let k in nval) {
                                let v = nval[k]
                                if (v)
                                    newVal += Util.camel2KebabCase(k) + ' '
                            }
                        }
                        
                        if (newKey == 'class') {
                            if (! Array.isArray(newVal) && ! (Ref.isArrayRef(newVal))) {
                                pushClass(newVal)
                            } else {
                                let nval = newVal
                                for (let k in nval) {
                                    let v = nval[k]
                                    pushClass(v)
                                }
                            }
                            if (vnode.attrs.class)
                                newVal = vnode.attrs.class + ' ' + newVal
                            newVal = newVal.replace(/\s$/, '')
                        } else if (newKey == 'style') {
                            let res = ''
                            for (let _k in newVal) {
                                let k = Util.camel2KebabCase(_k),
                                    v = newVal[_k]
                                if (typeof v == 'number')
                                    v = `${v}px`
                                res += `${k}: ${v}; `
                            }
                            newVal = (vnode.attrs.style || '') + res
                            newVal = newVal.replace(/\s$/, '')
                        }
                        break
                    case '@':
                        let nativeName = Util.kebab2CamelCase(newKey).toLowerCase()
                        this.pushEvtFunction(vnode.data, 'on' + nativeName, this.runInContext(vnode, key, val, true))
                        newKey = newVal = null
                        break
                    case '$':
                        let res = this.parseCommand(pvnode, vnode, newKey, val, key)
                        if (! res) {
                            newKey = newVal = null
                        } else {
                            newKey = key
                            newVal = vnode.attrs[newKey]
                        }
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
    handleComponent(tree, k, v, slots, cachedCompIns, handledEvtFuncs) {
        if (this.viorInstance.componentTags && this.viorInstance.componentTags.indexOf(v.tag) >= 0) {
            let _this = this.viorInstance,
                compTag = v.tag,
                compIndex = _this.componentTags.indexOf(compTag),
                compName = _this.componentNames[compIndex],
                compOpts = _this.opts.comps[compName],
                compIns = null,
                isNewIns = false
            if (cachedCompIns[compName] && cachedCompIns[compName][0]) {
                compIns = cachedCompIns[compName][0]
                cachedCompIns[compName].splice(0, 1)
            } else {
                let viorConstructor = Object.getPrototypeOf(_this).constructor
                compIns = new viorConstructor(compOpts)
                if (! _this.cachedComponentIns[compName])
                    _this.cachedComponentIns[compName] = []
                _this.cachedComponentIns[compName].push(compIns)
                isNewIns = true
            }
            
            compIns.$parent = this.viorInstance
            if (! this.viorInstance.$children) {
                this.viorInstance.$children = []
            }
            if (this.viorInstance.$children.indexOf(compIns) < 0) {
                this.viorInstance.$children.push(compIns)
            }
            compIns.componentEvents = {}
            for (let kk2 in handledEvtFuncs) {
                let k2 = handledEvtFuncs[kk2],
                    v2 = v.data[k2]
                if ((compIns.opts.events || []).indexOf(k2) < 0)
                    continue
                
                let tmp = this.runInEvalContext(`function (...$args) { (${v2}).call(null, ...$args) }`, v.ctx)
                compIns.componentEvents[k2] = tmp
            }
            
            v.children = this.render(v, v.ctx, false, cachedCompIns, slots).children
            let __slots = {}
            for (let k2 in v.children) {
                let v2 = v.children[k2]
                if (v2.tag == 'slot-provider') {
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
            
            let soviet = res[0]
            if (isNewIns) {
                if (v.data.__special_attr__ref_origin) {
                    let targetSetup = `__ctx.originIns.vars.${v.data.__special_attr__ref_code}`
                    this.runInEvalContext(`
                        (function () {
                            if ((Array.isArray(${targetSetup}) || __ctx.Ref.isArrayRef(${targetSetup}))
                                && ${targetSetup}.indexOf(__ctx.thisIns) < 0) {
                                ${targetSetup}.push(__ctx.thisIns)
                            } else {
                                ${targetSetup} = __ctx.thisIns
                            }
                        })()
                    `, { originIns: v.data.__special_attr__ref_origin, thisIns: compIns, Util: Util, Ref: Ref })
                    
                    if (! compIns.hooks.uncreated)
                        compIns.hooks.uncreated = []
                    let runInEvalContext = this.runInEvalContext
                    compIns.hooks.uncreated.push(function () {
                        runInEvalContext(`
                            (function () {
                                if ((Array.isArray(${targetSetup}) || __ctx.Ref.isArrayRef(${targetSetup}))
                                    && ${targetSetup}.indexOf(__ctx.thisIns) >= 0) {
                                    ${targetSetup}.splice(${targetSetup}.indexOf(__ctx.thisIns), 1)
                                } else {
                                    ${targetSetup} = null
                                }
                            })()
                        `, { originIns: v.data.__special_attr__ref_origin, thisIns: this, Util: Util, Ref: Ref })
                    })
                }
                soviet.setups.push(function () {
                    try {
                        soviet.ctx.__viorInstance.triggerHook('mounted', true)
                    } catch (ex) {
                        soviet.ctx.__util.triggerError('Runtime error', '(hook) mounted', null, ex)
                    }
                })
            }
            
            for (let k2 in res)
                tree.splice(k, 0, res[k2])
            k += res.length - 1
            return { k: k }
        } else if (v.tag == 'slot-receiver' && slots && Util.realLength(slots)) {
            v.children = slots[v.attrs.name || 'default'] || []
            return null
        } else {
            return null
        }
    }
    render(_onode, ctx = {}, rootRender = true, cachedCompIns = [], slots = []) {
        let onode = rootRender ? Util.deepCopy(_onode) : _onode
        let tree = onode.children || []
        let defaultCtx = {
            __viorInstance: this.viorInstance,
            __util: Util
        }
        onode.ctx = Util.deepCopy(defaultCtx, ctx)
        
        if (rootRender) {
            cachedCompIns = Util.deepCopy(this.viorInstance.cachedComponentIns)
        }
        
        for (let k = 0; k < tree.length; k ++) {
            let v = tree[k]
            if (! v) continue
            
            v.ctx = Util.deepCopy(onode.ctx, v.ctx || {})
            
            let deleted = false
            for (let _k2 in v.attrs) {
                let k2 = _k2,
                    v2 = v.attrs[k2]
                let { newKey, newVal } = this.__render(onode, v, 'attr', { key: k2, val: v2 })
                if (v.deleted) {
                    tree.splice(k, 1)
                    k --
                    deleted = true
                    break
                }
                if (newKey)
                    v.attrs[newKey] = newVal
                if (newKey != k2)
                    delete v.attrs[k2]
            }
            if (deleted)
                continue
            if (v.tag)
                v.attrs[this.viorInstance.uniqueId] = ''
            let handledEvtFuncs = this.handleEvtFunctions(v)
            
            if (v.tag == 'option' && v.ctx.__father_select__value !== undefined) {
                let fval = v.ctx.__father_select__value,
                    fmutiple = v.ctx.__father_select__mutiple
                let tval = v.attrs.value !== undefined ? v.attrs.value : this.vdom.patchFromText(v.children)
                v.ctx.__special_attr__value = v.attrs.value
                if (fmutiple ? Util.deepIndexof(fval, tval) : Util.deepCompare(tval, fval)) {
                    v.attrs.selected = true
                } else {
                    v.attrs.selected = false
                }
            }
            
            let handleComponentRes = this.handleComponent(tree, k, v, slots, cachedCompIns, handledEvtFuncs)
            if (handleComponentRes) {
                ({ k } = handleComponentRes)
                continue
            }
            
            if (v.type == 'text' && v.text)
                v.text = this.__render(onode, v, 'text', v.text)
            if (v.tag && v.children) {
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
        
        if (rootRender) {
            for (let k in cachedCompIns) {
                let v = cachedCompIns[k]
                for (let k2 in v) {
                    let v2 = v[k2],
                        ori = this.viorInstance.cachedComponentIns
                    ori[k].splice(ori[k].indexOf(v2), 1)
                    let $children = this.viorInstance.$children
                    $children.splice($children.indexOf(v2), 1)
                    v2.triggerHook('unmounted')
                    v2.triggerHook('uncreated')
                }
            }
        }
        
        return onode
    }
}