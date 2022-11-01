import { ErrorPayload } from 'vite';

export const VITE_PLUGIN_VUE_TSC_CHECKER = 'vite-plugin-vue-ts-checker';

export const CHECKER_JSON_FILENAME = 'tsconfig.checker.json';

export type Config = {
    message: string;
    stack?: string;
    id: string;
    frame?: string;
    plugin?: string;
    loc: { file: string; line: number; column: number };
};

export function viteError(config: Config): ErrorPayload['err'] {
    return {
        message: config.message,
        stack: config.stack || '',
        id: config.id,
        frame: config.frame,
        plugin: config.plugin || VITE_PLUGIN_VUE_TSC_CHECKER,
        loc: {
            file: config.loc.file,
            line: config.loc.line,
            column: config.loc.column,
        },
    }
}

export function clearConsole() {
    process.stdout.write(
        process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    );
}
