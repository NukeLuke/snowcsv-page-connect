const path = require('path')
const debug = require('debug')('snowcsv-page-connect')
const fs = require('fs-extra')
const { getOptions } = require('loader-utils')

const patternPage = /pages(\/[^/]+\/subPages)*\/[^/]+\/index\.jsx?$/
const currentWD = process.cwd()


function defaultFileFilter({ context, cwd, resourcePath }) {
    return resourcePath.startsWith(path.resolve(cwd, 'src/pages'))
}

function defaultNamespaceGenerator({ context, cwd }) {
    const pageRoot = path.resolve(cwd, 'src').replace(/\\/g, '/')
    return context.replace(/\\/g, '/').replace(pageRoot, '').replace(/^\/+/, '')
}


/**
 *  Options:
 *  --------------
 *  fileFilter {function}: filter file need to be transformed
 *  namespaceGenerator {function}: return namespace
 *  appRequireExpression {string}: require app code string
 */
module.exports = function (content, map, meta) {
    const options = getOptions(this) || {}
    const params = { context: this.context, cwd: currentWD, resourcePath: this.resourcePath }
    const {
        fileFilter = defaultFileFilter,
        namespaceGenerator = defaultNamespaceGenerator,
        appRequireExpression = 'require(\'/src/commons/app\').default',
    } = options

    if (!fileFilter(params)) {
        return content
    }

    const namespace = namespaceGenerator(params)

    debug('--------------------------------')
    debug(`namespace: ${namespace}`)
    debug(`transform file: ${this.resourcePath}`)

    const isPageEntry = patternPage.test(this.resourcePath.replace(/\\/g, '/'))
    debug(`isPageEntry: ${isPageEntry}`)

    const reducerFilePath = path.resolve(currentWD, 'src', namespace, 'reducer.js')
    const isReducerExsit = fs.existsSync(reducerFilePath)
    const reducerRegisterCode = `App.addReducer('${namespace}', require('./reducer.js').default);`
    debug(`check reducer file: ${reducerFilePath}  -- ${isReducerExsit ? 'exist' : 'NOT exist'}`)

    const sagaFilePath = path.resolve(currentWD, 'src', namespace, 'saga.js')
    const isSagaExsit = fs.existsSync(sagaFilePath)
    const sagaRegisterCode = `App.addSaga('${namespace}', require('./saga.js'));`
    debug(`check saga file: ${sagaFilePath}  -- ${isSagaExsit ? 'exist' : 'NOT exist'}`)

    // for page entry file
    if (isPageEntry) {
        return `
/* page-connect-loader injection start */
const $namespace = '${namespace}'
const $pageConnect = require('snowcsv-page-connect').createConnector($namespace)

;(function(){
    const App = ${appRequireExpression};
    const { registerSaga, registerReducer } = require('snowcsv-page-connect');

    ${isReducerExsit ? reducerRegisterCode : ''}
    ${isSagaExsit ? sagaRegisterCode : ''}
})();
/* page-connect-loader injection end */

${content}`
    }

    // for other files in page folder
    return `
/* page-connect-loader injection start */
const $namespace = '${namespace}'
/* page-connect-loader injection end */

${content}`
}
