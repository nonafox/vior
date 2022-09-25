# Before start
I'm just a junior school student, so that I haven't much time to finish the full documents. To make others who excluding me understand what Vior can do, I made a simple examples-based document temporarily. Here we go!

# Basic reactivity
Here is a pretty simple counter demo.
```html
<div id="app">
	<!--
		- '@click' is a Vior DOM event, equals the native DOM event 'onclick'
		- ':disabled' is a Vior DOM attribute
		-->
    <button @click="count ++" :disabled="count >= 10">
		Count:
		<!-- ↓ This is a Vior DOM template -->
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

This demo shows the core of Vior. As you see, it is completely the same as Vue!

The only difference is the option name `refs`, it is the same as Vue's `data` option, it takes a function which returns a object with your default reactive variables.

**You can use your reactive variables in "any" place (where you think it can, in such as Vior DOM events**, **DOM attributes**, **DOM templates).**

And here are some available special inner variable in HTML part:
- `$args`: storages the native event arguments' array (in JS), basicly the first argument is a native DOM event object. Can only be used in Vior DOM events' context.

# Functions
This is another version of the counter demo:
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
			// Call another Vior function, just for demo of course!
			this.funcs.doit()
		},
		doit() {
			this.refs.count ++
		}
	}
}).mount(document.getElementById('app'))
```
It works as same as the first one. We just make the increase feature in a Vior function in JS instead of do that in the DOM event directly.

You can add some functions in the `funcs` option, and you can call them in "any" place. **Notice! The way to do with reactive variables and functions in JS part is different from HTML's**. As you see, when in JS's context, you need to:

- `this.refs.xxx` to use reactive variables
- `this.funcs.xxx` to use functions

# Commands
Here is a imperfect TODO list demo:
```html
<div id="app">
	<h1>TODO list</h1>
	<hr/>
	<ul>
		<li $for="(k, v) in list">
			{{ k + 1 }}: {{ v }}
			<button @click="del(k)">delete</button>
		</li>
	</ul>
	<div $if="list.length">You have something to do!</div>
	<div $else>Nothing to do~</div>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    refs() {
	    return {
			list: ['leave school', 'finish the homework', 'practise the piano', 'start programming']
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
This demo shows the often-used commands in Vior. Here are more details:

- `$for="(key, value) in array"`: loop through a array or object
- `$if="condition"`: control if the component will show
- `$else`, `$elseif="condition"`: just as its name implies
- `$html="expression"`: **DANGEROUS!** display the content directly without XSS protect, just like setting `DOM.innerHTML`

# Two-way Binding Values (TBV)
A "easy" input demo:
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
You can see the input's property `value` is bind with the reactive variable `inputValue`. This is TBV's work!

You can define TBV by setting this form of DOM attributes: 
```
@eventName::propertyName="reactiveVariable"
```
And what TBV will do with this is: **when the DOM event `eventName` triggered, sync the DOM property `propertyName`'s value to the reactive variable `reactiveVariable`; also sync the reactive variable's value to the DOM property when the reactive variable is changed**.

It is a bit difficult to understand, because I may be the inventor of this kind of Two-way Binding!

# Lifecycle hooks
A demo which does nothing:
```js
let viorIns = new Vior({
	hooks: {
		created() {
			console.log('Vior instance created!')
		},
		mounted() {
			console.log('Vior instance mounted to real DOM!')
		},
		unmounted() {
			console.log('Vior instance unmounted!')
		}
	}
})
```
The demo shows all the lifecycle hooks in Vior. Vior will trigger different hooks in different lifecycle stage.

You can define your own hooks in the `hooks` option. I think I don't need to explain more, just see the demo!

# Watchers
This is a nearly useless demo:
```javascript
let viorIns = new Vior({
    refs() {
        text: 'hello, world'
    },
	hooks: {
		created() {
			// This will change the reactive variable 'text' every second
			setInterval(function() {
				this.refs.text = this.refs.text.split('').reverse().join('')
			}, 1000)
		}
	},
	watchers: {
		text() {
			console.log('text is changed!')
		}
	}
})
```
In this demo, when the reactive variable `text` is changed, watcher `text` will be triggered, and do `console.log(...)`.

You can define a function in the `watchers` option which has a same name as a reactive variable, and it will be triggered when the variable is changed.

# Dynamic variables
Here is nearly the full version of the TODO list demo:
```html
<div id="app">
    <h1>TODO list</h1>
    <hr/>
    <ul>
        <li $for="(k, v) in list">
            {{ k + 1 }}: {{ v }}
            <button @click="del(k)">delete</button>
        </li>
    </ul>
    <div $if="total" $html="total"></div>
    <div $else>Nothing to do!</div>
    <br/>
    <input @input::value="inputVal" @input="console.log('input: ', $args[0].data)" placeholder="event name"/>
    <button @click="add()" :disabled="! inputVal">add</button>
    <hr/>
    <h3>Powered by Vior</h3>
</div>
```
```javascript
import Vior from '../src/index.js'

let refs, funcs
let viorIns = new Vior({
    refs() {
        return {
            list: ['leave school', 'finish the homework', 'practise the piano', 'start programming'],
            inputVal: '',
            total() {
                let text = this.refs.list.join(', ')
                if (text)
                    return '<strong>You need to do: </strong>' + text
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
Don't be scare! It is easy. In fact, it contains almost all content we have learnt above. But there is something new.

Look at the reactive variable `total`. It is defined in `refs` option, and its value is a function. This is actually a dynamic variable (just a kind of reactive variable)!

When you add a function variable in `refs` option, Vior will treat it as a dynamic variable: **that means the function's callback value will "always" sync to the variable's value. When the reactive variables in the function are changed, the variable's value will auto update.**

But remember, this is based on dependencies traking, just like Vue. Vior will only watch on your reactive variables' changes in the function, other things in the function like `Date.now()`'s changes, Vior won't do with them!

**There is a notice between common functions and dynamic variables: common functions don't have auto-update feature, that means when you use a common function in Vior DOM attribute, the attribute's value will always be the first callback value of the common function.**

# At last
As you see, Vior is only a own-made copy of Vue, I just had a play. Never use Vior in your project!