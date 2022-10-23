import Vior from './index.js'
import Util from './util.js'

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
        res = Util.scriptReg(res, reg, 'let$1')
        let vars = matched[1].split(',')
        for (let k in vars) {
            let v = vars[k].replace(/\s+/g, '')
            vars[k] = v
            if (! v) {
                delete vars[k]
                continue
            }
            
            let nreg = new RegExp(`(${v})\\s*=\\s*`, 'mg'),
                nrep = '$1 = __opts.vars.$1 = '
            res = Util.scriptReg(res, nreg, nrep)
        }
        
        let reg2 = /^\s*function:([a-zA-Z0-9\$_,\s]+);*\s*$/m
        let matched2 = Util.scriptReg(res, reg2)[0]
        if (! matched2)
            matched2 = ['', '']
        res = Util.scriptReg(res, reg2, '')
        let funcs = matched2[1].split(','), funcsHandler = ''
        for (let k in funcs) {
            let v = funcs[k].replace(/\s+/g, '')
            funcs[k] = v
            if (! v) {
                delete funcs[k]
                continue
            }
            
            funcsHandler += `try { __opts.funcs.${v} = ${v} } catch (ex) {}\n`
        }
        
        let _res = `
            let __opts = {
                vars: {},
                funcs: {},
                hooks: {},
                watchers: {},
                comps: {},
                plugins: []
            }
            let $hook = (name, func) => __opts.hooks[name] = func,
                $watch = (name, func) => __opts.watchers[name] = func,
                $comp = (name, obj) => __opts.comps[name] = obj,
                $plugin = (name, obj) => __opts.plugins[name] = obj
            
            ${res}
            
            let __vars = __opts.vars
            __opts.vars = function () {
                return __vars
            }
            ${funcsHandler}
            return __opts
        `
        let ctor = Object.getPrototypeOf(async function() {}).constructor
        res = await new ctor(_res)()
        return res
    }
}