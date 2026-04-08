#!/usr/bin/env node
'use strict';

/**
 * update-wa.js — unified yebail maintenance script
 *
 * Usage:
 *   node scripts/update-wa.js [flags]
 *
 * Flags (combine freely):
 *   --proto    Fetch latest proto from WA Web, compile WAProto/index.js, sync per-module files
 *   --sync     Re-sync per-module files from the existing WAProto/index.js (no network fetch)
 *   --version  Update WA version in lib/Defaults/
 *   --all      Run --proto + --version  (default when no flag is given)
 */

const {
    existsSync, mkdirSync, mkdtempSync,
    readFileSync, readdirSync, rmSync, writeFileSync,
} = require('fs');
const { join }        = require('path');
const { tmpdir }      = require('os');
const { execFileSync } = require('child_process');

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT_DIR            = join(__dirname, '..');
const WA_PROTO_DIR        = join(ROOT_DIR, 'WAProto');
const SOURCE_PROTO_PATH   = join(WA_PROTO_DIR, 'WAProto.proto');
const BUNDLE_PATH         = join(WA_PROTO_DIR, 'index.js');
const YEBAIL_VERSION_PATH = join(ROOT_DIR, 'lib', 'Defaults', 'yebail-version.json');
const LIB_DEFAULTS_PATH   = join(ROOT_DIR, 'lib', 'Defaults', 'index.js');

