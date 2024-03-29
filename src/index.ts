import { ViteDevServer } from 'vite';
import { ChildProcess, fork, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CHECKER_JSON_FILENAME, clearConsole, VITE_PLUGIN_VUE_TSC_CHECKER } from './const';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ip from 'ip';

export function outputSuccessMessage(host: { ip: string, local: string }, port = 5173, https = false) {
    clearConsole();
    process.stdout.write(
        `${chalk.green('Check successfully!')}\n\n` +
        `${chalk.gray('You can now view project in the browser.')}\n\n` +
        `${chalk.green('  ➜')} ${chalk.gray('Local:')}   ${chalk.cyan(`${https ? 'https' : 'http'}://${host.local}:${port}`)}\n` +
        `${chalk.green('  ➜')} ${chalk.gray('Network:')} ${chalk.cyan(`${https ? 'https' : 'http'}://${host.ip}:${port}`)}\n\n` +
        `${chalk.green('No issues found.')}\n`
    );
}

const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url))

/**
 * 过滤文件
 * @param path 路径
 * @returns boolean
 */
const isTransformFile = (path: string) => {
    return path.endsWith('.vue') || path.endsWith('.ts') || path.endsWith('.tsx');
}

/**
 * 脚本
 * @param watch watch 模式
 * @returns ChildProcess
 */
const script = (isWatch: boolean, version?: string) => {
    const cwd = process.cwd();
    const packageName = cwd.split('/').pop();
    const hasCheckerJson = fs.existsSync(path.join(cwd, CHECKER_JSON_FILENAME));
    // version 拼接待优化
    return fork(
        path.join(_dirname, `../vue-ts-checker-npm-modules/${packageName}/${version}/node_modules/.bin/vue-tsc`),
        [
            '-p',
            hasCheckerJson ? CHECKER_JSON_FILENAME : 'tsconfig.json',
            isWatch ? '--watch' : '',
            '--noEmit',
            '--pretty',
        ].filter(Boolean),
        {
            stdio: 'inherit',
        }
    );
}

let devTsc: ChildProcess | null = null;

export default function VitePlugin(options?: {
    volar: {
        version: string;
    }
    registry: string;
}) {
    const version = options?.volar.version;
    // 检查版本
    spawnSync('node', [
        path.join(_dirname, '../scripts/index.js'),
        version ? `--version=${version}` : '',
        options?.registry ? `--registry=${options.registry}` : '',
    ].filter(Boolean), { stdio: 'inherit', shell: true });

    // 替换脚本
    spawnSync('node', [
        path.join(_dirname, '../scripts/replace.js'),
        version ? `--version=${version}` : '',
    ].filter(Boolean), { stdio: 'inherit', shell: true });

    return {
        name: VITE_PLUGIN_VUE_TSC_CHECKER,
        configureServer(server: ViteDevServer) {
            const { watcher, ws, restart } = server;
            if (devTsc) {
                devTsc.kill?.();
            }
            devTsc = script(true, version);
            devTsc.on('message', (error: any) => {
                if (error) {
                    ws?.send?.({
                        type: 'error',
                        err: error,
                    });
                } else {
                    ws?.send?.({
                        type: 'update',
                        updates: [],
                    });
                    const host = server.config.server.host;
                    // 输出 ip 信息
                    outputSuccessMessage({ ip: ip.address(), local: typeof host === 'string' ? (host || 'localhost') : 'localhost' }, server.config.server.port, !!server.config.server.https);
                }
            });
            // 新增跟修改保持一致
            const onChange = (path: string) => {
                // 重启
                if (path.endsWith('tsconfig.checker.json') || path.endsWith('tsconfig.json')) {
                    devTsc?.kill();
                    devTsc = null;
                    restart();
                    return;
                }
            }
            // 添加
            watcher.on('add', onChange);
            // 改变
            watcher.on('change', onChange);
            // 报错
            watcher.on('error', () => {
                devTsc?.kill?.();
                devTsc = null;
            });
            process.on('exit', () => {
                devTsc?.kill?.();
                devTsc = null;
            });
        },
        async buildStart() {
            // dev
            if (process.env.npm_lifecycle_event !== 'build') {
                return Promise.resolve();
            }
            // build
            return new Promise<void>((resolve, reject) => {
                const child = script(false, version);
                child.on('close', code => {
                    if (code === 0) {
                        resolve();
                    } else {
                        process.exit(1);
                    }
                })
            });
        },
    }
}
