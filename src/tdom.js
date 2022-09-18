import Util from './util.js'

export default class TDom {
    constructor(vdom) {
        this.vdom = vdom
    }
    read(text) {
        let parser = new DOMParser()
        let _root = parser.parseFromString(text, 'text/html'),
            root = _root.childNodes[0].childNodes[1]
        let res = this.vdom.read(root, true, true)
        return res
    }
    patch(tree) {
        if (! Array.isArray(tree))
            return this.patch(tree.children)
        
        let res = ''
        for (let k in tree) {
            let v = tree[k],
                singleTag = Util.singleTags.indexOf(v.tag) >= 0
            
            if (v.tag) {
                let children = v.children.length ? this.patch(v.children) : '',
                    attrs = ''
                for (let k2 in v.attrs) {
                    let v2 = v.attrs[k2] + ''
                    v2 = v2.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
                    attrs += ` ${k2}="${v2}"`
                }
                res += `<${v.tag}${attrs}${singleTag ? '/' : ''}>${children}${singleTag ? '' : `</${v.tag}>`}`
            } else if (v.type == 'text') {
                res += v.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(\s|&nbsp;)+/g, ' ')
                             .replace(/'/g, '&#39;').replace(/"/g, '&quot;')
            } else if (v.type == 'comment') {
                res += `<!--${v.text}-->`
            }
        }
        return res
    }
    get() {
        return this.currentTree
    }
}