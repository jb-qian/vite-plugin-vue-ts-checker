import * as ts from 'typescript/lib/tsserverlibrary';
import { viteError } from '../const';

type ErrorMessageText = { indent: string, lineContent: string, type: 'code' | 'underline' };

type ContextType = {
    code: string;
    messageText: string;
    errorMessageTexts: ErrorMessageText[];
    fileName: string;
    line: number;
    column: number;
};

export enum ForegroundColorEscapeSequences {
    Grey = "\u001b[90m",
    Red = "\u001b[91m",
    Yellow = "\u001B[33m",
    Cyan = "\u001B[36m"
}

const spaceString = ' ';

export function formatColorAndReset(text: string, formatStyle: ForegroundColorEscapeSequences) {
    return formatStyle + text + "\u001b[0m";
}

function tsCodeString(code: string): string {
    return 'TS'.concat(code, ': ');
}

function trimEndImpl(str: string) {
    var end = str.length - 1;
    while (end >= 0) {
        if (!ts.isWhiteSpaceLike(str.charCodeAt(end)))
            break;
        end--;
    }
    return str.slice(0, end + 1);
}

const trimStringEnd = !!String.prototype.trimEnd ? (function (s: string) { return s.trimEnd(); }) : trimEndImpl;

function getIndents(number: number, lastLine: number): [string, string, string, string, string, string] {
    return [spaceString, '|', spaceString, `${number + 1}`, spaceString, number === lastLine ? '>' : spaceString];
}

function getTrueLength(str: string){
    const arr = Array.from(str);
    const len = arr.length;
    let truelen = 0;
    for(let i = 0; i < len; i++){
        if(arr[i].charCodeAt(0) > 128){
            truelen += 2;
        }else{
            truelen += 1;
        }
    }
    return truelen;
}

function createErrorMessage(file: ts.SourceFileLike, start: number, length: number, host: ts.FormatDiagnosticsHost) {
    const first = ts.getLineAndCharacterOfPosition(file, start);
    const last = ts.getLineAndCharacterOfPosition(file, start + length);
    const fileLength = file.text.match(/\n/g)?.length || 0;
    const firstLine = Math.max(first.line - 2, 0);
    const lastLine = Math.min(last.line + 2, fileLength);
    const centerLine = last.line;
    const firstLineChar = first.character;
    const contexts: ErrorMessageText[] = [];
    const spaces: number[] = [];
    const lastLineInFile = ts.getLineAndCharacterOfPosition(file, file.text.length).line;
    for (let i = firstLine; i <= lastLine; i++) {
        const lineStart = ts.getPositionOfLineAndCharacter(file, i, 0);
        const lineEnd = i < lastLineInFile ? ts.getPositionOfLineAndCharacter(file, i + 1, 0) : file.text.length;
        const lineContent = trimStringEnd(file.text.slice(lineStart, lineEnd)).replace(/\t/g, spaceString) || '...';
        const len = Math.max((lastLine + 1).toString().length - (i + 1).toString().length, 0);
        const indent = getIndents(i, centerLine).concat(spaceString.repeat(len)).reverse().join('');
        contexts.push({
            type: 'code',
            indent,
            lineContent,
        });
        const space = lineContent.match(/^\s+/)?.[0].length || 0;
        spaces.push(space);
        // 添加错误标注
        if (i === centerLine) {
            const errorLine = contexts[contexts.length - 1];
            contexts.push({
                type: 'underline',
                indent: spaceString.repeat(getTrueLength(errorLine.indent)),
                lineContent: spaceString.repeat(getTrueLength(errorLine.lineContent.slice(0, firstLineChar))) + '~'.repeat(getTrueLength(errorLine.lineContent.slice(firstLineChar, firstLineChar + length))),
            });
        }
    }
    const minspace = Math.max(Math.min(...spaces), 0);
    return contexts.map(context => {
        return {
            ...context,
            lineContent: context.lineContent.replace(new RegExp(`^${spaceString.repeat(minspace)}`), ''),
        }
    });
}

function createViteErrorMessage(context: ContextType, host: ts.FormatDiagnosticsHost): string {
    return [
        tsCodeString(context.code),
        context.messageText,
        host.getNewLine(),
        host.getNewLine(),
        context.errorMessageTexts.map(message => {
            return message.indent + message.lineContent;
        }).join(host.getNewLine()),
    ].join('');
}

function createShellErrorMessage(contexts: ContextType[], host: ts.FormatDiagnosticsHost): string {
    return contexts.map(context => {
        return [
            formatColorAndReset(context.fileName, ForegroundColorEscapeSequences.Cyan),
            host.getNewLine(),
            formatColorAndReset(tsCodeString(context.code), ForegroundColorEscapeSequences.Grey),
            formatColorAndReset(context.messageText, ForegroundColorEscapeSequences.Yellow),
            host.getNewLine(),
            host.getNewLine(),
            context.errorMessageTexts.map(message => {
                const text = message.indent + message.lineContent;
                if (message.type === 'underline') {
                    return formatColorAndReset(text, ForegroundColorEscapeSequences.Red)
                }
                return text;
            }).join(host.getNewLine()),
        ].join('');
    }).concat(spaceString).join(host.getNewLine());
}

export default function formatDiagnosticsWithColorAndContext(diagnostics: readonly ts.Diagnostic[], host: ts.FormatDiagnosticsHost) {
    const contexts: ContextType[] = [];
    for (let i = 0; i < diagnostics.length; i++) {
        const diagnostic = diagnostics[i];
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
            const fileName = diagnostic.file.fileName;
            contexts.push({
                code: diagnostic.code.toString(),
                messageText: ts.flattenDiagnosticMessageText(diagnostic.messageText, host.getNewLine()),
                errorMessageTexts: createErrorMessage(diagnostic.file, diagnostic.start!, diagnostic.length!, host),
                fileName,
                line: line + 1,
                column: character + 1,
            });
        } else {
            const messageText = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText;
            // exclude src
            if (diagnostic.code === 18003) {
                const [, title = '', fileName = '', message = ''] = messageText.match(/^([^\']+)(\'.+?\'\.)(.+)/) || [];
                contexts.push({
                    code: diagnostic.code.toString(),
                    messageText: title.trim(),
                    errorMessageTexts: [{
                        indent: '',
                        lineContent: message.trim(),
                        type: 'code',
                    }],
                    fileName: fileName.trim().replace(/\'/g, ''),
                    line: 0,
                    column: 0,
                });
            }
        }
    }
    if (contexts.length > 0) {
        // 只推送最后一个
        const context = contexts[contexts.length - 1];
        process.send?.(viteError({
            message: createViteErrorMessage(context, host),
            id: context.fileName,
            loc: {
                line: context.line,
                column: context.column,
                file: context.fileName,
            },
        }));
    }
    // 全部输出
    return createShellErrorMessage(contexts, host);
}
