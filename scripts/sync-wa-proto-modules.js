/**
 * sync-wa-proto-modules.js
 *
 * Regenerates all per-module wrapper files in WAProto/ from the existing
 * WAProto/index.js bundle WITHOUT fetching new proto from WhatsApp Web.
 *
 * Usage:
 *   node scripts/sync-wa-proto-modules.js
 *
 * This is useful when:
 *  - The bundled WAProto/index.js was already updated (e.g. via git pull)
 *  - You want to regenerate the individual <Type>.js / <Type>.d.ts / <Type>.proto files
 */

'use strict';

const { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = join(__dirname, '..');
const WA_PROTO_DIR = join(ROOT_DIR, 'WAProto');
const BUNDLE_PATH = join(WA_PROTO_DIR, 'index.js');
const YEBAIL_VERSION_PATH = join(ROOT_DIR, 'lib', 'Defaults', 'yebail-version.json');
const STUB_DTS = 'export = $root;\ndeclare var $root: any;\n';

if (!existsSync(BUNDLE_PATH)) {
    console.error(`[sync] WAProto/index.js not found at: ${BUNDLE_PATH}`);
    process.exit(1);
}

const bundleContent = readFileSync(BUNDLE_PATH, 'utf8');

function extractTopLevelTypes(content) {
    const types = [];
    const pattern = /proto\.([A-Z][a-zA-Z]+) = \(function\(\)/g;
    let m;
    while ((m = pattern.exec(content)) !== null) {
        types.push(m[1]);
    }
    return [...new Set(types)];
}

function extractProtoDefinition(content, typeName, waVersion) {
    const ifacePattern = new RegExp(
        `@interface I${typeName}[\\s\\S]{0,3000}?\\*\\/`,
        'm'
    );
    const ifaceMatch = content.match(ifacePattern);

    // Enum type (no @interface)
    const isEnum = !ifaceMatch;
    const enumBodyStart = content.indexOf(`proto.${typeName} = (function() {\n        var valuesById`);
    if (isEnum && enumBodyStart !== -1) {
        const enumDocPattern = new RegExp(
            `@name proto\\.${typeName}\\s*\\n[\\s\\S]{0,2000}?\\*\\/`,
            'm'
        );
        const enumDoc = content.match(enumDocPattern);
        if (!enumDoc) return null;

        const lines = [
            `syntax = "proto3";`,
            `package proto;`,
            ``,
            `/// WhatsApp Version: ${waVersion}`,
            ``,
            `enum ${typeName} {`,
        ];
        const valPattern = /@property \{number\} (\w+)=(\d+)/g;
        let vm;
        while ((vm = valPattern.exec(enumDoc[0])) !== null) {
            lines.push(`    ${vm[1]} = ${vm[2]};`);
        }
        lines.push(`}`);
        return lines.join('\n') + '\n';
    }

    if (!ifaceMatch) return null;

    const props = [];
    const propLinePattern = /@property \{([^}]+)\} \[(\w+)\]/g;
    let pm;
    while ((pm = propLinePattern.exec(ifaceMatch[0])) !== null) {
        props.push({ jsType: pm[1], name: pm[2] });
    }

    const decodeMarker = `${typeName}.decode = function decode(reader, length`;
    const decodeStart = content.indexOf(decodeMarker);
    const fieldIds = {};
    const fieldTypes = {};
    const repeatedFields = new Set();

    if (decodeStart !== -1) {
        const decodeEnd = content.indexOf('return message;\n        };', decodeStart);
        const decodeBlock = content.substring(decodeStart, decodeEnd + 100);

        const caseBlockPattern = /case (\d+):\s*\{([^}]+)\}/gm;
        let cm;
        while ((cm = caseBlockPattern.exec(decodeBlock)) !== null) {
            const fieldId = parseInt(cm[1]);
            const body = cm[2];
            const fieldMatch = body.match(/message\.(\w+)\s*(?:=|\.push\()/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];
                fieldIds[fieldName] = fieldId;
                if (body.includes('.push(')) repeatedFields.add(fieldName);
                if (body.includes('reader.string()')) fieldTypes[fieldName] = 'string';
                else if (body.includes('reader.int32()')) fieldTypes[fieldName] = 'int32';
                else if (body.includes('reader.int64()')) fieldTypes[fieldName] = 'int64';
                else if (body.includes('reader.uint32()')) fieldTypes[fieldName] = 'uint32';
                else if (body.includes('reader.uint64()')) fieldTypes[fieldName] = 'uint64';
                else if (body.includes('reader.bool()')) fieldTypes[fieldName] = 'bool';
                else if (body.includes('reader.bytes()')) fieldTypes[fieldName] = 'bytes';
                else if (body.includes('reader.float()')) fieldTypes[fieldName] = 'float';
                else if (body.includes('reader.double()')) fieldTypes[fieldName] = 'double';
                else if (body.includes('reader.sint32()')) fieldTypes[fieldName] = 'sint32';
                else if (body.includes('reader.sint64()')) fieldTypes[fieldName] = 'sint64';
                else {
                    const decodeRef = body.match(/\$root\.proto\.([A-Z][a-zA-Z]+)\.decode/);
                    if (decodeRef) fieldTypes[fieldName] = decodeRef[1];
                }
            }
        }
    }

    const lines = [
        `syntax = "proto3";`,
        `package proto;`,
        ``,
        `/// WhatsApp Version: ${waVersion}`,
        ``,
        `message ${typeName} {`,
    ];

    const nestedEnums = new Set();

    for (const prop of props) {
        const id = fieldIds[prop.name];
        if (id === undefined) continue;

        const isRepeated = repeatedFields.has(prop.name) || prop.jsType.startsWith('Array.<');
        const prefix = isRepeated ? 'repeated' : 'optional';

        let protoType = fieldTypes[prop.name];
        if (!protoType) {
            if (prop.jsType.includes('string')) protoType = 'string';
            else if (prop.jsType.includes('boolean')) protoType = 'bool';
            else if (prop.jsType.includes('Uint8Array')) protoType = 'bytes';
            else if (prop.jsType.includes('number|Long') || prop.jsType.includes('Long|null')) protoType = 'int64';
            else if (prop.jsType.includes('number')) protoType = 'int32';
            else {
                const innerM = prop.jsType.match(/Array\.<(?:proto\.I)?([A-Za-z]+)>/);
                if (innerM) protoType = innerM[1];
                else {
                    const protoM = prop.jsType.match(/proto\.I([A-Za-z]+)/);
                    if (protoM) protoType = protoM[1];
                    else protoType = 'bytes';
                }
            }
        }

        if (prop.jsType.includes(`${typeName}.`)) {
            const enumM = prop.jsType.match(new RegExp(`${typeName}\\.([A-Z][a-zA-Z]+)`));
            if (enumM) {
                nestedEnums.add(enumM[1]);
                protoType = `${typeName}.${enumM[1]}`;
            }
        }

        lines.push(`    ${prefix} ${protoType} ${prop.name} = ${id};`);
    }

    for (const enumName of nestedEnums) {
        const enumDoc = content.match(
            new RegExp(`@name proto\\.${typeName}\\.${enumName}[\\s\\S]{0,2000}?\\*\\/`, 'm')
        );
        if (enumDoc) {
            lines.push(`    enum ${enumName} {`);
            const valPattern = /@property \{number\} (\w+)=(\d+)/g;
            let vm;
            while ((vm = valPattern.exec(enumDoc[0])) !== null) {
                lines.push(`        ${vm[1]} = ${vm[2]};`);
            }
            lines.push(`    }`);
        }
    }

    lines.push(`}`);
    return lines.join('\n') + '\n';
}

