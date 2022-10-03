import Util from './util.js'

export default class TDom {
    isValidName(text) {
        return /^[a-zA-Z0-9\-_\$\@\:]+$/.test(text)
    }
    isQuote(arr, char) {
        return arr[arr.indexOf(char) - 1] != '\\' && (char == `'` || char == `"`)
    }
    isVoidChar(char) {
        return ! char || char == ' ' || char == '\t' || char == '\n' || char == '\r'
    }
    readPath(res, path) {
        let tmp = res
        for (let k in path) {
            let v = path[k]
            tmp = tmp.children[v]
        }
        return tmp
    }
    pushPath(res, path, value) {
        let tmp = res
        for (let k in path) {
            let v = path[k]
            if (path.length - 1 > k)
                tmp = tmp.children[v]
        }
        tmp.children[path[path.length - 1]] = value
    }
    nextSibilingPath(res, path) {
        let tmp = Util.deepCopy(path)
        tmp[path.length ? path.length - 1 : 0] = (path[path.length - 1] || 0) + 1
        return tmp
    }
    nextChildPath(res, path) {
        let tmp = Util.deepCopy(path)
        tmp.push(this.readPath(res, path).children.length)
        return tmp
    }
    nextPath(res, openedPaths, oldPath) {
        if (openedPaths.indexOf(oldPath) < 0)
            return this.nextSibilingPath(res, oldPath)
        else
            return this.nextChildPath(res, oldPath)
    }
    parentPath(res, path) {
        let tmp = Util.deepCopy(path)
        tmp.splice(-1, 1)
        return tmp
    }
    read(src) {
        let arr = src.split('')
        let VNodeTemplate = {
                dom: null,
                tag: null,
                type: 'common',
                attrs: {},
                ctx: {},
                data: {},
                text: null,
                children: []
            },
            res = Util.deepCopy(VNodeTemplate, { type: 'root' }),
            currentPath = [-1], currentVNode = {}, openedPaths = [], status = 'common',
            quoteStarter = null, quoteText = '', quoteAvailable = false, tagStatus = false,
            isEndTag = false, isSelfClosingTag = false, currentTag = '', currentAttrsRaw = '',
            currentAttrs = {}, isTagRead = false, isComment = false, commentText = ''
        
        for (let k = 0; k < arr.length; k ++) {
            let v = arr[k]
            
            if (status == 'common') {
                if (! isComment) {
                    if (tagStatus) {
                        if (! isTagRead && this.isValidName(v)) {
                            currentTag += v
                        } else if (! isTagRead && ! this.isValidName(v) && currentTag) {
                            isTagRead = true
                            currentVNode.tag = currentTag
                            if (currentTag == 'void')
                                currentVNode.type = 'void'
                            
                            isSelfClosingTag = Util.selfClosingTags.indexOf(currentTag) >= 0
                            if (isSelfClosingTag)
                                openedPaths.splice(openedPaths.indexOf(currentPath), 1)
                        } else if (isTagRead && (this.isValidName(v) || this.isQuote(arr, v))) {
                            if (this.isQuote(arr, v)) {
                                quoteStarter = v
                                status = 'quote'
                            } else if (v != '=') {
                                currentAttrsRaw += v
                            }
                        }
                        if (! isEndTag && v == '>' && quoteAvailable) {
                            currentAttrs[currentAttrsRaw] = quoteText || ''
                            quoteText = currentAttrsRaw = ''
                            quoteAvailable = false
                        }
                        if (! isEndTag && (this.isVoidChar(v) || v == '>') && quoteAvailable) {
                            currentAttrs[currentAttrsRaw] = quoteText || ''
                            quoteText = currentAttrsRaw = ''
                            quoteAvailable = false
                        } else if (! isEndTag && (this.isVoidChar(v) || v == '>') && currentAttrsRaw) {
                            currentAttrs[currentAttrsRaw] = ''
                            quoteText = currentAttrsRaw = ''
                            quoteAvailable = false
                        }
                    }
                    if (v == '<') {
                        if (src.substr(k, `<!--`.length) == `<!--`) {
                            isComment = true
                            commentText = ''
                            k += `<!--`.length - 1
                            continue
                        }
                        
                        if (arr[k + 1] == '/') {
                            tagStatus = true
                            isEndTag = true
                            let path = openedPaths[openedPaths.length - 1]
                            let tag = this.readPath(res, path).tag
                            if (tag + '>' == src.substr(k + 2, tag.length + 1))
                                openedPaths.splice(-1, 1)
                            else
                                return `Find unexpected ending tag.`
                            currentPath = path
                            currentVNode = this.readPath(res, path)
                        } else {
                            tagStatus = true
                            currentTag = currentAttrsRaw = ''
                            currentAttrs = {}
                            isTagRead = false
                            currentPath = this.nextPath(res, openedPaths, currentPath)
                            currentVNode = Util.deepCopy(VNodeTemplate)
                            openedPaths.push(currentPath)
                            this.pushPath(res, currentPath, currentVNode)
                        }
                    } else if (v == '>') {
                        if (! isEndTag && Util.realLength(currentAttrs))
                            currentVNode.attrs = currentAttrs
                        
                        tagStatus = false
                        isEndTag = false
                        isSelfClosingTag = false
                    } else if (! tagStatus) {
                        let lastNode = this.readPath(res, currentPath) || {}
                        if (! lastNode.tag && lastNode.type == 'text') {
                            currentVNode.text += v
                            this.pushPath(res, currentPath, currentVNode)
                        } else {
                            currentPath = this.nextPath(res, openedPaths, currentPath)
                            currentVNode = Util.deepCopy(VNodeTemplate, { type: 'text', text: v })
                            this.pushPath(res, currentPath, currentVNode)
                        }
                    }
                } else if (src.substr(k, `-->`.length) == `-->`) {
                    currentPath = this.nextPath(res, openedPaths, currentPath)
                    currentVNode = Util.deepCopy(VNodeTemplate, { type: 'comment', text: commentText })
                    this.pushPath(res, currentPath, currentVNode)
                    isComment = false
                    commentText = ''
                    k += `-->`.length - 1
                } else {
                    commentText += v
                }
            } else if (status == 'quote') {
                quoteAvailable = true
                if (v == quoteStarter) {
                    quoteStarter = null
                    status = 'common'
                    continue
                }
                quoteText += v
            }
        }
        
        if (openedPaths.length || status != 'common')
            return `Node tags tree is not valid, maybe there are some unclosed tags.`
        
        return res
    }
    patch(tree) {
        if (! Array.isArray(tree))
            return this.patch(tree.children)
        
        let res = ''
        for (let k in tree) {
            let v = tree[k],
                singleTag = Util.selfClosingTags.indexOf(v.tag) >= 0
            
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
}