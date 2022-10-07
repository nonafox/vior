# Before start
As my said, Vior is just a project for fun, I just made it to improve my technology. The thinking of Vior is the same as Vue, and Vior has many same features as Vue, although there are some differences.

Now I'm absorbed in updating and improving, so I had little time to finish the documents. So I made this example-based document temporarily.

# Reaction Basic
```html
<div id="app">
    <!-- These two attributes are DOM event, DOM attribute and DOM property. Details:
         DOM event:        @eventName="code" // `eventName` doen't need an 'on' prefix
         DOM attribute:    :attributeName="code"
         DOM property:     ::propertyName="code" -->
    <!-- you can get the DOM property by `document.getElementById('test').customValue` -->
    <button id="test" @click="count ++" :disabled="count >= 10" ::custom-alue="{ countVal: count }">+</button>
    <br/>
    <!-- DOM templates that used to display the values of reactive variables. They seems like {{ xxx }} -->
    Count: {{ count }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    // `vars` option: the way to define reactive variables
    // the option should be a function which returns a object to define your reactive variables' default values.
    vars() {
        return {
            count: 0
        }
    }
}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-basicreactive-cfnleh)

# Class / Style Handling
```html
<div id="app">
    <!-- Vior will do special handling on class or style attributes -->
    
    <!-- here the attribute `class` will be resolved as: class="aaa ccc" -->
    <div :class="{ aaa: true, bbb: false, ccc: 1 }"></div>
    <!-- this works as well as the previous one -->
    <div :class="[{ aaa: true, bbb: false }, { ccc: true }]"></div>
    
    <!-- here the attribute `style` will be resolved as:
         style="width: 100px; height: calc(100vh - 10px); --test-var: 'string value';" -->
    <div :style="{ width: 100, height: 'calc(100vh - 10px)', '--test-var': `'string value'` }"></div>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'
let viorIns = new Vior({}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-classtyle-u5ix1d)

# Two-way Binding
```html
<div id="app">
    <!-- Vior does a lot of special handling for form components.
         on most of them, you can use `$value` command to achieve two-way binding.
         see the examples and learn it! -->
    
    <!-- common input -->
    <input type="text" $value="inputVal"/>
    <br/>
    <strong>Input: </strong>{{ inputVal }}
    
    <hr/>
    
    <!-- multiple box -->
    <input type="checkbox" :value="{ id: 1 }" $value="inputVal1"/>
    <input type="checkbox" :value="{ id: 2 }" $value="inputVal1"/>
    <br/>
    <strong>Select: </strong>{{ JSON.stringify(inputVal1) }}
    
    <hr/>
    
    <!-- single box -->
    <input name="aaa" type="radio" value="A" $value="inputVal2"/>
    <input name="aaa" type="radio" value="B" $value="inputVal2"/>
    <br/>
    <strong>Select: </strong>{{ JSON.stringify(inputVal2) }}
    
    <hr/>
    
    <!-- single select -->
    <select $value="inputVal3">
        <option disabled value="">Please select one</option>
        <option :value="{ a: 1 }">A</option>
        <option :value="{ b: 1 }">B</option>
        <option :value="{ c: 1 }">C</option>
    </select>
    <br/>
    <strong>Select: </strong>{{ JSON.stringify(inputVal3) }}
    
    <hr/>
    
    <!-- mutiple select -->
    <select $value="inputVal4" multiple>
        <option selected disabled value="">Please select multiple items</option>
        <option>A</option>
        <option>B</option>
        <option>C</option>
    </select>
    <br/>
    <strong>Select: </strong>{{ JSON.stringify(inputVal4) }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            inputVal: 'default value',
            inputVal1: [{ id: 1 }],
            inputVal2: 'A',
            inputVal3: '',
            inputVal4: ['A', 'C']
        }
    }
}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-twowaybinding-vu11ix)

# Functions
```html
<div id="app">
    <!-- Rewrite the counter demo -->
    <button @click="increase()" :disabled="count >= 10">+</button>
    <br/>
    Count: {{ count }}
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
    // `funcs` option: the way to define functions
    // Notice: you need to do `this.vars.xxx` and `this.funcs.xxx`, for getting reactive variables and getting functions. It's the same in Vior's JS context (eg. Vior's options).
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
[▶ Run in codesandbox](https://codesandbox.io/s/vior-function-w50ucn)

# Commands
```html
<div id="app">
    <button @click="add()">Add</button>
    <ul>
        <!-- The attributes starts with `$` are Vior's commands. Here are all of their details:
             $for="(key, value) in array"   walk through the array or object
             $if="condition"                control if the element display according to the condition
             $else                          be used with `$if`, just means `else`
             $elseif="condition"            be used with `$if`, just means `else if`
             $html="code"                   control element's property innerHTML without Vior's XSS protecting. don't use `::innerHTML` instead of this!!!
             $is="code"                     switch the tag of the element. supports camelCase and html-case
             $value="code"                  the way to achieve two-way binding on form components, see above
             -->
        <li $for="(key, value) in arr">
            <span $if="key % 2 === 0">Id: {{ value }}</span>
            <template $else $is="(key + 1) % 3 === 0 ? 'strong' : 'i'">Odd numbers only~</template>
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
[▶ Run in codesandbox](https://codesandbox.io/s/vior-command-z36oyk)

# Life-cycle Hooks
```html
<div id="app">
    <div $if="created">Created! Time: {{ createdTime }}</div>
    <div $if="mounted">Mounted! Time: {{ mountedTime }}</div>
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
    // `hooks` option: the way to define life-cycle hooks
    // there are four hooks in Vior: created, mounted, unmounted, uncreated (uncreated: dynamic components only)
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
[▶ Run in codesandbox](https://codesandbox.io/s/vior-hook-dknogm)

# Watchers
```html
<div id="app">
    <!-- rewrite the counter demo again -->
    <button @click="increase()" :disabled="count >= 10">+</button>
    <br/>
    Count: {{ count }}
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
    // Add watchers in `watchers` option. Vior will trigger the function in `watchers` option when the reactive variable which has the same name is changed.
    watchers: {
        count() {
            console.log('`count` is changed！')
        }
    }
}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-watcher-03xff0)

# Dynamic Variables
```html
<div id="app">
    <input ::value="input" @input="input = this.value" placeholder="your Chinese name"/>
    {{ notice }}
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            input: '',
            // define a function in `vars` option, and it'll be a dynamic variable. its using way is the same as other reactive variables
            // like this, dynamic variable `notice` will update when its dependencies is updated!
            notice() {
                return /^[\u4e00-\u9fa5]+$/.test(this.vars.input) ? 'OK' : 'Invalid Chinese name!'
            }
        }
    }
}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-dynamicvar-ue6g8w)

