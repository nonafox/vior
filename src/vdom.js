import Util from './util.js'
import Render from './render.js'

export default class VDom {
    constructor(__this) {
        this.__visInstance = __this
        this.__render = new Render(__this)
    }
    mount(elm) {
        this.__mounted = elm
        this.__originTree = this.__currentTree = this.touch(elm)
    }
    unmount() {
        this.__mounted = this.__originTree = this.__currentTree = null
    }
    touch(elm) {
        let tree = []
        let children = Object.assign({}, elm.childNodes)
        for (let k in children) {
            let v = children[k]
            
            let attrNames = v.getAttributeNames ? v.getAttributeNames() : [], attrs = []
            for (let _k2 in attrNames) {
                let k2 = attrNames[_k2], v2 = v.getAttribute(k2)
                attrs[k2] = v2
            }
            
            v.__ctx = {
                __visInstance: this.__visInstance,
                __triggerError: Util.triggerError
            }
            
            tree.push({
                dom: v,
                tag: v.tagName ? v.tagName.toLowerCase() : null,
                type: v.tagName ? 'common' : v.nodeName.substr(1),
                attrs: attrs,
                ctx: v.__ctx,
                text: ! v.tagName ? v.data : null,
                children: this.touch(v) || null,
            })
        }
        return tree
    }
    update() {
        if (! this.__mounted)
            return
        
        let oldTree = this.__currentTree,
            newTree = this.__render.render(this.__originTree)
        this.patch(this.__mounted, oldTree, newTree)
        this.__currentTree = newTree
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
        
        this.patch(onode.dom, onode.children, nnode.children)
    }
    touchNewNode(pdom, otree, onode, ntree, nnode) {
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
        if (onode)
            otree[otree.indexOf(onode)].dom.remove()
        
        for (let k in nnode.children) {
            let v = nnode.children[k]
            this.touchNewNode(dom, null, null, nnode.children, v)
        }
    }
    removeNode(pdom, onode) {
        pdom.removeChild(onode.dom)
    }
    patch(pdom, otree, ntree) {
        for (let k in ntree) {
            let v1 = otree[k],
                v2 = ntree[k]
            
            if (this.isSameNode(v1, v2))
                this.patchSameNode(v1, v2)
            else if (v1 && ! v2)
                this.removeNode(pdom, v1)
            else
                this.touchNewNode(pdom, otree, v1, ntree, v2)
        }
        for (let k in otree) {
            if (otree[k] && ! ntree[k]) {
                this.removeNode(pdom, otree[k])
            }
        }
    }
}