# 开始之前
正如我所说，Vior只是一个娱乐项目，初衷是锻炼我的技术能力。Vior的思路跟Vue的几乎一模一样，很多功能都跟Vue雷同，但Vior又有所创新。  
目前我专注于性能、新功能的优化与更新，没有那么多的时间精力完善文档，所以我只能临时做一个以示例为基础的“文档”。

# 响应性基础
```html
<div id="app">
    Count: {{ count }}
    <button @click="count ++">increase</button>
</div>
```
```javascript
import Vior from 'https://unpkg.com/vior'

let viorIns = new Vior({
    vars() {
        return {
            count: 0
        }
    }
}).mount(document.getElementById('app'))
```
[在codesandbox中运行](https://codesandbox.io/s/vior-counter-cfnleh)