import { ViteDevServer } from 'vite';
import { ChildProcess, fork, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CHECKER_JSON_FILENAME, clearConsole, VITE_PLUGIN_VUE_TSC_CHECKER } from './const';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as chalk from 'chalk';

export function outputSuccessMessage(host: string, port: string) {
    clearConsole();
    process.stdout.write(
        `${chalk.green('Check successfully!')}\n\n` +
        `${chalk.gray('You can now view project in the browser.')}\n\n` +
        `${chalk.green('  ➜')} ${chalk.gray('Local:')}   ${chalk.cyan(`http://localhost:${host}`)}\n` +
        `${chalk.green('  ➜')} ${chalk.gray('Network:')} ${chalk.cyan(`http://172.18.108.11:${host}/`)}\n\n` +
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
const script = (isWatch: boolean) => {
    const hasCheckerJson = fs.existsSync(path.join(process.cwd(), CHECKER_JSON_FILENAME));
    return fork(
        path.join(_dirname, '../scripts/vueTsc.js'),
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
        version: string,
    }
}) {
    // 检查版本
    spawnSync('node', [
        path.join(_dirname, '../scripts/index.js'),
        options?.volar.version ? `--version=${options.volar.version}` : ''
    ].filter(Boolean), { stdio: 'inherit', shell: true });

    return {
        name: VITE_PLUGIN_VUE_TSC_CHECKER,
        configureServer(server: ViteDevServer) {
            const { watcher, ws, restart } = server;
            if (devTsc) {
                devTsc.kill?.();
            }
            setTimeout(() => {
                devTsc?.emit('port', server?.httpServer?.address());
            });
            devTsc = script(true);
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
                    outputSuccessMessage(server);
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
                // 过滤文件
                if (!isTransformFile(path)) {
                    return;
                }
                devTsc?.send({ changeFile: path });
            }
            // 添加
            watcher.on('add', onChange);
            // 改变
            watcher.on('change', onChange);
            // 删除
            watcher.on('unlink', (path: string) => {
                // 过滤文件
                if (!isTransformFile(path)) {
                    return;
                }
                devTsc?.send({ deleteFile: path });
            });
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
                const child = script(false);
                child.on('close', code => {
                    if (code === 0) {
                        resolve();
                    } else {
                        process.exit(1);
                        reject();
                    }
                })
            });
        },
    }
}
