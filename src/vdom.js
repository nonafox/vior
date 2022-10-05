import Util from './util.js'
import TDom from './tdom.js'

export default class VDom {
    constructor() {
        this.tdom = new TDom()
    }
    getElementType(dom) {
        if (dom.tagName && dom.tagName.toLowerCase() == 'void')
            return 'void'
        if (dom.tagName)
            return 'common'
        return dom.nodeName.substr(1)
    }
    readFromText(text) {
        let res = this.tdom.read(text)
        if (typeof res == 'string')
            Util.triggerError('Render error', null, null, '(HTML read error)')
        return res
    }
    read(dom) {
        let res = this.readFromText(dom.innerHTML)
        res.dom = dom
        dom.innerHTML = ''
        return res
    }
    isSameNode(vnode1, vnode2) {
        if (! vnode1 || ! vnode2)
            return false
        if (! vnode1.dom && ! vnode2.dom)
            return false
        
        if (vnode1.tag != vnode2.tag || vnode1.type != vnode2.type)
            return false
        if (vnode1.tag == 'input' && vnode1.attrs.type != vnode2.attrs.type)
            return false
        if (vnode1.attrs.key != vnode2.attrs.key)
            return false
        
        return true
    }
    moveNode(pdom, ldl, otree, onode, ntree, nnode) {
        let oid = otree.indexOf(onode),
            nid = ntree.indexOf(nnode),
            sdom = ntree[nid - 1],
            edom = ntree[nid + 1]
        sdom = sdom ? sdom.dom : null
        edom = edom ? edom.dom : null
        sdom = ldl.indexOf(sdom) >= 0 && sdom
        edom = ldl.indexOf(edom) >= 0 && edom
        
        if (! sdom && ! edom) {
            if (ldl.indexOf(nnode.dom) === 0)
                return
            pdom.insertBefore(nnode.dom, null)
            
            if (ldl.indexOf(nnode.dom) >= 0)
                ldl.splice(ldl.indexOf(nnode.dom), 1)
            ldl.push(nnode.dom)
            return
        }
        if (sdom) {
            if (ldl[ldl.indexOf(sdom) + 1] === nnode.dom)
                return
            pdom.insertBefore(nnode.dom, ldl[ldl.indexOf(sdom) + 1])
            
            if (ldl.indexOf(nnode.dom) >= 0)
                ldl.splice(ldl.indexOf(nnode.dom), 1)
            if (ldl[ldl.indexOf(sdom) + 1])
                ldl.splice(ldl.indexOf(sdom) + 1, 0, nnode.dom)
            else
                ldl.push(nnode.dom)
            return
        }
        if (edom) {
            if (ldl[ldl.indexOf(edom) - 1] === nnode.dom)
                return
            pdom.insertBefore(nnode.dom, edom)
            
            if (ldl.indexOf(nnode.dom) >= 0)
                ldl.splice(ldl.indexOf(nnode.dom), 1)
            ldl.splice(ldl.indexOf(edom), 0, nnode.dom)
            return
        }
    }
    patchSameNode(pdom, ldl, otree, onode, ntree, nnode) {
        for (let k in nnode.attrs) {
            let v1 = onode.attrs[k],
                v2 = nnode.attrs[k]
            if (v1 != v2 && ! (v2 === null || v2 === false || typeof v2 == 'undefined'))
                onode.dom.setAttribute(k, v2)
        }
        for (let k in onode.attrs) {
            let v1 = onode.attrs[k],
                v2 = nnode.attrs[k]
            if (v1 && (v2 === null || v2 === false || typeof v2 == 'undefined'))
                onode.dom.removeAttribute(k)
        }
        for (let k in nnode.data) {
            let v1 = onode.data[k],
                v2 = nnode.data[k]
            let isFunc = typeof v1 == typeof v2 && typeof v1 == 'function'
            if (isFunc ? v1.toString() != v2.toString() : ! Util.deepCompare(v1, v2))
                onode.dom[k] = v2
        }
        for (let k in onode.data) {
            let v1 = onode.data[k],
                v2 = nnode.data[k]
            if (v1 && (v2 === null || typeof v2 == 'undefined'))
                delete onode.dom[k]
        }
        if (! Util.deepCompare(onode.ctx, nnode.ctx))
            onode.dom.__viorCtx = nnode.ctx
        if (! nnode.tag && onode.text != nnode.text)
            onode.dom.data = nnode.text
        nnode.dom = onode.dom
        
        if (! nnode.dom)
            return
        
        this.moveNode(pdom, ldl, otree, onode, ntree, nnode)
        this.patch(onode, nnode, false)
    }
    newNode(pdom, ldl, otree, ntree, nnode) {
        let dom = nnode.tag ? document.createElement(nnode.tag) : (
            nnode.type == 'text' ? document.createTextNode(nnode.text) : document.createComment(nnode.text)
        )
        for (let k in nnode.attrs) {
            let v = nnode.attrs[k]
            if (! (v === null || v === false || typeof v == 'undefined'))
                dom.setAttribute(k, v)
        }
        for (let k in nnode.data) {
            let v = nnode.data[k]
            dom[k] = v
        }
        dom.__viorCtx = nnode.ctx
        nnode.dom = dom
        this.moveNode(pdom, ldl, otree, null, ntree, nnode)
        
        if (! nnode.html) {
            for (let k in nnode.children) {
                let v = nnode.children[k]
                this.newNode(dom, [], [], nnode.children, v)
            }
        }
    }
    removeNode(pdom, ldl, onode) {
        pdom.removeChild(onode.dom)
        ldl.splice(ldl.indexOf(onode.dom), 1)
        onode.dom = null
    }
    patchDoit(pdom, ldl, otree, onode, ntree, nnode) {
        if (! this.isSameNode(onode, nnode))
            return false
        if (onode.patched)
            return false
        
        this.patchSameNode(pdom, ldl, otree, onode, ntree, nnode)
        onode.patched = true
        
        return true
    }
    patch(onode, nnode, firstPatch = true) {
        let otree = onode.children,
            ntree = nnode.children,
            pdom = onode.dom,
            ldl = []
        for (let k in otree) {
            let v = otree[k]
            ldl.push(v.dom)
        }
        let s1i = 0, s2i = 0, e1i = otree.length - 1, e2i = ntree.length - 1
        while (s2i <= e2i) {
            let s1e = otree[s1i], s2e = ntree[s2i],
                e1e = otree[e1i], e2e = ntree[e2i]
            
            if (this.patchDoit(pdom, ldl, otree, s1e, ntree, s2e)) {
                s1i ++
                s2i ++
                continue
            }
            if (this.patchDoit(pdom, ldl, otree, e1e, ntree, e2e)) {
                e1i --
                e2i --
                continue
            }
            if (this.patchDoit(pdom, ldl, otree, s1e, ntree, e2e)) {
                s1i ++
                e2i --
                continue
            }
            if (this.patchDoit(pdom, ldl, otree, e1e, ntree, s2e)) {
                e1i --
                s2i ++
                continue
            }
            
            let breakIt = false
            for (let k = 0; k < otree.length; k ++) {
                let v = otree[k]
                if (! v.patched && this.patchDoit(pdom, ldl, otree, v, ntree, s2e)) {
                    s2i ++
                    breakIt = true
                    break
                }
            }
            if (breakIt)
                continue
            
            this.newNode(pdom, ldl, otree, ntree, s2e)
            s2i ++
        }
        
        for (let k in otree) {
            let v = otree[k]
            if (! v.patched && v.dom)
                this.removeNode(pdom, ldl, v)
        }
    }
    patchFromText(tree) {
        return this.tdom.patch(tree)
    }
}