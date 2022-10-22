# 开始之前
正如我所说，Vior只是一个娱乐项目，初衷是锻炼我的技术能力。Vior的思路跟Vue的几乎一模一样，很多功能都跟Vue雷同，但Vior又有所创新。

目前我专注于性能、新功能的优化与更新，没有那么多的时间精力完善文档，所以我只能临时做一个以示例为基础的“文档”。

# 响应性基础
```html
<div id="app">
    <!-- 按钮上三个属性分别是DOM事件、DOM attribute、DOM property。具体形式为：
         DOM事件:        @eventName="code" // eventName不需要有'on'前缀
         DOM attribute:  :attributeName="code" -->
    <button id="test" @click="count ++" :disabled="count >= 10">+</button>
    <br/>
    <!-- 用于显示变量值的DOM模板，形如 {{ xxx }} -->
    计数: {{ count }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    // 定义响应性变量的方式——vars选项
    // vars选项应为一个返回值为对象的函数。对象中的键值对表示响应性变量的变量名、初始值。
    vars() {
        return {
            count: 0
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-reactionbasic-cfnleh)

# 类 / 样式处理
```html
<div id="app">
    <!-- Vior会对类、样式的DOM attribute作特殊处理。 -->
    
    <!-- 下面这个例子中，class将被解析为 class="aaa ccc" -->
    <div :class="{ aaa: true, bbb: false, ccc: 1 }"></div>
    <!-- 这个例子效果同上 -->
    <div :class="[{ aaa: true, bbb: false }, { ccc: true }]"></div>
    
    <!-- 这里style的解析结果为：style="width: 100px; height: calc(100vh - 10px); --test-var: 'string value';" -->
    <div :style="{ width: 100, height: 'calc(100vh - 10px)', '--test-var': `'string value'` }"></div>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'
let viorIns = new Vior({}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-classtyle-u5ix1d)

