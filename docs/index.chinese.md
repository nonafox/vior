# 开始之前
我只是个初三学生，而且我还寄宿，没有那么多时间来写文档。为了让其他人理解Vior实现的功能，我临时地写了一个基于大量实例的文档。让我们开始吧！

如果你问我为啥中文文档有点怪怪的——我只是像[@尤大](https://github.com/yyx990803)一样，先写英文文档，再“翻译”成中文，所以……

# 响应性基础
这是一个很简单的计数器实例：
```html
<div id="app">
    <!--
        - '@click' 是一个基于Vior的DOM事件
        - ':disabled' 是一个基于Vior的DOM attribute
        -->
    <button @click="count ++" :disabled="count >= 10">
        Count:
        <!-- ↓ 这是一个基于Vior的DOM模板 -->
        {{ count }}
    </button>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    refs() {
        return {
            count: 0
        }
    }
}).mount(document.getElementById('app'))
```
这个实例展示了Vior的核心功能——如你所见，这与Vue完全一样！

唯一的区别在于`refs` option。它的期望值是一个具有Array或Object返回值的函数，你可以在这个返回值中定义Vior的响应式变量。**然后你就可以在“任意”地方（如HTML部分中基于Vior的事件、attributes、模板，以及JS部分中Vior的各个options等）使用它们。**

Vior还提供了一些特殊的内部变量：
- `$args`：保存当前原生DOM事件的参数数组，一般情况下数组第一个成员为原生的DOM事件对象。只能在Vior的DOM事件中使用。

# 函数
这是计时器实例的另一个版本：
```html
<div id="app">
    <button @click="increase()" :disabled="count >= 10">
        Count: {{ count }}
    </button>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    refs() {
        return {
            count: 0
        }
    },
    funcs: {
        increase() {
            // 多此一举，只是为了演示Vior的一些功能……
            this.funcs.doit()
        },
        doit() {
            this.refs.count ++
        }
    }
}).mount(document.getElementById('app'))
```
效果和第一个一样。我们只是把增加计数的逻辑放到了一个JS函数里。

像这样，你可以在`funcs` option里添加一些函数，然后可以在“任意”地方调用它们。**注意！在Vior的JS部分（options）中，调用响应性变量和函数的方式与HTML部分的直接调用不同，你需要这么干：**

- 使用Vior响应性变量：`this.refs.xxx`
- 使用Vior函数：`this.funcs.xxx`

# 命令
这是一个简单的TODO列表实例：
```html
<div id="app">
    <h1>TODO list</h1>
    <hr/>
    <ul>
        <li $for="(k, v) in list">
            {{ k + 1 }}: {{ v }}
            <button @click="del(k)">删除</button>
        </li>
    </ul>
    <div $if="list.length">有代办项没完成哦~</div>
    <div $else>啥事没有！</div>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    refs() {
        return {
            list: ['周五放学', '做作业', '练琴', '开始编程！']
        }
    },
    funcs: {
        add() {
            this.refs.list.push(refs.inputVal)
            this.refs.inputVal = ''
        },
        del(id) {
            this.refs.list.splice(id, 1)
        }
    }
}).mount(document.getElementById('app'))
```
这个实例演示了Vior中常用的命令。Vior支持的所有命令如下：

- `$for="(key, value) in array"`: 遍历数组或对象
- `$if="condition"`: 控制元素是否显示
- `$else`, `$elseif="condition"`: 顾名思义~
- `$html="expression"`: **这是个危险命令！** 把表达式的值直接显示为纯HTML（就跟设置`DOM.innerHTML`一样），不做XSS过滤。

# 双向绑定值（TBV）
一个简单但又不完全简单的实例：
```html
<div id="app">
    <input @input::value="inputValue" @input="console.log('oninput!')"/>
    You input: {{ inputValue }}
</div>
```
```javascript
let viorIns = new Vior({
    refs() {
        inputValue: 'default value'
    }
})
```
如你所见，`<input/>`元素的`value` property的值，和响应性变量`inputValue`的值绑定了。这就是TBV！

TBV是基于Vior的DOM事件的，你像这样可以定义TBV：
```
@事件名::property名="响应式变量名"
```
TBV会做的是：**当名为`事件名`的DOM事件触发时，把名为`property名`的DOM property的值同步到名为`响应式变量名`的响应性变量的值；当然，当绑定的响应式变量更改时，DOM property也会随之更改。**

这么说可能有点拗口，但是其实不难理解。毕竟这种形式的双向绑定功能可能是我首创的！

# 生命周期钩子
这有一个没有意义的实例：
```js
let viorIns = new Vior({
    hooks: {
        created() {
            console.log('Vior实例创建了！')
        },
        mounted() {
            console.log('Vior实例挂载到了真实DOM！')
        },
        unmounted() {
            console.log('Vior实例取消挂载！')
        }
    }
})
```
这个实例展示了Vior中所有的生命周期钩子。顾名思义，Vior会在对应的生命周期阶段调用对应的钩子。

定义生命周期钩子函数很简单，你只需要在`hooks` option里添加指定名称的函数即可！

# 监听器
这又是一个没用的实例：
```javascript
let viorIns = new Vior({
    refs() {
        text: 'hello, world'
    },
    hooks: {
        created() {
            // 每秒改动一次响应性变量'text'的值
            setInterval(function() {
                this.refs.text = this.refs.text.split('').reverse().join('')
            }, 1000)
        }
    },
    watchers: {
        text() {
            console.log('响应性变量变量 text 改变了！')
        }
    }
})
```
在这个实例中，当响应性变量`text`被更改时，同名的监听器`text`会被触发，并执行`console.log(...)`。

像这样，你可以在`watchers` option添加与响应性变量同名的函数，于是就能达到上述效果了。

# 动态变量
这是一个差不多完整的TODO列表实例：
```html
<div id="app">
    <h1>TODO list</h1>
    <hr/>
    <ul>
        <li $for="(k, v) in list">
            {{ k + 1 }}: {{ v }}
            <button @click="del(k)">删除</button>
        </li>
    </ul>
    <div $if="total" $html="total"></div>
    <div $else>啥事没有~/div>
    <br/>
    <input @input::value="inputVal" @input="console.log('input: ', $args[0].data)" placeholder="请输入新的待办事项……"/>
    <button @click="add()" :disabled="! inputVal">添加</button>
    <hr/>
    <h3>Powered by Vior</h3>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let refs, funcs
let viorIns = new Vior({
    refs() {
        return {
            list: ['周五放学', '做作业', '练琴', '开始编程！'],
            inputVal: '',
            total() {
                let text = this.refs.list.join(', ')
                if (text)
                    return '<strong>待办事项合计：</strong>' + text
                else
                    return null
            }
        }
    },
    hooks: {
        created() {
            refs = this.refs
            funcs = this.funcs
        }
    },
    funcs: {
        add() {
            refs.list.push(refs.inputVal)
            refs.inputVal = ''
        },
        del(id) {
            refs.list.splice(id, 1)
        }
    }
}).mount(document.getElementById('app'))
```
别看代码这么长，其实很简单，只是综合了我们之前讲过的功能，当然也有一点新的东西。

看到`refs` option中的响应性变量`total`，它与其他的变量不同，它被赋值为一个函数，而Vior会将其视作为一个“动态变量”——它和普通的响应性变量一样，但是它的真实值来自于初始值函数的返回值。最牛逼的是，当函数内引用的响应式变量发生改变，动态变量的真实值也会自动变更！也就是说，动态变量的值“永远”等于初始函数的返回值，即使初始函数的返回值会变更。

但是有一点例外。**Vior只会监听响应性变量的值，其他值变更（如`Date.now()`）不会触发动态变量的真实值更新。**这是因为Vior采用和Vue一样的——依赖追踪技术。

**关于动态变量与普通函数的区别：很简单。在惰性的Vior DOM attribute中，Vior可以追踪到动态变量的值变更，但是不能追踪到普通函数的可能存在的值变更。以至于如果Vior DOM attribute的值是一个函数的返回值，那么这个attribute的值永远不会变更，但是选用动态变量则反之。所以如果你需要“完全”同步的动态计算逻辑，选动态变量吧！**

# 写在最后
如你所见，Vior就是一个自制的Vue副本！但是我写来只是为了锻炼技术，Vior不适用于生产环境。所以不要作死把Vior用作生产！