const fs = require('fs');
const path = require('path');
const { getNpmPath } = require('./const')

// 简单写一个获取参数
const params = process.argv.slice(2).reduce((prev, current) => {
    const [key, value] = current.split('=');
    prev[key.replace(/^-+/, '')] = value ?? true;
    return prev;
}, {});


const formatDiagnosticsWithColorAndContextPath = require.resolve('../dist/restructure/formatDiagnosticsWithColorAndContext');
const createWatchStatusReporterPath = require.resolve('../dist/restructure/createWatchStatusReporter');

function addVueFilesToAllowExtensions() {
    return `
        // replaceFormatDiagnosticsWithColorAndContext
        tsc = tsc.replace(
            'ts.formatDiagnosticsWithColorAndContext = formatDiagnosticsWithColorAndContext;',
            'ts.formatDiagnosticsWithColorAndContext = require(${JSON.stringify(formatDiagnosticsWithColorAndContextPath)}).default;',
        );

        tsc = tsc.replace(
            'ts.createWatchStatusReporter = createWatchStatusReporter;',
            'ts.createWatchStatusReporter = require(${JSON.stringify(createWatchStatusReporterPath)}).default;',
        )

        return tsc;
    `
}

const vueTsc = path.join(getNpmPath(params.version), 'node_modules/vue-tsc/bin/vue-tsc.js');
const vueTscData = fs.readFileSync(vueTsc).toString();
// 如果没有替换
if (!vueTscData.includes('replaceFormatDiagnosticsWithColorAndContext')) {
    fs.writeFileSync(vueTsc, vueTscData.replace('return tsc;', addVueFilesToAllowExtensions()));
}
