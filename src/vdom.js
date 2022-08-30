export default class VDom {
    constructor(ins, relm = document.body) {
        this.insContext = ins
        this.VTree = this.read(relm, true)
    }
    read(relm = document.body, first = false) {
        let tree = []
        let children = Object.assign({}, relm.childNodes)
        for (let k in children) {
            let elm = children[k]
            
            elm.__visInstance = this.insContext
            if (first)
                elm.__firstRead = true
            
            let _attrs = elm.getAttributeNames ? elm.getAttributeNames() : null, attrs = []
            for (let k2 in _attrs) {
                let name = _attrs[k2]
                let val = elm.getAttribute(name)
                let rendered = this.render('attr', [name, val], elm)
                rendered && ([name, val] = rendered)
                if (! attrs[name])
                    attrs[name] = val
            }
            
            let _text = ! elm.tagName ? (elm.__oriText || elm.data) : null,
                text = ! elm.tagName ? elm.data : null
            if (_text && elm.__firstRead && ! elm.__static && elm.parentElement.tagName.toLowerCase() != 'script') {
                text = this.render('text', _text, elm)
                if (! elm.__oriText)
                    elm.__oriText = _text
                if (_text == text)
                    elm.__static = true
            }
            
            tree.push({
                tag: elm.tagName ? elm.tagName.toLowerCase() : null,
                attrs: attrs,
                dom: elm,
                children: this.read(elm, first),
                text: text,
                oriText: _text
            })
        }
        return tree
    }
    render(type, obj, dom) {
        let __data = Object.assign({}, this.insContext.data)
        
        switch (type) {
            case 'text':
                let reg = /{{(.*?)}}/g, matched, res = obj
                while (matched = reg.exec(res)) {
                    let ocode = matched[0], code = matched[1], ccode
                    ccode = this.execExp('common', null, code, dom)
                    res = res.replace(ocode, ccode)
                }
                return res
            case 'attr':
                let [ _name, _val ] = obj
                let val = _val
                
                let tag = _name.substr(0, 1), name = _name.substring(1)
                switch (tag) {
                    case ':':
                        val = this.execExp('common', name, val, dom)
                        break
                    case '@':
                        name = 'on' + name
                        val = this.execExp('evt', name, val, dom)
                        break
                    default:
                        return null
                }
                
                return [name, val]
            default:
                return null
        }
    }
    execExp(type, name, code, dom = null) {
        let __data = Object.assign({}, this.insContext.data), __funcs = Object.assign({}, this.insContext.funcs)
        let data = Object.keys(__data).join(', '), _funcs = Object.keys(__funcs)
        let funcs = _funcs.join(', ')
        let funcs2 = ''
        for (let k in _funcs) {
            let v = _funcs[k]
            funcs2 += `
                ${v} = function(...args) { _this.funcs.${v}.call(_this, ...args) };
            `.replace(/\n/g, '')
        }
        
        let __this = type == 'evt' ? 'this.__visInstance' : 'this.insContext'
        let ccode = `
            (function(_this) {
                let { ${data} } = _this.data;
                let { ${funcs} } = _this.funcs;
                ${funcs2}
                return (${code});
            })(${__this})
        `.replace(/\n/g, '')
        if (type == 'common') {
            try {
                return eval(ccode)
            } catch (ex) {
                throw new Error(`[Vis Error] Expression error: \n` + ex)
            }
        } else if (type == 'evt') {
            dom['__evt_' + name] = function() {
                eval(ccode)
            }
            return `this.__evt_${name}()`
        }
    }
    sync(ntree = null, otree = null) {
        let root = false
        if (! ntree && ! otree) {
            root = true
            ntree = this.read()
            otree = this.VTree
        }
        let entries
        ([ntree, otree, entries] = this.sortVTrees(ntree, otree))
        for (let k in entries) {
            let v1 = ntree[k], v2 = otree[k]
            let pv1 = Object.assign({}, v1), pv2 = Object({}, v2)
            if (pv1) pv1.children = null
            if (pv2) pv2.children = null
            
            this.syncDOM(pv1)
            if (v1 && v2 && v1.children && v2.children)
                this.sync(v1.children, v2.children)
        }
        if (root) {
            this.VTree = ntree
        }
    }
    sortVTrees(tree1, tree2) {
        let keysMap = {}, keysMap2 = {}, res1 = [], res2 = [], entries = {}
        for (let k in tree1) {
            keysMap[k] = null
            for (let k2 in tree2) {
                if (tree1[k].dom === tree2[k2].dom) {
                    keysMap[k] = k2
                    keysMap2[k2] = true
                } else if (typeof keysMap2[k2] != 'boolean') {
                    keysMap2[k2] = false
                }
            }
        }
        for (let k in keysMap) {
            res2.push(tree2[keysMap[k]])
        }
        for (let k in keysMap2) {
            if (keysMap2[k])
                continue
            res1.push(tree2[keysMap2[k]])
        }
        let res = Object.assign(res2, res1)
        for (let i = 0; i < res.length; i ++) {
            entries[i] = true
        }
        return [tree1, res, entries]
    }
    syncDOM(vrow) {
        let oattrNames = vrow.dom.getAttributeNames ? vrow.dom.getAttributeNames() : [], oattrs = []
        for (let k in oattrNames) {
            oattrs[oattrNames[k]] = vrow.dom.getAttribute(oattrNames[k])
        }
        for (let k in vrow.attrs) {
            if (vrow.attrs[k] != oattrs[k]) {
                vrow.dom.setAttribute(k, vrow.attrs[k])
            }
        }
        
        if (! vrow.tag && vrow.text != vrow.dom.data) {
            vrow.dom.data = vrow.text
        }
    }
}