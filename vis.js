let visDepContext
function createDepContext(func, insContext) {
    visDepContext = func
    func.call(insContext)
    visDepContext = null
}
window.Dep = class Dep {
    constructor(insContext) {
        this.depList = []
        this.insContext = insContext
    }
    add() {
        if (visDepContext)
            this.depList.push(visDepContext)
    }
    notify() {
        for (let k in this.depList) {
            let v = this.depList[k]
            v.call(this.insContext)
        }
    }
}
function ref(obj, insContext) {
    for (let k in obj) {
        let v = obj[k], dep = new Dep(insContext)
        Object.defineProperty(obj, k, {
            get () {
                dep.add()
                return v
            },
            set (val) {
                let isChanged = (v !== val)
                v = val
                if (isChanged) {
                    dep.notify()
                }
            }
        })
    }
    return obj
}

/*
  the structure of Vis instance constructor options:
  {
      data: () => {}, // should returns an object
      onMounted: (ins) => {}
  }
  */
window.Vis = class Vis {
    constructor(opts) {
        if (window.__isVisAvailable) {
            throw new Error(`Vis instance is already available! You can only create one Vis instance in one document, and Vis will mount to <body></body> automatic.`)
        }
        window.__isVisAvailable = true
        window.__visInstance = this
        
        this.data = ref(opts.data ? opts.data() : {}, this)
        createDepContext(this.render, this)
        opts.onMounted && opts.onMounted(this)
    }
    render() {
        let elms = Object.assign({}, document.getElementsByTagName('vis'))
        for (let k in elms) {
            let v = elms[k]
            let env = ''
            for (let k2 in this.data) {
                let v2 = this.data[k2]
                let vname = k2, vval = '__this.data.' + k2
                env += `; let ${vname} = ${vval}`
            }
            let rval = v.getAttribute(':')
            let oval = v.innerHTML, nval = eval(`let __this = this ;(function() { ${env}; return ${rval} })()`)
            if (oval != nval) {
                v.innerHTML = nval
            }
        }
    }
}