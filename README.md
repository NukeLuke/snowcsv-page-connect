# sfe-page-connect

## 功能描述

此 node 包主要用于简化前端开发代码，为 web app 提供动态添加 reducer 和 saga 的能力。主要分为 webpack loader 和前端模块两部分。

### loader

loader 部分源文件对应 loader.js.

主要用于在页面源文件中注入源文件局部变量:

-   `$namespace`: string, 当前源文件相对于 src/ 的相对路径, 每个页面源文件唯一，主要用于页面的命名空间。
-   `$pageConnect`: function, 用于 connect 页面对象实例，具体实现如下：

```javascript
import { connect } from 'react-redux'
import { createSelector } from 'reselect'

function $pageConnect(Comp) {
    const selectors = createSelector(
        [state => state[$namespace], state => state.commons],
        (data, commons) => ({
            data,
            commons,
            namespace,
        })
    )

    return connect(selectors)(Comp)
}
```

webpack loader 配置：

```javascript
module.exports = {
    //...
    module: {
        rules: [
            {
                test: require.resolve('@sunl-fe/sfe-page-connect'),
                use: ['babel-loader'],
            },
            {
                test: /\.(js|jsx)$/,
                use: ['babel-loader', '@sunl-fe/sfe-page-connect/loader'],
                include: ['src'],
            },
        ],
    },
}
```

### 前端模块 index.js (默认 export 模块)

前端模块封装了 page app 初始化过程. 如项目有特殊的初始化流程, 可通过重写 `init()` 方法来实现.

```javascript
import { createConnector, PageApp } from '@sunl-fe/sfe-page-connect'
```

-   createConnector(namespace): Function, 用于创建`$pageConnect(Component)` 函数。
-   PageApp: Class, 实现了 web app 初始化，已以及动态添加 reducer 和 saga 的方法，web 项目可通过继承此类来使用这些方法。
    1.  init({historyBasename, enableReduxLog}) 方法：初始化 web 应用
        -   isHashHistory {boolean}: default `false`, history creating type
        -   historyBasename {string}: default `"/"`, history basename
        -   enableReduxLog {boolean}: default `true`, 是否启用 redux log. 此配置只会在 dev 环境下有作用, test 和 prod 环境下次配置将始终为`false` (即 log 只会在 dev 环境下开启)
    1.  addReducer(namespace, reducer) 方法：动态添加新的 reducer
    1.  removeReducer(namespace) 方法：动态删除 reducer
    1.  addSaga(namespace, sagaMap) 方法：动态添加 saga

注意事项:

-   此包要和 `@sunl-fe/sfe-service` 配合一起使用
-   **项目中 babel 配置文件必须命名为 `babel.config.js`, 否则此包无法正常工作.** 此包为未经过 babel 编辑的 ES6 代码, 需要在使用的项目中对其进行编译(`@sunl-fe/sfe-service` 会自动处理编译的工作, 开发人员不需要关心), 而 babel 只有在配置文件命名为 `babel.config.js` 时才能正常编译 `node_modules` 里的代码.
