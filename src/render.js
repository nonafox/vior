import Util from './util.js'
import Dep from './dep.js'
import Ref from './ref.js'
import TDom from './tdom.js'

export default class Render {
    constructor(viorIns, vdom) {
        this.viorInstance = viorIns
        this.vdom = vdom
        this.tdom = new TDom(vdom)
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
        let refKeysArr = Object.keys(this.viorInstance.refs.__getRaw()),
            refKeys = refKeysArr.join(', '),
            funcKeysArr = Object.keys(this.viorInstance.funcs),
            ctxKeys = Object.keys(vnode.ctx).join(', '),
            ctxSetup = ! isEvt ? '__ctx' : 'this.__viorCtx',
            thises = ! isEvt ? 'null, this.viorInstance' : 'this, this.__viorCtx.__viorInstance'
        code = ! isEvt ? `return (${code})` : `${code}`
        
        let funcsSetup = ''
        for (let kk in funcKeysArr) {
            let k = funcKeysArr[kk]
            funcsSetup += `let ${k} = function (...args) { __syncRefs(); $this.funcs.${k}.call($this, ...args) }; `
        }
        let refsSyncSetup = '', refKeys_origin = []
        for (let kk in refKeysArr) {
            let k = refKeysArr[kk]
            refsSyncSetup += `if (__origin_value__${k} !== ${k}) { $this.refs.${k} = ${k} }; `
            refKeys_origin.push(`${k}: __origin_value__${k}`)
        }
        refKeys_origin = refKeys_origin.join(', ')
        
        let setup = `
            (function ($this) {
                let __syncRefs = () => {
                        ${refsSyncSetup}
                    }
                let { ${refKeys} } = $this.refs,
                    { ${refKeys_origin} } = $this.refs,
                    { ${ctxKeys} } = ${ctxSetup};
                ${funcsSetup}
                ${code};
                __syncRefs()
            }).call(${thises})
        `
        
        if (isEvt) {
            return setup
        } else {
            try {
                return this.runInEvalContext(setup, vnode.ctx)
            } catch (ex) {
                Util.triggerError('Render error', key, code, ex)
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
                vnode.children = this.tdom.read(res).children
            }
        } catch (ex) {
            Util.triggerError('Command error', oriKey, val, ex)
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
                            
                            vnode.data[propName] = this.viorInstance.refs[val]
                            val = `${val} = this.${propName}; $args[0].preventDefault()`
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
                    res = res.replace(matched[0], this.runInContext(vnode, null, matched[1]))
                }
                return res
            default:
                return null
        }
    }
    handleEvtFunctions(vnode) {
        for (let _k in vnode.data) {
            let v = vnode.data[_k]
            let k = /^__unhandled_functions__(.*)$/.exec(_k)
            if (! k)
                continue
            k = k[1]
            
            let _res = v.join('; '),
                res
            eval(`res = function (...$args) { ${_res} }`)
            
            delete vnode.data[_k]
            vnode.data[k] = res
        }
    }
    render(_onode, ctx = {}, needDeepCopy = true) {
        let onode = needDeepCopy ? Util.deepCopy(_onode) : _onode
        let tree = onode.children
        let defaultCtx = {
            __viorInstance: this.viorInstance,
            __triggerError: Util.triggerError
        }
        onode.ctx = Util.deepCopy(defaultCtx, ctx)
        
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
            this.handleEvtFunctions(v)
            
            if (v.type == 'text' && v.text)
                v.text = this.__render(onode, v, ov, 'text', v.text)
            if (v.children)
                v.children = this.render(v, v.ctx, false).children
        }
        return onode
    }
}