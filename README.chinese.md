# Vior
一个我自已做的迷你Vue副本。  
Vior这名儿怎么来的？和[@尤大](https://github.com/yyx990803)一样，用翻译器！

# 多语言
- [English](https://github.com/jwhgzs/vior/blob/main/README.md)
- 中文（当前）

# 文档
<https://github.com/jwhgzs/vior/tree/main/docs/index.chinese.md>

# 功能 & 待办
- ✅ 响应性基础
	- 响应性变量
	- 动态变量
	- 监听器
- ✅ HTML模板引擎
	- 普通文字模板（templates）
	- DOM属性（DOM attributes）
	- DOM事件（DOM events）
	- 命令
	- 双向绑定值（TBV）
- ✅ 虚拟DOM
	- 极致渲染速度
	- 根据HTML文本动态生成虚拟DOM树（用于适配`$html`命令和以后的服务端渲染——SSR）
- ⬛ 组件支持
- ⬛ Vior自己的CLI（就像Vue CLI）
- ⬛ 服务端渲染（SSR）

# 相关链接
Vior示例: <https://test.jwhgzs.com/vior/test/>  
参考文章: <https://vue-course-doc.vercel.app/>

# 关于作者
请允许我吹下牛逼~

我是谭镇洋，是个14岁的寄宿初中生，今年（2022）读初三。因为寄宿，我只能周末或节假日编程。我从小学五年级开始编程，但是到初中才取得比较大的进步，可以说初一之前一直在挤牙膏。

我开始这个项目，只是看到B站有个Up主[@BugDuck开源团队](https://space.bilibili.com/1959824394)，他们也都是初中生。他们搞了一个叫[TNT.js](https://github.com/Bug-Duck/tntjs)的项目，是个仿Vue的JS（TS）框架，还做了几个视频来宣传。我心想：“我擦，竟然有人比我先行一步？不行，我也来！”于是就有了这个项目。我花了总计约8天完成了整个Vior项目（从v0.1.0到v0.2.26）。

我一开始没啥头绪，于是去网上搜了下“Vue原理”，找了个[尤大自己讲的教程](https://www.bilibili.com/video/BV1d4411v7UX/)来看，学了响应性核心原理——依赖追踪，而后又去搜了搜虚拟DOM的实现原理（主要查了Vue的diff算法），就埋头自己开始干。整个项目我几乎没有抄过别人的代码——除了一个我自己实在实现不了的函数——`Util.isPlainObject()`，这个函数我复制了一点别人的，代码来源我注释了。

为了练手（或者说：避免没有事情干），以后我还会继续维护、更新这个项目，你可以看到上面的待办列表，我会大概按这个表行事。

如果你担心我的学习成绩，那么你可以放心了。我已经习惯了平衡学习和编程，毕竟从初一开始。至于我的成绩——一个不错的初中全级前10（最近一次期末考）。

干就完事了！