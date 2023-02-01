import { ErrorPayload } from 'vite';
import readline from 'readline';

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

export function clearConsole(title = '') {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows);
        console.log(blank);
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        if (title) {
            console.log(title);
        }
    }
}
