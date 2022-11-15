const fs = require('fs');
const path = require('path');

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

const vueTsc = path.join(__dirname, '../vue-ts-checker-npm-modules/node_modules/vue-tsc/bin/vue-tsc.js');
const vueTscData = fs.readFileSync(vueTsc).toString();
// 如果没有替换
if (!vueTscData.includes('replaceFormatDiagnosticsWithColorAndContext')) {
    fs.writeFileSync(vueTsc, vueTscData.replace('return tsc;', addVueFilesToAllowExtensions()));
}