# 函数
```html
<div id="app">
    <!-- 重写一下第一个计数器例子，这里我们用Vior函数来使DOM部分更简洁好看 -->
    <button @click="increase()" :disabled="count >= 10">+</button>
    <br/>
    计数: {{ count }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            count: 0
        }
    },
    // 定义函数的方式——funcs选项
    // 在各个Vior选项的上下文——例如函数中，需要用 this.vars.xxx 这样的形式使用响应式变量。相应地， this.funcs.xxx 用于调用其他函数
    funcs: {
        increase() {
            this.funcs.anotherFunction()
        },
        anotherFunction() {
            this.vars.count ++
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-function-w50ucn)

# 指令
```html
<div id="app">
    <button @click="add()">添加</button>
    <ul>
        <!-- 以 $ 开头的属性都是Vior的DOM指令。Vior中所有指令如下： 
             $for="(key, value) in array" 顾名思义，遍历数组或对象
             $if="condition"              根据条件控制元素是否显示
             $else                        顾名思义，意为 否则，搭配 $if 使用
             $elseif="condition"          顾名思义，意为 否则如果，搭配 $if 使用
             $html="code"                 直接控制DOM的innerHTML，绕开Vior的XSS防护。注意：此指令不可用 ::innerHTML 替代！！！
             $is="code"                   控制元素的标签名，支持camelCase和html-case
             $value="code"                实现表单双向绑定的指令。参见后面部分文档
             $ref="code"                  实现实例引用的指令。参见后面部分文档
             $ownstyle                    标记组件中的style标签使用私有模式。参见后面部分文档
             -->
        <li $for="(key, value) in arr">
            <span $if="key % 2 === 0">Id: {{ value }}</span>
            <template $else $is="(key + 1) % 3 === 0 ? 'strong' : 'i'">我们不显示偶数值哦~</template>
        </li>
    </ul>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            arr: []
        }
    },
    funcs: {
        add() {
            this.vars.arr.push(this.vars.arr.length + 1)
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-command-z36oyk)

# 自定义组件
```html
<div id="app">
    <button @click="add()">添加</button>
    <ul>
        <!-- 这个奇怪的元素即是自定义组件。 -->
        <custom-li $for="(k, v) in arr" :key="k" :value="v" @clicknotice="alert($args[0])">
            <!-- 可以通过 <slot-provider name="slotName"></...> 将插槽内容传给组件，组件对其的处理见下。也可以不加该标签，直接向inner添加元素，这样Vior默认会将其标记为名为default的插槽。支持多个插槽，也支持 inner + <slot-provider></...> 结合的方式 -->
            <!-- 注意！自定义组件的attributes、slots将在自定义组件的父组件上下文中运行 -->
            <slot-provider name="invisibleNotice">
                <strong>我们只显示偶数值哦~</strong>
            </slot-provider>
        </custom-li>
    </ul>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let CustomLiComponent = {
    html: `
        <li>
            <!-- 使用 $ownstyle 指令启用私有style模式。下面设置的样式只在本组件有效。 -->
            <style $ownstyle>
                * {
                    color: blue
                }
            </style>
            <span $if="key % 2 === 0">Id: {{ value }}</span>
            <span $else @click="$triggerEvent('onclicknotice', '哎哟你点我干嘛~~哎哟~')">
                <!-- 通过 <slot-receiver name="slotName"></...> 接收并放置父组件传下来的插槽 -->
                <slot-receiver name="invisibleNotice"></slot-receiver>
            </span>
        </li>
    `,
    // 通过attrs接收父组件传下来的attribute。接收到的attribute将会保留其名称存放到 this.vars 中，可作为一个正常响应性变量来使用
    attrs: ['key', 'value'],
    // 注册组件的事件（向上冒泡），可用 $triggerEvent(eventName, ...args) 触发
    events: ['onclicknotice']
}

let viorIns = new Vior({
    vars() {
        return {
            arr: []
        }
    },
    funcs: {
        add() {
            this.vars.arr.push(this.vars.arr.length + 1)
        }
    },
    // 用comps选项注册需要引入的组件，以便在当前组件或根组件中使用
    // 形式：ComponentName: ComponentOptions（注意：ComponentName需要为camelCase，但在HTML部分中使用则需用kebab-case，如<component-name></...>）
    comps: {
        CustomLi: CustomLiComponent
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-component-r3t5ik)

# 双向绑定
```html
<div id="app">
    <!-- Vior仿照Vue的做法，对表单元素做了很多特殊处理。
         在常用表单元素中，你可以通过 $value 指令获取表单组件的值（双向绑定）。
         只需要观看下面的实例，你就大概掌握了这部分内容： -->
    
    <!-- 普通input -->
    <input type="text" $value="inputVal"/>
    <br/>
    <strong>你输入了: </strong>{{ inputVal }}
    
    <hr/>
    
    <!-- 复选框 -->
    <input type="checkbox" :value="{ id: 1 }" $value="inputVal1"/>
    <input type="checkbox" :value="{ id: 2 }" $value="inputVal1"/>
    <br/>
    <strong>你选择了: </strong>{{ JSON.stringify(inputVal1) }}
    
    <hr/>
    
    <!-- 单选框 -->
    <input name="aaa" type="radio" value="A" $value="inputVal2"/>
    <input name="aaa" type="radio" value="B" $value="inputVal2"/>
    <br/>
    <strong>你选择了: </strong>{{ JSON.stringify(inputVal2) }}
    
    <hr/>
    
    <!-- 单选select -->
    <select $value="inputVal3">
        <option disabled value="">Please select one</option>
        <option :value="{ a: 1 }">A</option>
        <option :value="{ b: 1 }">B</option>
        <option :value="{ c: 1 }">C</option>
    </select>
    <br/>
    <strong>你选择了: </strong>{{ JSON.stringify(inputVal3) }}
    
    <hr/>
    
    <!-- 多选select -->
    <select $value="inputVal4" multiple>
        <option disabled value="">Please select multiple items</option>
        <option>A</option>
        <option>B</option>
        <option>C</option>
    </select>
    <br/>
    <strong>你选择了: </strong>{{ JSON.stringify(inputVal4) }}
    
    <hr/>
    
    <!-- 自定义组件 -->
    <custom-component $value="inputVal5"></custom-component>
    <br/>
    <strong>你输入了: </strong>{{ inputVal5 }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let customComponent = {
    // 在自定义组件上使用 $value 指令，Vior会向组件提供一个名为 $value 的attribute，此值即为父组件父组件传来的值。
    // 而子组件向父组件传值，则需要通过触发名为 on$value 的组件事件，并提供一个参数，其值为要传的值。
    html: `
        <textarea $value="$value" @input="$triggerEvent('on$value', this.value)"></textarea>
    `,
    attrs: ['$value'],
    events: ['on$value']
}

let viorIns = new Vior({
    vars() {
        return {
            inputVal: 'default value',
            inputVal1: [{ id: 1 }],
            inputVal2: 'A',
            inputVal3: '',
            inputVal4: ['A', 'C'],
            inputVal5: 'test'
        }
    },
    comps: {
        'custom-component': customComponent
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-twowaybinding-vu11ix)

# 生命周期钩子
```html
<div id="app">
    <div $if="created">Created! 时间: {{ createdTime }}</div>
    <div $if="mounted">Mounted! 时间: {{ mountedTime }}</div>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            created: false,
            createdTime: 0,
            mounted: false,
            mountedTime: 0,
        }
    },
    // 定义生命周期钩子的方式——hooks选项
    // Vior中目前有created（实例创建）、mounted（挂载真实DOM）、unmounted（卸载真实DOM）、uncreated（实例销毁，用于动态的组件实例）四个钩子
    hooks: {
        created() {
            this.vars.created = true
            this.vars.createdTime = Date.now()
        },
        mounted() {
            this.vars.mounted = true
            this.vars.mountedTime = Date.now()
        }
    },
    funcs: {
        add() {
            this.vars.arr.push(this.vars.arr.length + 1)
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-hook-dknogm)

# 监听器
```html
<div id="app">
    <!-- 再重写一下第一个计数器例子 -->
    <button @click="increase()" :disabled="count >= 10">+</button>
    <br/>
    计数: {{ count }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            count: 0
        }
    },
    funcs: {
        increase() {
            this.funcs.anotherFunction()
        },
        anotherFunction() {
            this.vars.count ++
        }
    },
    // 唯一的改动是在这加了一个watcher，即监听器
    // 通过watchers选项添加监听器。在watchers选项里添加与定义的响应性变量同名的函数，即可监听该变量
    watchers: {
        count() {
            console.log('count 变量被更改！')
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-watcher-03xff0)

# 动态变量
```html
<div id="app">
    <input ::value="input" @input="input = this.value" placeholder="请输入你的中文名~"/>
    {{ notice }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            input: '',
            // 在vars方法返回对象中，定义一个函数，这会被Vior视为动态变量。动态变量的使用跟普通响应式变量一模一样！
            // 如下，这个 notice 动态变量将会随着其依赖的值（在这为 input 变量）更变而更变。这就是“动态”啦~
            notice() {
                return /^[\u4e00-\u9fa5]+$/.test(this.vars.input) ? '对对对' : '错错错'
            }
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-dynamicvar-ue6g8w)

# 实例引用
```html
<div id="app">
    <!-- 通过 $ref 指令实现实例（DOM对象或Vior实例对象）引用。如下，响应性变量 ref_h1 的值将被赋为 <h1></...> 的DOM对象 -->
    <h1 $ref="ref_h1">我就是一个标题~</h1>
    <h2 $ref="ref_h2">我是副标题~</h2>
    <!-- 在自定义组件上使用 $ref 指令，则会取得其Vior组件实例对象。 -->
    <!-- 通过传入初始值为数组类型的响应性变量，启用叠加模式（见JS部分）。如下，refs_custom 的值将为多个Vior组件实例组成的数组。 -->
    <custom-component $for="(k, v) in arr" $ref="refs_custom">{{ v }}</custom-component>
    <br/>
    <button @click="arr.push(arr.length + 1)">变一变</button>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let CustomComponent = {
    html: `
        序号：<slot-receiver></slot-receiver>
        <br/>
    `
}

let viorIns = new Vior({
    vars() {
        return {
            ref_h1: null,
            ref_h2: null,
            // 响应性变量 refs_custom 将启用叠加模式
            refs_custom: [],
            arr: [1, 2, 3]
        }
    },
    watchers: {
        ref_h1() {
            console.log('ref_h1', this.vars.ref_h1)
        },
        ref_h2() {
            console.log('ref_h2', this.vars.ref_h2)
        },
        refs_custom() {
            console.log('refs_custom', this.vars.refs_custom)
        }
    },
    comps: {
        'custom-component': CustomComponent
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-instancereferences-2sot8c)

# 内置元素
- `<template></...>`: 空元素，效果是只显示其插槽（子元素）内容。
- `<slot-provider name="slotName"></...>`: 插槽提供者，配合`<slot-receiver></...>`将插槽内容传给组件。
- `<slot-receiver name="slotName"></...>`: 插槽接收者，接收并放置对应`name`（默认为'default'）的`<slot-provider></...>`提供的插槽内容。

# 内置函数 / 变量
### HTML部分
- `this`: 当前元素的DOM对象。如当前对象为DOM模板，或当前上下文为attribute、property等，则其为`null`。
- `$this`: 当前的Vior实例对象。**警告！由于Vior内部原因，永远不要在HTML部分的上下文使用`$this.vars`等方式使用响应性变量或函数！**
- `$args`: 当前DOM事件、或组件事件的回调参数。通常在DOM事件（非组件事件）中`$args[0]`的值为DOM event对象。在DOM事件、或组件事件的上下文可用。

### HTML、JS部分共有
- `$parent`: 父组件Vior实例对象。当在根组件调用时则为`null`。
- `$children`: 子组件Vior实例数组。
- `$triggerEvent(eventName, ...args)`: 自定义组件触发事件（冒泡）的方法，提供的`...args`参数可在组件事件上下文通过`$args`获取。
**注意！在JS部分中，以上内置变量需要借助Vior实例获取，例如`this.$parent`。**

### JS部分
- `this`: 当前的Vior实例对象。