const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const PROTO_SOURCE_URL = 'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/WAProto/WAProto.proto';
const WA_PROTO_DIR = join(__dirname, '..', 'WAProto');
const SOURCE_PROTO_PATH = join(WA_PROTO_DIR, 'WAProto.proto');
const BUNDLE_PATH = join(WA_PROTO_DIR, 'index.js');

async function loadProtoSource() {
    if (existsSync(SOURCE_PROTO_PATH)) {
        return readFileSync(SOURCE_PROTO_PATH, 'utf8');
    }

    const response = await fetch(PROTO_SOURCE_URL, {
        headers: {
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch WAProto.proto: ${response.statusText}`);
    }

    return await response.text();
}

function countBraces(line) {
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    return open - close;
}

function splitProtoSource(source) {
    const lines = source.split(/\r?\n/);
    const header = [];
    const definitions = [];
    let current = null;
    let sawDefinition = false;

    for (const line of lines) {
        const match = line.match(/^(message|enum)\s+([A-Za-z0-9_]+)\s*\{/);

        if (!current && match) {
            sawDefinition = true;
            current = {
                name: match[2],
                lines: [line],
                depth: countBraces(line),
            };
            continue;
        }

        if (!current) {
            if (!sawDefinition) {
                header.push(line);
            }
            continue;
        }

        current.lines.push(line);
        current.depth += countBraces(line);

        if (current.depth === 0) {
            definitions.push(current);
            current = null;
        }
    }

    if (current) {
        definitions.push(current);
    }

    return { header, definitions };
}

function writeSplitProtoFiles(source, definitions) {
    const header = splitProtoSource(source).header.join('\n').replace(/\s+$/u, '');
    const baseHeader = header ? `${header}\n\n` : '';

    for (const definition of definitions) {
        const definitionDir = join(WA_PROTO_DIR, definition.name);
        mkdirSync(definitionDir, { recursive: true });
        writeFileSync(join(definitionDir, `${definition.name}.proto`), `${baseHeader}${definition.lines.join('\n')}\n`);
    }
}

function writeModuleWrappers(definitions) {
    for (const definition of definitions) {
        const definitionDir = join(WA_PROTO_DIR, definition.name);
        writeFileSync(join(definitionDir, `${definition.name}.js`), [
            '"use strict";',
            '',
            'const { proto } = require("../index");',
            '',
            'module.exports = {',
            `    ${definition.name}: proto.${definition.name}`,
            '};',
            ''
        ].join('\n'));
    }
}

function runPbjs(protoPath, outputPath) {
    execFileSync('npx', ['--yes', '-p', 'protobufjs-cli', 'pbjs', '-t', 'static-module', '-w', 'commonjs', '-o', outputPath, protoPath], {
        stdio: 'inherit'
    });
}

async function main() {
    const source = await loadProtoSource();
    const { definitions } = splitProtoSource(source);

    writeFileSync(SOURCE_PROTO_PATH, source);
    runPbjs(SOURCE_PROTO_PATH, BUNDLE_PATH);
    writeSplitProtoFiles(source, definitions);
    writeModuleWrappers(definitions);

    if (existsSync(SOURCE_PROTO_PATH)) {
        rmSync(SOURCE_PROTO_PATH);
    }

    const corePath = join(WA_PROTO_DIR, 'core.js');
    if (existsSync(corePath)) {
        rmSync(corePath);
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});