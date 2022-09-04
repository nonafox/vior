import Util from './util.js'

export default class Render {
    constructor(visIns) {
        this.__visInstance = visIns
    }
    insertNode(pvnode, svnode, vnode) {
        let i = pvnode.indexOf(svnode)
        if (i >= 0)
            pvnode.splice(i + 1, 0, vnode)
        else
            pvnode.push(vnode)
    }
    render(otree, ctx = {}, needDeepCopy = true) {
        let res = [], tree = needDeepCopy ? Util.deepCopy(otree) : otree
        for (let k in tree) {
            let v = tree[k]
            v.ctx = Object.assign(v.ctx, ctx)
            
            for (let k2 in v.attrs) {
                let v2 = v.attrs[k2]
                let { newKey, newVal } = this.__render(tree, v, 'attr', { key: k2, val: v2 })
                if (newKey && newVal)
                    v.attrs[newKey] = newVal
                if (newKey != k2)
                    delete v.attrs[k2]
            }
            if (v.type == 'text' && v.text)
                v.text = this.__render(tree, v, 'text', v.text)
            
            if (v.children)
                v.children = this.render(v.children, v.ctx, false)
        }
        return tree
    }
    runInEvalContext(__code, __ctx) {
        return eval(__code)
    }
    runInContext(vnode, key, code, evtName = null) {
        let refs = Object.keys(this.__visInstance.refs.__getRaw()),
            funcs = Object.keys(this.__visInstance.funcs)
        let ctxCode = evtName ? '__domIns.__ctx' : '__ctx',
            ctxKeys = vnode.ctx ? Object.keys(vnode.ctx) : []
        let setup = `
            (function (__domIns) {
                let { ${refs} } = this.refs,
                    { ${funcs} } = this.funcs,
                    { ${ctxKeys} } = ${ctxCode} || {};
                return (${code})
            }).call(this.__visInstance, this)
        `
        
        if (evtName) {
            let evt = '__evt_' + evtName,
                evtSource = evt + '__source'
            vnode.ctx[evtSource] = setup
            vnode.ctx[evt] = function() {
                try {
                    eval(this[evtSource])
                } catch (ex) {
                    if (this.__triggerError)
                        this.__triggerError('Runtime error', key, code, ex)
                }
            }
            return `this.__ctx.${evt}()`
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
            switch (key) {
                case 'for':
                    let reg = /^\s*(.*?)\s+in\s+(.*?)\s*$/i,
                        matched = reg.exec(val), vars, arrCode
                    if (matched)
                        ({ 1: vars, 2: arrCode } = matched)
                    if (! vars || ! arrCode) {
                        pvnode.splice(pvnode.indexOf(vnode), 1)
                        return
                    }
                    vars = vars.replace(/[\(\)\[\]{}\s]/g, '').split(',')
                    let { 0: keyName, 1: valName, 2: idName } = vars
                    let arr = this.runInContext(vnode, key, arrCode)
                    delete vnode.attrs[oriKey]
                    let i = 0, lastNode = vnode
                    arr.forEach((v, k) => {
                        if (i == 0) {
                            if (keyName)
                                vnode.ctx[keyName] = k
                            if (valName)
                                vnode.ctx[valName] = v
                            if (idName)
                                vnode.ctx[idName] = i
                        } else {
                            let nnode = Util.deepCopy(vnode)
                            nnode.dom = null
                            nnode.ctx = {}
                            let ctx = {}
                            if (keyName)
                                ctx[keyName] = k
                            if (valName)
                                ctx[valName] = v
                            if (idName)
                                ctx[idName] = i
                            nnode = this.render([nnode], ctx)[0]
                            this.insertNode(pvnode, lastNode, nnode)
                            lastNode = nnode
                        }
                        i ++
                    })
                    if (i == 0) {
                        pvnode.splice(pvnode.indexOf(vnode), 1)
                        return
                    }
                    break
                case 'if':
                    
                    break
                case 'else':
                    
                    break
                case 'elseif':
                    
                    break
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
}