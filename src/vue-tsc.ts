const fs = require('fs');

const readFileSync = fs.readFileSync;
const watchFile = fs.watchFile;
const tscPath = require.resolve('typescript/lib/tsc');
const proxyPath = require.resolve('./proxy');
const formatDiagnosticsWithColorAndContextPath = require.resolve('./restructure/formatDiagnosticsWithColorAndContext');
const createWatchStatusReporterPath = require.resolve('./restructure/createWatchStatusReporter');

const cache = new Map();

// 修改的文件数据
let changeFiles: string[] = [];

process.on('message', (data: { changeFile: string; deleteFile: string }) => {
    if (!changeFiles.includes(data.changeFile)) {
        changeFiles = [
            ...changeFiles,
            data.changeFile,
        ];
    }
    if (data.deleteFile) {
        changeFiles = changeFiles.filter(filePath => {
            return filePath !== data.deleteFile;
        });
        if (cache.has(data.deleteFile)) {
            cache.delete(data.deleteFile);
        }
    }
});

function addVueFilesToAllowExtensions(tsc: string, proxyPath: string) {
    tsc = tsc.replace(
        `ts.supportedTSExtensions = [[".ts", ".tsx", ".d.ts"], [".cts", ".d.cts"], [".mts", ".d.mts"]];`,
        `ts.supportedTSExtensions = [[".ts", ".tsx", ".d.ts"], [".cts", ".d.cts"], [".mts", ".d.mts"], [".vue", ".md", ".html"]];`,
    );
    tsc = tsc.replace(
        `ts.supportedJSExtensions = [[".js", ".jsx"], [".mjs"], [".cjs"]];`,
        `ts.supportedJSExtensions = [[".js", ".jsx"], [".mjs"], [".cjs"], [".vue", ".md", ".html"]];`,
    );
    tsc = tsc.replace(
        `var allSupportedExtensions = [[".ts", ".tsx", ".d.ts", ".js", ".jsx"], [".cts", ".d.cts", ".cjs"], [".mts", ".d.mts", ".mjs"]];`,
        `var allSupportedExtensions = [[".ts", ".tsx", ".d.ts", ".js", ".jsx"], [".cts", ".d.cts", ".cjs"], [".mts", ".d.mts", ".mjs"], [".vue", ".md", ".html"]];`,
    );

    // proxy createProgram apis
    tsc = tsc.replace(
        `function createIncrementalProgram(_a) {`,
        `function createIncrementalProgram(_a) { console.error('incremental mode is not yet supported'); throw 'incremental mode is not yet supported';`,
    );
    tsc = tsc.replace(
        `function createProgram(rootNamesOrOptions, _options, _host, _oldProgram, _configFileParsingDiagnostics) {`,
        `function createProgram(rootNamesOrOptions, _options, _host, _oldProgram, _configFileParsingDiagnostics) { return require(${JSON.stringify(proxyPath)}).createProgramProxy(...arguments);`,
    );

    // proxy tracing
    tsc = tsc.replace(
        `ts.startTracing = tracingEnabled.startTracing;`,
        `ts.startTracing = require(${JSON.stringify(proxyPath)}).loadTsLib().startTracing;`,
    );

    tsc = tsc.replace(
        `ts.dumpTracingLegend = tracingEnabled.dumpLegend;`,
        `ts.dumpTracingLegend = require(${JSON.stringify(proxyPath)}).loadTsLib().dumpTracingLegend;`,
    );
    // 替换输出文案方法
    tsc = tsc.replace(
        `ts.formatDiagnosticsWithColorAndContext = formatDiagnosticsWithColorAndContext;`,
        `ts.formatDiagnosticsWithColorAndContext = require(${JSON.stringify(formatDiagnosticsWithColorAndContextPath)}).default;`,
    );

    tsc = tsc.replace(
        `ts.createWatchStatusReporter = createWatchStatusReporter;`,
        `ts.createWatchStatusReporter = require(${JSON.stringify(createWatchStatusReporterPath)}).default;`,
    )

    return tsc;
}

function save(filePath: string, value: string) {
    cache.set(filePath, value);
    return value;
}

function check(filePath: string, ...args: string[]): string {
    if (cache.has(filePath)) {
        return cache.get(filePath);
    }
    const value = readFileSync(...args);
    return save(filePath, value);
}

// 重写 readFileSync
fs.readFileSync = (...args: string[]) => {
    // 路径
    const filePath = args[0];

    if (filePath === tscPath) {
        if (cache.has(filePath)) {
            return cache.get(filePath);
        }
        const value = addVueFilesToAllowExtensions(readFileSync(...args), proxyPath);
        return save(filePath, value);
    }

    if (changeFiles.includes(filePath)) {
        changeFiles = changeFiles.filter((file: string) => file === filePath);
        const value = readFileSync(...args);
        return save(filePath, value);
    }

    return check(filePath, ...args);
};

function debounce(func: { apply: (arg0: any, arg1: any[]) => void; }, wait = 30) {
	let timer: NodeJS.Timeout | null = null;
	return (...params: any) => {
		timer && clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(null, params);
		}, wait);
	};
}

fs.watchFile = (...args: any[]) => {
    const arg1 = args[1];
    const isFn = typeof arg1 === 'function';
    watchFile(args[0], isFn ? debounce(arg1) : arg1, isFn ? undefined : debounce(args[2]));
};

require(tscPath);
