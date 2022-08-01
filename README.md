# vite-plugin-vue-ts-checker

### 强力的 `vue-ts` `vite` 插件

内部依赖 `vue-tsc` ，底层依赖保持一致，避免出现编译与编辑器结果不一致的情况。

支持自动追踪 `vue-tsc` 最新版本，因为 `vue-tsc` 迭代速度非常快，避免出现长时间版本不更新导致结果不一致。

也支持锁定版本，避免 `vue-tsc` 更新后出现 bug，编辑器插件回滚版本后，结果不一致的问题。

💥 建议使用版本绑定，避免进入流水线的时候，出现版本更新导致的错误。

```ts
// vite.config.js
{
    plugins: [
        VitePluginVueTsChecker({
            volar: {
                version: '0.39.4',
            },
        }),
    ]
}
```

非锁版本

```ts
// vite.config.js
{
    plugins: [
        VitePluginVueTsChecker(),
    ]
}
```
