# Introduction
In fact, Vior is just a mini copy of Vue! So you can use Vior in Vue's way basicly.  
Although it is so similar with Vue, there is some differences, so I will assume that you have NOT learnt Vue in the following parts.

# Demo
Here is pretty easy demo, it may help you understand some of Vior's feature.
```html
<div id="app">
    <h1>{{ text }}</h1>
    <button @click="changeText()" :disabled="isDisabled">change</button>
    <button @click="isDisabled = ! isDisabled">
        {{ isDisabled ? 'un' : '' }}disable
    </button>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior';

let refs, funcs
let viorIns = new Vior({
    refs() {
        text: 'hello, world',
        isDisabled: false
    },
    hooks: {
        mounted() {
            refs = this.refs
            funcs = this.funcs
        }
    },
    funcs: {
        changeText() {
            refs.text = refs.text.split('').reverse().join('')
        }
    }
}).mount(document.getElementById('app'));
``` 

# JS part
### Reactive variables
To use reactive, you should provide a `refs()` function in `options` that returns a object, in order to define your reactive variable in it.  
Then you can use them in Vior's context (in `events`, `funcs` option etc.) like:
```javascript
this.refs.varName
// or storage 'this.refs' in Vior's context in a variable to make codes short:
let refs = this.refs
refs.varName
```

### Functions
You can alse define your own functions in the `funcs` option.  
You can just use them like your reactive variables:
```javascript
let viorIns = new Vior({
    funcs: {
        yourFunction() {
            this.funcs.anotherFunction()
        },
        anotherFunction() {
            alert('hello, world')
        }
    },
    ...
})
```

### Life cycle hooks
You can define your hook functions in the `hooks` option, there are several hooks:
- `created()`: will be triggered when Vior instance's initialization completes (now Vior instance is available, but UI has not been initialized because you have not do `mount()`)
- `mounted()`: will be triggered when Vior instance mounts to the DOM (everything sets up)
- `unmounted()`: will be triggered when Vior instance unmounts (that means Vior instance is still available, but it has not mounted to the DOM, you can do `mount()` again to mount it)

Take a example:
```javascript
let viorIns = new Vior({
    hooks: {
        created() {
            console.log('Vior created!')
        },
        mounted() {
            console.log('Vior mounted!')
        },
        ...
    },
    ...
})
```

# HTML part
HTML part is a lot easier than JS's!

### Templates
You can use DOM templates that run in Vior's context to display your reactive variables' values easily:  
```html
<div>{{ yourReactiveVar }}</div>

<!-- you can use an expression here -->
<div>{{ your.ReactiveVar.split('').reverse().join('') }}</div>
<!-- you can also use your functions defined in 'funcs' option -->
<div>{{ yourFunction() }}</div>
```

### Properties
You can define DOM properties that run in Vior's context, for example:
```html
<button :disabled="yourReactiveVar"></button>

<!-- the following methods is OK -->
<button :disabled="yourReactiveVar == '1' ? true : false"></button>
<button :disabled="yourFunction()"></button>
```

### Events
You may be uncertain what is the DOM properties like `@xxx`. In fact, they are DOM events that can run in Vior's context. `@xxx` equals `onxxx`  
For example, you can do this:  
```html
<button @click="yourFunction(yourReactiveVar)"></button>

<!-- use '$this' to get current DOM object -->
<input @input="yourFunction($this.value)"/>
```

### Events with "Two-way Binding Values" (TBV)
There is a advanced feature based on DOM events called "Two-way Binding Values" (TBV). Here is a example for TBV that helps you understand TBV: 
```html
<input @input::value="yourReactiveVar"/>
<!-- this will display the input value -->
<div>You input: {{ yourReactiveVar }}</div>
```
```javascript
let viorIns = new Vior({
    refs() {
        return {
            yourReactiveVar: 'default value'
        }
    }
})
```
You will find that the core is in this event tag:
```html
@input::value="yourReactiveVar"
```
Exactly, this is the way to define TBV. Here is the structure of it: 
```html
@eventName::propName="yourReactiveVar"
```
And this is what Vior will do:  
When the DOM event `eventName` is triggered, sync the DOM's property `propName`'s value to the Vior's reactive variable `yourReactiveVar`.  

Compares to Vue's `v-model`, Vue's `v-model` is similar to TVB, but TVB is more extensible. That's why I made TVB instead of `v-model`. In fact, the TVB example at the beginning of this part is equal to `v-model`.

# At the end
You can try to understand and try to improve the demo in /test/index.html to have a practice!