const fs = require('fs');

const readFileSync = fs.readFileSync;
const tscPath = require.resolve('typescript/lib/tsc');
const proxyPath = require.resolve('../vue-ts-checker-npm-modules/node_modules/vue-tsc/out/proxy');
const formatDiagnosticsWithColorAndContextPath = require.resolve('../dist/restructure/formatDiagnosticsWithColorAndContext');
const createWatchStatusReporterPath = require.resolve('../dist/restructure/createWatchStatusReporter');

const cache = new Map();

// 修改的文件数据
let changeFiles = [];

process.on('message', (data) => {
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

function addVueFilesToAllowExtensions(tsc, proxyPath) {
    // add *.vue files to allow extensions
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

function save(filePath, value) {
    cache.set(filePath, value);
    return value;
}

function check(filePath, ...args) {
    if (cache.has(filePath)) {
        return cache.get(filePath);
    }
    const value = readFileSync(...args);
    return save(filePath, value);
}

// 重写 readFileSync
fs.readFileSync = (...args) => {
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
        changeFiles = changeFiles.filter((file) => file === filePath);
        const value = readFileSync(...args);
        return save(filePath, value);
    }

    return check(filePath, ...args);
};

require(tscPath);
