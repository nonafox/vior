import Util from './util.js'

export default class Render {
    constructor(visIns) {
        this.__visInstance = visIns
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
    runInContext(vnode, key, code, evtName = null) {
        let refKeys = Object.keys(this.__visInstance.refs.__getRaw()).join(', '),
            funcKeys = Object.keys(this.__visInstance.funcs).join(', '),
            ctxKeys = Object.keys(vnode.ctx).join(', '),
            extraThis = evtName ? ', this' : ''
        code = ! evtName ? `return (${code})` : `${code}`
        let setup = `
            (function () {
                let { ${refKeys} } = this.refs,
                    { ${funcKeys} } = this.funcs,
                    { ${ctxKeys} } = __ctx;
                ${code}
            }).call(this.__visInstance)
        `
        
        if (evtName) {
            let evt = '__evt_' + evtName,
                evtSource = evt + '__source'
            vnode.ctx[evtSource] = setup
            vnode.ctx[evt] = function($this) {
                try {
                    (function (__code, __ctx) {
                        eval(__code)
                    }).call($this.__ctx, this[evtSource], $this.__ctx)
                } catch (ex) {
                    if (this.__triggerError)
                        this.__triggerError('Runtime error', key, code, ex)
                }
            }
            return `this.__ctx.${evt}(this)`
        } else {
            try {
                return this.runInEvalContext(setup, vnode.ctx)
            } catch (ex) {
                Util.triggerError('Runtime error', key, code, ex)
            }
        }
    }
    __parseCommand(pvnode, vnode, key, val, oriKey) {
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
                if (Util.isPlainObject(arr) && Util.realLength(arr)) {
                    for (let k in arr) {
                        let v = arr[k]
                        if (i == 0) {
                            if (keyName) vnode.ctx[keyName] = k
                            if (valName) vnode.ctx[valName] = v
                            if (idName) vnode.ctx[idName] = i
                        } else {
                            let nnode = Util.deepCopy(vnode)
                            nnode.dom = null
                            let ctx = nnode.ctx
                            if (keyName) ctx[keyName] = k
                            if (valName) ctx[valName] = v
                            if (idName) ctx[idName] = i
                            nnode = this.render({ children: [nnode] }, ctx).children[0]
                            if (nnode) {
                                this.insertNode(pvnode.children, lastNode, nnode)
                                lastNode = nnode
                            }
                        }
                        i ++
                    }
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
            }
        } catch (ex) {
            Util.triggerError('Command error', oriKey, val, ex)
        }
    }
    __render(pvnode, vnode, type, data) {
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
                        newKey = 'on' + newKey
                        newVal = this.runInContext(vnode, key, val, newKey)
                        break
                    case '$':
                        this.__parseCommand(pvnode, vnode, newKey, val, key)
                        newKey = newVal = null
                        break
                }
                return { newKey: newKey, newVal: newVal }
            case 'text':
                let reg = /{{(.*?)}}/g, res = data, matched
                while (matched = reg.exec(res)) {
                    res = res.replace(matched[0], this.runInContext(vnode, null, matched[1]))
                }
                return res
            default:
                return null
        }
    }
    render(_onode, ctx = {}, needDeepCopy = true) {
        let onode = needDeepCopy ? Util.deepCopy(_onode) : _onode
        let tree = onode.children
        let defaultCtx = {
            __visInstance: this.__visInstance,
            __triggerError: Util.triggerError
        }
        
        onode.ctx = Util.deepCopy(defaultCtx, ctx)
        
        for (let k in tree) {
            let v = tree[k]
            if (! v) continue
            
            v.ctx = onode.ctx
            
            let deleted = false
            for (let k2 in v.attrs) {
                let v2 = v.attrs[k2]
                let { newKey, newVal } = this.__render(onode, v, 'attr', { key: k2, val: v2 })
                if (v.deleted) {
                    tree.splice(k, 1)
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
            
            if (v.type == 'text' && v.text)
                v.text = this.__render(onode, v, 'text', v.text)
            if (v.children)
                v.children = this.render(v, v.ctx, false).children
        }
        return onode
    }
}