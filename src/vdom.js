import Util from './util.js'
import Render from './render.js'

export default class VDom {
    constructor(__this) {
        this.__visInstance = __this
        this.__render = new Render(__this)
    }
    mount(dom) {
        this.__mounted = dom
        this.__originTree = this.__currentTree = this.read(dom)
    }
    unmount() {
        this.__mounted = this.__originTree = this.__currentTree = null
    }
    read(dom, firstRead = true) {
        let tree = []
        let children = ! firstRead ? Object.assign({}, dom.childNodes) : [dom]
        for (let k in children) {
            let v = children[k]
            
            let attrNames = v.getAttributeNames ? v.getAttributeNames() : [], attrs = []
            for (let _k2 in attrNames) {
                let k2 = attrNames[_k2], v2 = v.getAttribute(k2)
                attrs[k2] = v2
            }
            
            tree.push({
                dom: v,
                tag: v.tagName ? v.tagName.toLowerCase() : null,
                type: firstRead ? 'root' : (v.tagName ? 'common' : v.nodeName.substr(1)),
                attrs: attrs,
                ctx: {},
                text: ! v.tagName ? v.data : null,
                children: this.read(v, false) || null
            })
        }
        
        return ! firstRead ? tree : tree[0]
    }
    isSameNode(vnode1, vnode2) {
        if (! vnode1 || ! vnode2)
            return false
        
        if (vnode1.tag != vnode2.tag || vnode1.type != vnode2.type)
            return false
        if (vnode1.tag == 'input' && vnode1.attrs.type != vnode2.attrs.type)
            return false
        if (vnode1.attrs.key != vnode2.attrs.key)
            return false
        
        return true
    }
    patchSameNode(onode, nnode) {
        for (let k in nnode.attrs) {
            let v = nnode.attrs[k]
            if (onode.attrs[k] != v)
                onode.dom.setAttribute(k, v)
        }
        if (! Util.deepCompare(onode.ctx, nnode.ctx))
            onode.dom.__ctx = nnode.ctx
        if (! nnode.tag && onode.text != nnode.text)
            onode.dom.data = nnode.text
        
        nnode.dom = onode.dom
        
        this.patch(onode.dom, onode, nnode)
    }
    newNode(pdom, otree, onode, ntree, nnode) {
        let dom = nnode.tag ? document.createElement(nnode.tag) : document.createTextNode(nnode.text)
        for (let k in nnode.attrs) {
            let v = nnode.attrs[k]
            dom.setAttribute(k, v)
        }
        dom.__ctx = nnode.ctx
        
        let ndom = onode && otree[otree.indexOf(onode) + 1]
        ndom = ndom ? ndom.dom : null
        if (ndom)
            pdom.insertBefore(dom, ndom)
        else
            pdom.appendChild(dom)
        
        nnode.dom = dom
        if (onode) {
            otree[otree.indexOf(onode)].dom.parentNode.removeChild(otree[otree.indexOf(onode)].dom)
            otree[otree.indexOf(onode)].dom = null
        }
        
        for (let k in nnode.children) {
            let v = nnode.children[k]
            this.newNode(dom, null, null, nnode.children, v)
        }
    }
    removeNode(pdom, onode) {
        pdom.removeChild(onode.dom)
        onode.dom = null
    }
    patch(pdom, onode, nnode) {
        let otree = onode.children,
            ntree = nnode.children
        for (let k in ntree) {
            let v1 = otree[k],
                v2 = ntree[k]
            
            if (this.isSameNode(v1, v2))
                this.patchSameNode(v1, v2)
            else if (v1 && ! v2)
                this.removeNode(pdom, v1)
            else
                this.newNode(pdom, otree, v1, ntree, v2)
        }
        for (let k in otree) {
            if (otree[k] && ! ntree[k]) {
                this.removeNode(pdom, otree[k])
            }
        }
    }
    update() {
        if (! this.__mounted)
            return
        
        let oldTree = this.__currentTree,
            newTree = this.__render.render(this.__originTree)
        this.patch(this.__mounted, oldTree, newTree)
        this.__currentTree = newTree
    }
}