const WA_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Sec-Fetch-Dest':  'script',
    'Sec-Fetch-Mode':  'no-cors',
    'Sec-Fetch-Site':  'same-origin',
    'Referer':         'https://web.whatsapp.com/',
    'Accept':          '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
};

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function fetchText(url) {
    const res = await fetch(url, { headers: WA_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return res.text();
}

// ─── Acorn install (temp) ─────────────────────────────────────────────────────

function installAcorn() {
    const depsRoot = mkdtempSync(join(tmpdir(), 'yebail-acorn-'));
    execFileSync('npm', ['install', '--no-save', '--prefix', depsRoot, 'acorn', 'acorn-walk'], {
        cwd: ROOT_DIR, stdio: 'inherit',
    });
    return depsRoot;
}

// ─── Proto extraction (AST parser — was proto-extract.js) ────────────────────

async function extractProtoSchema(acorn, walk) {
    const baseURL = 'https://web.whatsapp.com';

    // Fetch service-worker to find version + bootstrap URL
    const sw = await fetchText(`${baseURL}/sw.js`);

    const versions = [...sw.matchAll(/client_revision\\":(\d+),/g)].map(r => r[1]);
    const waVersion = `2.3000.${versions[0]}`;
    console.log(`[proto] WA version: ${waVersion}`);

    const clearSW = sw.replaceAll('/*BTDS*/', '');
    const urlMatches = clearSW.match(/(?<=importScripts\(["'])(.*?)(?=["']\);)/g);
    const bootstrapURL = new URL(urlMatches[0].replaceAll('\\', '')).href;
    console.log(`[proto] Bootstrap URL: ${bootstrapURL}`);

    let qrData = await fetchText(bootstrapURL);
    // Patch a type name that is split across two JS declarations
    qrData = qrData.replaceAll('LimitSharing$Trigger', 'LimitSharing$TriggerType');

    const qrModules = acorn.parse(qrData).body;

    // ── helpers ──────────────────────────────────────────────────────────────

    const addPrefix = (lines, prefix) => lines.map(l => prefix + l);

    const extractAllExpressions = (node) => {
        const out = [node];
        if (node.expression) out.push(node.expression);
        for (const arg of node?.expression?.arguments ?? []) {
            for (const exp of arg?.body?.body ?? []) out.push(...extractAllExpressions(exp));
        }
        for (const exp of node?.body?.body ?? []) {
            if (exp.expression) out.push(...extractAllExpressions(exp.expression));
        }
        for (const exp of node.expression?.expressions ?? []) out.push(...extractAllExpressions(exp));
        return out;
    };

    // Filter to modules that contain internalSpec assignments
    const modules = qrModules.filter(m =>
        extractAllExpressions(m).find(e => e?.left?.property?.name === 'internalSpec')
    );

    const unspecName   = n => n.endsWith('Spec') ? n.slice(0, -4) : n;
    const unnestName   = n => n.split('$').slice(-1)[0];
    const getNesting   = n => n.split('$').slice(0, -1).join('$');
    const rename       = n => unspecName(n);

    // ── pass 1: cross-refs & identifiers ─────────────────────────────────────

    const modulesInfo         = {};
    const moduleIndentationMap = {};

    for (const mod of modules) {
        const modName = mod.expression.arguments[0].value;
        modulesInfo[modName] = { crossRefs: [] };

        walk.simple(mod, {
            AssignmentExpression(node) {
                if (
                    node?.right?.type === 'CallExpression' &&
                    node?.right?.arguments?.length === 1 &&
                    node?.right?.arguments[0].type !== 'ObjectExpression'
                ) {
                    modulesInfo[modName].crossRefs.push({
                        alias:  node.left.name,
                        module: node.right.arguments[0].value,
                    });
                }
            },
        });
    }

    for (const mod of modules) {
        const modName = mod.expression.arguments[0].value;
        const modInfo = modulesInfo[modName];

        const assignments = [];
        walk.simple(mod, {
            AssignmentExpression(node) {
                const { left } = node;
                if (
                    left.property?.name &&
                    left.property.name !== 'internalSpec' &&
                    left.property.name !== 'internalDefaults' &&
                    left.property.name !== 'name'
                ) assignments.push(left);
            },
        });

        const makeBlankIdent = (a) => {
            const key         = rename(a?.property?.name);
            const indentation = getNesting(key);
            moduleIndentationMap[key] = moduleIndentationMap[key] || {};
            moduleIndentationMap[key].indentation = indentation;
            if (indentation.length) {
                moduleIndentationMap[indentation] = moduleIndentationMap[indentation] || {};
                moduleIndentationMap[indentation].members = moduleIndentationMap[indentation].members || new Set();
                moduleIndentationMap[indentation].members.add(key);
            }
            return [key, { name: key }];
        };

        modInfo.identifiers = Object.fromEntries(assignments.map(makeBlankIdent).reverse());

        const enumAliases = {};
        walk.ancestor(mod, {
            Property(node, anc) {
                const fatherNode   = anc[anc.length - 3];
                const fatherFather = anc[anc.length - 4];
                if (
                    fatherNode?.type === 'AssignmentExpression' &&
                    fatherNode?.left?.property?.name === 'internalSpec' &&
                    fatherNode?.right?.properties?.length
                ) {
                    const values    = fatherNode.right.properties.map(p => ({ name: p.key.name, id: p.value.value }));
                    enumAliases[fatherNode.left.name] = values;
                } else if (node?.key?.name && fatherNode?.arguments?.length > 0) {
                    const values   = fatherNode.arguments?.[0]?.properties?.map(p => ({ name: p.key.name, id: p.value.value }));
                    const nameAlias = fatherFather?.left?.name || fatherFather?.id?.name;
                    enumAliases[nameAlias] = values;
                }
            },
        });

        walk.simple(mod, {
            AssignmentExpression(node) {
                if (
                    node.left.type === 'MemberExpression' &&
                    modInfo.identifiers?.[rename(node.left.property.name)]
                ) {
                    const ident = modInfo.identifiers[rename(node.left.property.name)];
                    ident.alias      = node.right.name;
                    ident.enumValues = enumAliases[ident.alias];
                }
            },
        });
    }

    // ── pass 2: message specs ─────────────────────────────────────────────────

    for (const mod of modules) {
        const modName = mod.expression.arguments[0].value;
        const modInfo = modulesInfo[modName];

        const findByAlias = (obj, alias) => Object.values(obj).find(i => i.alias === alias);

        walk.simple(mod, {
            AssignmentExpression(node) {
                if (
                    node.left.type === 'MemberExpression' &&
                    node.left.property.name === 'internalSpec' &&
                    node.right.type === 'ObjectExpression'
                ) {
                    const targetIdent = Object.values(modInfo.identifiers).find(v => v.alias === node.left.object.name);
                    if (!targetIdent) {
                        console.warn(`[proto] Unknown identifier alias: ${node.left.object.name}`);
                        return;
                    }

                    const constraints = [];
                    let members = [];
                    for (const p of node.right.properties) {
                        p.key.name = p.key.type === 'Identifier' ? p.key.name : p.key.value;
                        (p.key.name.startsWith('__') ? constraints : members).push(p);
                    }

                    const unwrapBinaryOr = n =>
                        n.type === 'BinaryExpression' && n.operator === '|'
                            ? [...unwrapBinaryOr(n.left), ...unwrapBinaryOr(n.right)]
                            : [n];

                    members = members.map(({ key: { name }, value: { elements } }) => {
                        let type;
                        const flags = [];

                        unwrapBinaryOr(elements[1]).forEach(m => {
                            if (m.type === 'MemberExpression' && m.object.type === 'MemberExpression') {
                                if (m.object.property.name === 'TYPES') {
                                    type = m.property.name.toLowerCase();
                                    if (type === 'map' && elements[2]?.type === 'ArrayExpression') {
                                        let t = 'map<';
                                        elements[2].elements.forEach((el, i) => {
                                            t += el?.property?.name
                                                ? el.property.name.toLowerCase()
                                                : findByAlias(modInfo.identifiers, el.name)?.name;
                                            if (i < elements[2].elements.length - 1) t += ', ';
                                        });
                                        type = t + '>';
                                    }
                                } else if (m.object.property.name === 'FLAGS') {
                                    flags.push(m.property.name.toLowerCase());
                                }
                            }
                        });

                        if (type === 'message' || type === 'enum') {
                            const loc = ` (member '${name}' of '${targetIdent.name}')`;
                            if (elements[2].type === 'Identifier') {
                                type = Object.values(modInfo.identifiers).find(v => v.alias === elements[2].name)?.name;
                                if (!type) console.warn(`[proto] Missing alias '${elements[2].name}'${loc}`);
                            } else if (elements[2].type === 'MemberExpression') {
                                const crossRef = modInfo.crossRefs.find(r =>
                                    r.alias === elements[2]?.object?.name ||
                                    r.alias === elements[2]?.object?.left?.name ||
                                    r.alias === elements[2]?.object?.callee?.name
                                );
                                if (elements[1]?.property?.name === 'ENUM' && elements[2]?.property?.name?.includes('Type')) {
                                    type = rename(elements[2].property.name);
                                } else if (elements[2]?.property?.name?.includes('Spec')) {
                                    type = rename(elements[2].property.name);
                                } else if (
                                    crossRef &&
                                    crossRef.module !== '$InternalEnum' &&
                                    modulesInfo[crossRef.module]?.identifiers?.[rename(elements[2].property.name)]
                                ) {
                                    type = rename(elements[2].property.name);
                                } else {
                                    console.warn(`[proto] Unresolved cross-ref '${elements[2].object?.name}'${loc}`);
                                }
                            }
                        }

                        return { name, id: elements[0].value, type, flags };
                    });

                    // Resolve oneof constraints
                    for (const c of constraints) {
                        if (c.key.name === '__oneofs__' && c.value.type === 'ObjectExpression') {
                            members.push(...c.value.properties.map(p => ({
                                name:    p.key.name,
                                type:    '__oneof__',
                                members: p.value.elements.map(e => {
                                    const idx = members.findIndex(m => m.name === e.value);
                                    return members.splice(idx, 1)[0];
                                }),
                            })));
                        }
                    }

                    targetIdent.members = members;
                }
            },
        });
    }

    // ── pass 3: stringify to proto ────────────────────────────────────────────

    const indent = ' '.repeat(4);
    const decodedProtoMap = {};

    for (const mod of modules) {
        const modInfo     = modulesInfo[mod.expression.arguments[0].value];
        const identifiers = Object.values(modInfo.identifiers);

        const stringifyEnum = (ident, overrideName = null) => [
            `enum ${overrideName || ident.displayName || ident.name} {`,
            ...addPrefix(ident.enumValues.map(v => `${v.name} = ${v.id};`), indent),
            '}',
        ];

        const stringifyMember = (info, completeFlags, parentName) => {
            if (info.type === '__oneof__') {
                return [
                    `oneof ${info.name} {`,
                    ...addPrefix([].concat(...info.members.map(m => stringifyMember(m, false))), indent),
                    '}',
                ];
            }
            if (info.flags.includes('packed')) {
                info.flags.splice(info.flags.indexOf('packed'), 1);
                info.packed = ' [packed=true]';
            }
            if (completeFlags && info.flags.length === 0 && !info.type.includes('map')) {
                info.flags.push('optional');
            }
            const indentation = moduleIndentationMap[info.type]?.indentation;
            let typeName = unnestName(info.type);
            if (indentation !== parentName && indentation) {
                typeName = `${indentation.replaceAll('$', '.')}.${typeName}`;
            }
            const flagStr = info.flags.join(' ') + (info.flags.length ? ' ' : '');
            return [`${flagStr}${typeName} ${info.name} = ${info.id}${info.packed || ''};`];
        };

        const getEntity = (v) => {
            if (v.members)              return stringifyMessageSpec(v);
            if (v.enumValues?.length)   return stringifyEnum(v);
            return [`// Unknown entity ${v.name}`];
        };

        const stringifyMessageSpec = (ident) => {
            const result = [
                `message ${ident.displayName || ident.name} {`,
                ...addPrefix([].concat(...ident.members.map(m => stringifyMember(m, true, ident.name))), indent),
            ];
            const nestedKeys = moduleIndentationMap[ident.name]?.members;
            if (nestedKeys?.size) {
                for (const key of [...nestedKeys].sort()) {
                    const entity = modInfo.identifiers[key];
                    if (entity) {
                        const displayName = entity.name.slice(ident.name.length + 1);
                        result.push(...addPrefix(getEntity({ ...entity, displayName }), indent));
                    }
                }
            }
            result.push('}', '');
            return result;
        };

        for (const v of identifiers) {
            const { name } = v;
            if (!moduleIndentationMap[name]?.indentation?.length) {
                decodedProtoMap[name] = getEntity(v).join('\n');
            }
        }
    }

    const body = Object.keys(decodedProtoMap).sort().map(k => decodedProtoMap[k]).join('\n');
    return `syntax = "proto3";\npackage proto;\n\n/// WhatsApp Version: ${waVersion}\n\n${body}`;
}

// ─── Proto compilation (pbjs) ─────────────────────────────────────────────────

function compilePbjs(protoPath, outputPath) {
    execFileSync('npx', ['--yes', '-p', 'protobufjs-cli', 'pbjs', '-t', 'static-module', '-w', 'commonjs', '-o', outputPath, protoPath], {
        stdio: 'inherit',
    });
}

// ─── Per-module sync ──────────────────────────────────────────────────────────

function extractTopLevelTypes(bundleContent) {
    const pattern = /proto\.([A-Z][a-zA-Z]+) = \(function\(\)/g;
    const types = [];
    let m;
    while ((m = pattern.exec(bundleContent)) !== null) types.push(m[1]);
    return [...new Set(types)];
}

function extractProtoDefinition(bundleContent, typeName, waVersion) {
    const ifaceMatch = bundleContent.match(
        new RegExp(`@interface I${typeName}[\\s\\S]{0,3000}?\\*\\/`, 'm')
    );

    // Enum (no @interface)
    if (!ifaceMatch) {
        if (bundleContent.indexOf(`proto.${typeName} = (function() {\n        var valuesById`) === -1) return null;
        const enumDoc = bundleContent.match(
            new RegExp(`@name proto\\.${typeName}\\s*\\n[\\s\\S]{0,2000}?\\*\\/`, 'm')
        );
        if (!enumDoc) return null;
        const vals = [];
        const vp = /@property \{number\} (\w+)=(\d+)/g;
        let vm;
        while ((vm = vp.exec(enumDoc[0])) !== null) vals.push(`    ${vm[1]} = ${vm[2]};`);
        return [`syntax = "proto3";`, `package proto;`, ``, `/// WhatsApp Version: ${waVersion}`, ``, `enum ${typeName} {`, ...vals, `}`].join('\n') + '\n';
    }

    const props = [];
    const pp = /@property \{([^}]+)\} \[(\w+)\]/g;
    let pm;
    while ((pm = pp.exec(ifaceMatch[0])) !== null) props.push({ jsType: pm[1], name: pm[2] });

    const decodeStart = bundleContent.indexOf(`${typeName}.decode = function decode(reader, length`);
    const fieldIds = {}, fieldTypes = {}, repeatedFields = new Set();

    if (decodeStart !== -1) {
        const decodeEnd   = bundleContent.indexOf('return message;\n        };', decodeStart);
        const decodeBlock = bundleContent.substring(decodeStart, decodeEnd + 100);
        const cp = /case (\d+):\s*\{([^}]+)\}/gm;
        let cm;
        while ((cm = cp.exec(decodeBlock)) !== null) {
            const id    = parseInt(cm[1]);
            const body  = cm[2];
            const fname = body.match(/message\.(\w+)\s*(?:=|\.push\()/)?.[1];
            if (!fname) continue;
            fieldIds[fname] = id;
            if (body.includes('.push('))          repeatedFields.add(fname);
            if (body.includes('reader.string()')) fieldTypes[fname] = 'string';
            else if (body.includes('reader.int32()'))  fieldTypes[fname] = 'int32';
            else if (body.includes('reader.int64()'))  fieldTypes[fname] = 'int64';
            else if (body.includes('reader.uint32()')) fieldTypes[fname] = 'uint32';
            else if (body.includes('reader.uint64()')) fieldTypes[fname] = 'uint64';
            else if (body.includes('reader.bool()'))   fieldTypes[fname] = 'bool';
            else if (body.includes('reader.bytes()'))  fieldTypes[fname] = 'bytes';
            else if (body.includes('reader.float()'))  fieldTypes[fname] = 'float';
            else if (body.includes('reader.double()')) fieldTypes[fname] = 'double';
            else if (body.includes('reader.sint32()')) fieldTypes[fname] = 'sint32';
            else if (body.includes('reader.sint64()')) fieldTypes[fname] = 'sint64';
            else {
                const ref = body.match(/\$root\.proto\.([A-Z][a-zA-Z]+)\.decode/);
                if (ref) fieldTypes[fname] = ref[1];
            }
        }
    }

    const lines = [`syntax = "proto3";`, `package proto;`, ``, `/// WhatsApp Version: ${waVersion}`, ``, `message ${typeName} {`];
    const nestedEnums = new Set();

    for (const { jsType, name } of props) {
        const id = fieldIds[name];
        if (id === undefined) continue;
        const isRepeated = repeatedFields.has(name) || jsType.startsWith('Array.<');
        const prefix = isRepeated ? 'repeated' : 'optional';
        let protoType = fieldTypes[name];
        if (!protoType) {
            if (jsType.includes('string'))                                        protoType = 'string';
            else if (jsType.includes('boolean'))                                  protoType = 'bool';
            else if (jsType.includes('Uint8Array'))                               protoType = 'bytes';
            else if (jsType.includes('number|Long') || jsType.includes('Long|null')) protoType = 'int64';
            else if (jsType.includes('number'))                                   protoType = 'int32';
            else {
                const im = jsType.match(/Array\.<(?:proto\.I)?([A-Za-z]+)>/);
                if (im) protoType = im[1];
                else {
                    const pm2 = jsType.match(/proto\.I([A-Za-z]+)/);
                    protoType = pm2 ? pm2[1] : 'bytes';
                }
            }
        }
        if (jsType.includes(`${typeName}.`)) {
            const em = jsType.match(new RegExp(`${typeName}\\.([A-Z][a-zA-Z]+)`));
            if (em) { nestedEnums.add(em[1]); protoType = `${typeName}.${em[1]}`; }
        }
        lines.push(`    ${prefix} ${protoType} ${name} = ${id};`);
    }

    for (const enumName of nestedEnums) {
        const ed = bundleContent.match(new RegExp(`@name proto\\.${typeName}\\.${enumName}[\\s\\S]{0,2000}?\\*\\/`, 'm'));
        if (ed) {
            lines.push(`    enum ${enumName} {`);
            const vp = /@property \{number\} (\w+)=(\d+)/g;
            let vm;
            while ((vm = vp.exec(ed[0])) !== null) lines.push(`        ${vm[1]} = ${vm[2]};`);
            lines.push('    }');
        }
    }

    lines.push('}');
    return lines.join('\n') + '\n';
}

function syncPerModuleFiles(bundleContent, waVersion) {
    if (!waVersion) {
        const m = bundleContent.match(/WhatsApp Version: ([\d.]+)/);
        if (m) {
            waVersion = m[1];
        } else if (existsSync(YEBAIL_VERSION_PATH)) {
            waVersion = JSON.parse(readFileSync(YEBAIL_VERSION_PATH, 'utf8')).version.join('.');
        } else {
            waVersion = 'unknown';
        }
    }

    writeFileSync(YEBAIL_VERSION_PATH, JSON.stringify({ version: waVersion.split('.').map(Number) }) + '\n', 'utf8');

    const types = extractTopLevelTypes(bundleContent);
    console.log(`[sync] WA version: ${waVersion}`);
    console.log(`[sync] Found ${types.length} top-level proto types`);

    let created = 0, updated = 0;

    for (const typeName of types) {
        const typeDir = join(WA_PROTO_DIR, typeName);
        if (!existsSync(typeDir)) mkdirSync(typeDir, { recursive: true });

        const jsPath    = join(typeDir, `${typeName}.js`);
        const dtsPath   = join(typeDir, `${typeName}.d.ts`);
        const protoPath = join(typeDir, `${typeName}.proto`);
        const isNew     = !existsSync(jsPath);

        writeFileSync(jsPath, `"use strict";\n\nconst { proto } = require("../index");\n\nmodule.exports = {\n    ${typeName}: proto.${typeName}\n};\n`, 'utf8');
        writeFileSync(dtsPath, `export declare const ${typeName}: any;\n`, 'utf8');

        const def      = extractProtoDefinition(bundleContent, typeName, waVersion);
        const existing = existsSync(protoPath) ? readFileSync(protoPath, 'utf8') : '';
        if (def && existing !== def) {
            writeFileSync(protoPath, def, 'utf8');
            isNew ? created++ : updated++;
        }
    }

    // Remove obsolete type directories
    const typeSet = new Set(types);
    for (const entry of readdirSync(WA_PROTO_DIR, { withFileTypes: true })) {
        if (entry.isDirectory() && !typeSet.has(entry.name)) {
            console.log(`[sync] Removing obsolete: ${entry.name}`);
            rmSync(join(WA_PROTO_DIR, entry.name), { recursive: true, force: true });
        }
    }

    console.log(`[sync] Done: ${created} created, ${updated} updated`);
}

// ─── Version update (was update-wa-version.js) ───────────────────────────────

async function updateVersion() {
    console.log('[version] Fetching latest WA Web version…');

    const sw = await fetchText('https://web.whatsapp.com/sw.js');
    let match = null;
    for (const re of [/client_revision\\":(\d+)/, /client_revision":(\d+)/, /client_revision:(\d+)/]) {
        match = sw.match(re);
        if (match?.[1]) break;
    }
    if (!match?.[1]) throw new Error('[version] Could not find client_revision in sw.js');

    const version = [2, 3000, parseInt(match[1])];
    const vStr    = `[${version.join(', ')}]`;
    console.log(`[version] Latest: ${vStr}`);

    writeFileSync(YEBAIL_VERSION_PATH, JSON.stringify({ version }) + '\n', 'utf8');
    console.log(`[version] ✓ Updated lib/Defaults/yebail-version.json`);

    const defaultsContent = readFileSync(LIB_DEFAULTS_PATH, 'utf8');
    const updated = defaultsContent.replace(/exports\.version\s*=\s*\[\d+,\s*\d+,\s*\d+\]/g, `exports.version = ${vStr}`);
    if (updated !== defaultsContent) {
        writeFileSync(LIB_DEFAULTS_PATH, updated, 'utf8');
        console.log(`[version] ✓ Updated lib/Defaults/index.js`);
    } else {
        console.warn('[version] ! Could not find exports.version pattern in lib/Defaults/index.js');
    }
}

// ─── Full proto update ────────────────────────────────────────────────────────

async function updateProto() {
    const depsRoot = installAcorn();
    const nmPath   = join(depsRoot, 'node_modules');

    try {
        const acorn = require(join(nmPath, 'acorn'));
        const walk  = require(join(nmPath, 'acorn-walk'));

        const rawProto        = await extractProtoSchema(acorn, walk);
        const normalizedProto = rawProto.replace(/\brequired\s+/g, 'optional ');

        writeFileSync(SOURCE_PROTO_PATH, normalizedProto, 'utf8');

        try {
            compilePbjs(SOURCE_PROTO_PATH, BUNDLE_PATH);
        } finally {
            if (existsSync(SOURCE_PROTO_PATH)) rmSync(SOURCE_PROTO_PATH);
            const core = join(WA_PROTO_DIR, 'core.js');
            if (existsSync(core)) rmSync(core);
        }

        const waVersionMatch = normalizedProto.match(/WhatsApp Version: ([\d.]+)/);
        const waVersion      = waVersionMatch?.[1];
        syncPerModuleFiles(readFileSync(BUNDLE_PATH, 'utf8'), waVersion);
    } finally {
        rmSync(depsRoot, { recursive: true, force: true });
    }
}

// ─── Sync only ────────────────────────────────────────────────────────────────

function syncOnly() {
    if (!existsSync(BUNDLE_PATH)) {
        throw new Error(`WAProto/index.js not found at: ${BUNDLE_PATH}`);
    }
    syncPerModuleFiles(readFileSync(BUNDLE_PATH, 'utf8'));
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
    const args    = new Set(process.argv.slice(2));
    const doProto   = args.has('--proto') || args.has('--all') || args.size === 0;
    const doSync    = args.has('--sync');
    const doVersion = args.has('--version') || args.has('--all') || args.size === 0;

    if (doSync && !doProto) {
        syncOnly();
        return;
    }
    if (doProto)   await updateProto();
    if (doVersion) await updateVersion();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