# Custom Components
```html
<div id="app">
    <button @click="add()">Add</button>
    <ul>
        <!-- The strange element is your custom component -->
        <custom-li $for="(k, v) in arr" :key="k" :value="v" @clicknotice="alert($args[0])">
            <!-- pass your slots to the component below using the <slot-provider name="slotName"></...> if you don't you it, and add elements directly, Vior will make them in the slot named `default` -->
            <!-- Notice! DOM attributes and slots run in the father context -->
            <slot-provider name="invisibleNotice">
                <strong>Odd numbers only~</strong>
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
            <span $else @click="$triggerEvent('onclicknotice', 'Why did you click me~')">
                <!-- receive and place the slots from father using <slot-receiver name="slotName"></...> -->
                <slot-receiver name="invisibleNotice"></slot-receiver>
            </span>
        </li>
    `,
    // receive the attributes from father. you can use them like a normal reactive variable like `this.vars.xxx`
    attrs: ['key', 'value'],
    // register component events and bubble to father. events can be triggered in component's self by `$triggerEvent(eventName, ...args)`
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
    // the way to require components: `comps` option, in order to use your custom components in HTML part
    // format: { ComponentName: ComponentOptions, ... } (notice: `ComponentName` takes a camelCase name, but you should use your components in kebab-case in HTML part)
    comps: {
        CustomLi: CustomLiComponent
    }
}).mount(document.getElementById('app'))
```
[▶ Run in codesandbox](https://codesandbox.io/s/vior-component-r3t5ik)

# Inner Elements
- `<template></...>`: void element. it'll only show its children.
- `<slot-provider name="slotName"></...>`: slot provider, be used with `<slot-receiver></...>` to pass the slots to components.
- `<slot-receiver name="slotName"></...>`: slot receiver, will receive and place the slots from `<slot-provider></...>` which has the same `name` (`name` be sets to 'default' when it hasn't been set or there is no slot providers).

# Inner Functions / Variables
### HTML part
- `this`: DOM object for current element. When current element is a DOM template, or the context whitch to use it is in DOM attributes or properties, `this` will be `null`.
- `$this`: current Vior instance. **Because of Vior's feature, never use it in HTML part to get reactive variables and functions.**
- `$args`: callback arguments' array for the current DOM event or component event. Can be only used in DOM events and component events context.

### HTML & JS part
- `$parent`: father's Vior instance. When in root component, it'll be `null`.
- `$children`: children's Vior instances' array.
- `$triggerEvent(eventName, ...args)`: the way to trigger component events. `...args` can be used by `$args` in component events' context.

### JS part
- `this`: Current Vior instance.