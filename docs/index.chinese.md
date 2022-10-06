# 开始之前
正如我所说，Vior 只是一个娱乐项目，初衷是锻炼我的技术能力。Vior 的思路跟 Vue 的几乎一模一样，很多功能都跟 Vue 雷同，但 Vior 又有所创新。

目前我专注于性能、新功能的优化与更新，没有那么多的时间精力完善文档，所以我只能临时做一个以示例为基础的“文档”。

# 响应性基础
```html
<div id="app">
    <!-- 按钮上两个属性分别是DOM事件、DOM attribute。具体形式为：
         DOM事件:        @eventName="code" // eventName不需要有'on'前缀
         DOM attribute:  :attribute="code" -->
    <button @click="count ++" :disabled="count >= 10">+</button>
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
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-basicreactive-cfnleh)

# 双向绑定
```html
<div id="app">
    <!-- 我们通过定义两个数据流实现双向绑定，如下 -->
    <!-- ::value 是一个DOM property，能实现从Vior到DOM property的数据流
         @input 为DOM事件属性，实现从DOM property到Vior的数据流。核心是通过与property相关的DOM事件来触发数据更新 -->
    <input ::value="input" @input="input = this.value"/>
    <br/>
    你输入了: {{ input }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            input: 'default value'
        }
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-twowaybinding-vu11ix)

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
             $elseif                      顾名思义，意为 否则如果，搭配 $if 使用
             $html                        直接控制DOM的innerHTML，绕开Vior的XSS防护。注意：此指令不可用 ::innerHTML 替代！！！
             $is                          控制元素的标签名，支持camelCase和html-case
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
    // 形式：ComponentName: ComponentOptions（注意：ComponentName需要为camelCase，但在HTML部分中使用则需用HTML case，如<component-name></...>）
    comps: {
        CustomLi: CustomLiComponent
    }
}).mount(document.getElementById('app'))
```
[▶ 在 codesandbox 中运行](https://codesandbox.io/s/vior-component-r3t5ik)

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

### JS部分
- `this`: 当前的Vior实例对象。