const waVersionMatch = bundleContent.match(/WhatsApp Version: ([\d.]+)/);
const waVersionFromJson = existsSync(YEBAIL_VERSION_PATH)
    ? JSON.parse(readFileSync(YEBAIL_VERSION_PATH, 'utf8')).version.join('.')
    : null;
const waVersion = waVersionMatch ? waVersionMatch[1] : (waVersionFromJson || 'unknown');
const types = extractTopLevelTypes(bundleContent);

console.log(`[sync] WAProto version: ${waVersion}`);
console.log(`[sync] Found ${types.length} top-level proto types in index.js`);

let created = 0;
let updated = 0;

for (const typeName of types) {
    const typeDir = join(WA_PROTO_DIR, typeName);
    if (!existsSync(typeDir)) {
        mkdirSync(typeDir, { recursive: true });
    }

    const jsPath = join(typeDir, `${typeName}.js`);
    const dtsPath = join(typeDir, `${typeName}.d.ts`);
    const protoPath = join(typeDir, `${typeName}.proto`);

    const jsContent = `"use strict";\n\nconst { proto } = require("../index");\n\nmodule.exports = {\n    ${typeName}: proto.${typeName}\n};\n`;

    const isNew = !existsSync(jsPath);
    writeFileSync(jsPath, jsContent, 'utf8');
    if (!existsSync(dtsPath)) writeFileSync(dtsPath, STUB_DTS, 'utf8');

    const protoDef = extractProtoDefinition(bundleContent, typeName, waVersion);
    if (protoDef) {
        const existing = existsSync(protoPath) ? readFileSync(protoPath, 'utf8') : '';
        if (existing !== protoDef) {
            writeFileSync(protoPath, protoDef, 'utf8');
            if (isNew) created++; else updated++;
        }
    }
}

// Remove directories for types that no longer exist in index.js
const typeSet = new Set(types);
const entries = readdirSync(WA_PROTO_DIR, { withFileTypes: true });
for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!typeSet.has(entry.name)) {
        console.log(`[sync] Removing obsolete directory: ${entry.name}`);
        rmSync(join(WA_PROTO_DIR, entry.name), { recursive: true, force: true });
    }
}

console.log(`[sync] Done: ${created} created, ${updated} updated`);

// Regenerate TypeScript declarations
console.log('[build] Regenerating TypeScript declarations (yarn build:types)...');
try {
    execFileSync('yarn', ['build:types'], { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('[build] Type declarations updated.');
} catch (e) {
    console.warn('[build] yarn build:types failed (may need devDependencies installed):', e.message);
}
