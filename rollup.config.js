/**
 * 一些模块像 events 或者 util 是建立在Node.js的，
 * [builtins] 使内置包含这些（例如，使你的包在浏览器中运行）
 */
import builtins from 'rollup-plugin-node-builtins'
/**
 * 因为Node模块使用了CommonJS，它与开箱即用的Rollup不兼容。
 * [resolve] 它允许我们加载第三方模块 node_modules 。
 * [commonjs] 将 CommonJS 模块转换为 ES6。
 */
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
/**
 * 添加一个插件来替换环境变量。
 */
import replace from 'rollup-plugin-replace'
import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import { name, main, module } from './package.json'

const entry = 'src/main.js'
// const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    input: entry,
    output: [{
      name: name,
      file: main,
      format: 'umd',
      sourcemap: true,
    },
    {
      name: name,
      file: module,
      format: 'es',
      sourcemap: true,
    }],
    plugins: [
      builtins(),
      resolve(),
      commonjs(),
      json(),
      babel({
        babelrc: true,
        runtimeHelpers: true,
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
        externalHelpers: true,
      }),
      replace({
        exclude: 'node_modules/**',
        ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      }),
    ],
    external: ['loadsh'],
  },
  {
    input: entry,
    output: {
      name: name,
      file: `${main.slice(0, -2)}min.js`,
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      builtins(),
      resolve(),
      commonjs(),
      json(),
      babel({
        babelrc: true,
        runtimeHelpers: true,
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
        externalHelpers: true,
      }),
      replace({
        exclude: 'node_modules/**',
        ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      }),
      // uglify(),
    ],
    external: ['loadsh'],
  },
]
