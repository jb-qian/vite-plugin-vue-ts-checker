# vite-plugin-vue-ts-checker

### 强力的 `vue-ts` `vite` 插件

内部依赖与 `vscode` `volar` 插件底层依赖保持一致，避免出现编译与编辑器结果不一致的情况。

支持自动追踪 `volar` 最新版本，因为 `volar` 迭代速度非常快，避免出现长时间版本不更新导致结果不一致。

也支持锁定版本，避免 `volar` 更新后出现 bug，编辑器插件回滚版本后，结果不一致的问题。

```ts
// vite.config.js
{
    plugins: [
        VitePluginVueTsChecker(),
    ]
}
```

锁版本

```ts
// vite.config.js
{
    plugins: [
        VitePluginVueTsChecker({
            volar: {
                version: '0.38.8',
            },
        }),
    ]
}
```
