// import '@babel/polyfill'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { fork } from 'redux-saga/effects'
import { combineReducers, compose, applyMiddleware, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { createBrowserHistory, createHashHistory } from 'history'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import logger from 'redux-logger'
import commonReducer from '@/commons/reducer'
import * as commonSagas from '@/commons/saga'


function sagaMapToFn(sagaMap) {
    return function* root() {
        const keys = Object.keys(sagaMap)
        for (let i = 0; i < keys.length; i += 1) {
            yield fork(sagaMap[keys[i]])
        }
    }
}

export const createConnector = namespace => Comp => {
    const selectors = createSelector([
        state => state[namespace],
        state => state.commons,
    ], (data, commons) => ({
        data,
        commons,
        namespace,
    }))

    return connect(selectors)(Comp)
}


export class PageApp {
    constructor() {
        this.store = null
        this.history = null
        this.sagaMiddleware = null
        this.reducerMap = null
        this._sagaTaskMap = {}
    }

    init({ historyBasename = '/', enableReduxLog = true, isHashHistory = false } = {}) {
        console.debug('snowcsv-page-connect: PageApp.init()')
        const middlewares = []

        // init history
        const appHistory = this.history = isHashHistory ? createHashHistory({
            basename: historyBasename,
        }) : createBrowserHistory({
            basename: historyBasename,
        })
        middlewares.push(routerMiddleware(appHistory))

        // init saga
        const sagaMiddleware = this.sagaMiddleware = createSagaMiddleware()
        middlewares.push(sagaMiddleware)

        // redux logger
        if (process.env.COMPILE_MODE === 'dev' && enableReduxLog) {
            middlewares.push(logger)
        }

        // redux devtools
        const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
        const enhancer = composeEnhancers(applyMiddleware(...middlewares))

        // 將 saga middleware mount 在 Store 上
        const initialState = {}
        this.reducerMap = {
            router: connectRouter(appHistory),
            commons: commonReducer,
        }

        this.store = createStore(combineReducers(this.reducerMap), initialState, enhancer)

        // apply common sagas, only after the applyMiddleware phase
        sagaMiddleware.run(sagaMapToFn(commonSagas))
    }


    /**
     *  动态添加新的 reducer
     */
    addReducer(namespace, reducer) {
        console.info(`snowcsv-page-connect:: 注册 reducer ${namespace}`)

        if (this.reducerMap[namespace] != null) {
            console.error(`snowcsv-page-connect:: 重复注册 reducer, reducer '${namespace}' already exist`)
        }

        const newReducerMap = {
            ...this.reducerMap,
            [namespace]: reducer,
        }
        // 动态替换 reducer
        this.store.replaceReducer(combineReducers(newReducerMap))
        this.reducerMap = newReducerMap
    }


    /**
     *  动态删除 reducer
     */
    removeReducer(namespace) {
        const newReducerMap = {
            ...this.reducerMap,
        }
        delete newReducerMap[namespace]
        // 动态替换 reducer
        this.store.replaceReducer(combineReducers(newReducerMap))
        this.reducerMap = newReducerMap
    }


    /**
     *  动态添加 saga
     */
    addSaga(namespace, sagaMap) {
        const sagaTaskMap = this._sagaTaskMap
        const entrySaga = function* () {
            if (sagaTaskMap[namespace] != null) {
                console.error(`snowcsv-page-connect:: 重复注册 saga , namespace=${namespace}`)
            }

            console.info(`snowcsv-page-connect:: 注册 saga ${namespace}`)
            // fork 每个页面的 saga 函数，保存 task 引用
            sagaTaskMap[namespace] = yield fork(function* () {
                const keys = Object.keys(sagaMap)
                for (let i = 0; i < keys.length; i += 1) {
                    const sagaFn = sagaMap[keys[i]]
                    yield fork(sagaFn)
                }
            })
        }
        this.sagaMiddleware.run(entrySaga)
    }
}
