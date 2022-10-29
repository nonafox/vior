import Vior from './index.js'
import Util from './util.js'
import Dep from './dep.js'

export default class Setup {
    async compile(code) {
        let res = code
        
        let rega = /import\s+({[a-zA-Z0-9\$_,:\s]+?})\s+from\s+'(.*?)'/g
        res = Util.scriptReg(res, rega, `let $1 = await import('$2')`)
        let regb = /import\s+([a-zA-Z0-9\$_]+?)\s+from\s+'(.*?)'/g
        res = Util.scriptReg(res, regb, `let $1 = (await import('$2')).default`)
        
        let reg = /^\s*var:([a-zA-Z0-9\$_,\s]+);*\s*$/m
        let matched = Util.scriptReg(res, reg)[0]
        if (! matched)
            matched = ['', '']
        let vars = matched[1].split(','), syncVarsSetup = ''
        for (let k in vars) {
            let v = vars[k].replace(/\s+/g, '')
            vars[k] = v
            if (! v) {
                delete vars[k]
                continue
            }
            
            syncVarsSetup += `if (__dynamicVars.indexOf(\`${v}\`) < 0) { $this.vars.${v} = ${v}; ${v} = $this.vars.${v} } `
        }
        res = Util.scriptReg(res, reg, `let$1, __syncVars = () => { ${syncVarsSetup} }`)
        
        let reg2 = /^\s*function:([a-zA-Z0-9\$_,\s]+);*\s*$/m
        let matched2 = Util.scriptReg(res, reg2)[0]
        if (! matched2)
            matched2 = ['', '']
        let funcs = matched2[1].split(','), funcsHandlerSetup = ''
        for (let k in funcs) {
            let v = funcs[k].replace(/\s+/g, '')
            funcs[k] = v
            if (! v) {
                delete funcs[k]
                continue
            }
            
            funcsHandlerSetup += `
                try {
                    $this.funcs.${v} = (...args) => {
                        let res = ${v}.call($this, ...args)
                        __syncVars()
                        return res
                    }
                } catch (ex) {}
            `
        }
        res = Util.scriptReg(res, reg2, '')
        
        let _res = `
            let $this = new Vior(), $parent, $children,
                $triggerEvent = $this.$triggerEvent
            $this.hooks.$familyChanged = [function () {
                $parent = $this.$parent
                $children = $this.$children
            }]
            let __dynamicVars = []
            let $hook = (name, func) => {
                    if (name == 'created')
                        Util.triggerError('Initialize error', '(inner) setup', null, '(inner) can not use \`created\` hook in setup mode.')
                    $this.hooks[name].push(func)
                },
                $watch = (name, func) => {
                    Dep.createDepContext($this, function () {
                        void this.vars[name]
                        func.call(this)
                        __syncVars()
                    }, name)
                },
                $dynamicVar = (name, func, deps = null) => {
                    __dynamicVars.push(name)
                    __syncVars()
                    
                    let voidSetup = ''
                    if (! deps)
                        deps = Object.keys($this.vars)
                    for (let k in deps) {
                        let v = deps[k]
                        voidSetup += \`void this.vars.\${v}; \`
                    }
                    let code = \`
                        Dep.createDepContext($this, function () {
                            \${voidSetup}
                            this.vars.\${name} = func.call($this)
                            \${name} = () => { __syncVars(); return func.call($this) }
                        })
                    \`
                    eval(code)
                }
            
            ${res}
            
            __syncVars()
            ${funcsHandlerSetup}
            return $this
        `
        let ctor = Object.getPrototypeOf(async function() {}).constructor
        try { res = await new ctor('Vior', 'Util', 'Dep', _res)(Vior, Util, Dep) } catch (ex) {
            return '' + ex
        }
        return res
    }
}