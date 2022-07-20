import * as ts from 'typescript/lib/tsserverlibrary';

const screenStartingMessageCodes = [
    6031,
    6032,
];

function contains(array: number[], value: number) {
    if (array) {
        for (let i = 0; i < array.length; i++) {
            const _value = array[i];
            if (_value === value) {
                return true;
            }
        }
    }
    return false;
}

export function clearConsole() {
    process.stdout.write(
        process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    );
}

function clearScreenIfNotWatchingForFileChanges(diagnostic: ts.Diagnostic, options: ts.CompilerOptions) {
    if (!options.preserveWatchOutput && !options.extendedDiagnostics && !options.diagnostics && contains(screenStartingMessageCodes, diagnostic.code)) {
        clearConsole();
        return true;
    }
    return false;
}

function getPlainDiagnosticFollowingNewLines(diagnostic: ts.Diagnostic, newLine: string) {
    return contains(screenStartingMessageCodes, diagnostic.code)
        ? newLine + newLine
        : newLine;
}

export default function createWatchStatusReporter(system: ts.System, pretty: boolean) {
    return !!pretty ?
        function (diagnostic: ts.Diagnostic, newLine: string, options: ts.CompilerOptions) {
            clearScreenIfNotWatchingForFileChanges(diagnostic, options);
            let output = '';
            output += ''.concat(ts.flattenDiagnosticMessageText(diagnostic.messageText, system.newLine)).concat(newLine + newLine);
            system.write(output);
            // 0 错误结束
            if (Number(output.match(/Found\s*(\d+)\s*error/)?.[1] || 0) === 0) {
                process.send?.('');
            }
        } :
        function (diagnostic: ts.Diagnostic, newLine: string, options: ts.CompilerOptions) {
            let output = '';
            if (!clearScreenIfNotWatchingForFileChanges(diagnostic, options)) {
                output += newLine;
            }
            output += ''.concat(ts.flattenDiagnosticMessageText(diagnostic.messageText, system.newLine)).concat(getPlainDiagnosticFollowingNewLines(diagnostic, newLine));
            system.write(output);
            if (Number(output.match(/Found\s*(\d+)\s*error/)?.[1] || 0) === 0) {
                process.send?.('');
            }
        };
}
