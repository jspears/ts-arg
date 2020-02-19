/**
 * @remarks
 * This module is meant to allow quick and easy command line argument parsing.   It does not intend to be a full
 * fledged DI system.  It is meant to be a basic parser but strives for convience and correctness in parsing.
 *
 */
import chalk from "chalk";
import * as fs from 'fs';
import "reflect-metadata";
import {ArgType, HelpFn, Converter, ConverterMap, ConfigOptions, ParserFn, Resolution} from "./types";

const argMetadataKey = Symbol("argMetadataKey");
const configMetadataKey = Symbol("configMetatdataKey");

const isArrayType = (v: ArgType) => v.itemType != null || v.type === Array || (typeof v.type == 'string' && v.type.endsWith('[]'));

const arrayType = (v: ArgType): string | any => v.itemType != null ? v.itemType : typeof v.type === 'string'
    ? v.type.replace(/\[\]$/, '') || 'string' : 'string';

const _niceType = (type: any): string => {
    if (isBoolean(type)) {
        return 'boolean';
    }
    if (type === Number || type === 'number' || type === 'Number') {
        return 'number';
    }
    if (type === String || type === 'string' || type === 'String') {
        return 'string';
    }
    if (type === Date || type === 'Date') {
        return 'Date';
    }
    if (type === Symbol || type == 'symbol') {
        return 'symbol';
    }
    if (type === Array || type === 'Array' || /\[\]$/.test(type)) {
        return '[]';
    }
    if (type instanceof RegExp) {
        return 'RegExp';
    }
    return 'string';

};
const niceType = (v: ArgType): string => isArrayType(v) ?
    `${v.itemType ? _niceType(v.itemType) : ''}[]` : _niceType(v.type);

const niceKey = (v: ArgType): string | number => typeof v.key == 'symbol' ? v.long : v.key;

const isBoolean = (v: any): boolean => (v === Boolean || v === 'boolean' || v === 'Boolean');

const RESOLUTION: Resolution[] = [Resolution.ARG, Resolution.ENV, Resolution.FILE, Resolution.PACKAGE];

const addArg = (target: any, conf: ArgType, propertyKey: string | symbol, type: any): ArgType[] => {
    const arg: ArgType = {
        key: propertyKey,
        long: typeof propertyKey === 'symbol' ? conf.long : propertyKey,
        short: (conf.long || propertyKey)[0],
        type,
        ...conf
    };
    const m = Reflect.getMetadata(argMetadataKey, target) as ArgType[];

    if (m) {
        const sameLongOrShort = m.find(({long, short}) => long == arg.long || short == arg.short);
        if (sameLongOrShort) {
            throw `Can not have 2 properties with same long or short names. '${sameLongOrShort.long}' or '${sameLongOrShort.short}' is already used, check '${niceKey(sameLongOrShort)}'.`;
        }
        if (arg.default) {
            const hasDefault = m.find(v => v.default);
            if (hasDefault) {
                throw `There are multiple properties marked as default, check '${niceKey(hasDefault)}'`;
            }
        }
        m.push(arg);
        return m;
    }
    const ret = [arg];
    Reflect.metadata(argMetadataKey, ret)(target);
    return ret;
};

/**
 * This a decorator for properties fields in typescript classes.
 * @param description - Either a description a converter or a configuration argument.
 **/
export function Arg(description?: ArgType | string | Converter) {
    const conf = description == null ? {} : typeof description === 'string' ? {description} : typeof description == 'function' ? {converter: description} : description;

    return function (target: any, propertyKey?: string | symbol) {
        addArg(target, conf, propertyKey, Reflect.getMetadata("design:type", target, propertyKey));
    }
}

/**
 * This a decorator for classes to provide env and file support.
 * @param prefix - Either a description a converter or a configuration argument.
 **/
export function Config(prefix?: ConfigOptions | string | ParserFn) {


    return function (target: any) {
        const config = prefix == null ? {prefix: target.name} : typeof prefix === 'string' ? {prefix} : typeof prefix == 'function' ? {
            prefix: target.name,
            parser: prefix
        } : prefix;
        Reflect.defineMetadata(configMetadataKey, {
            envPrefix: config.prefix.toUpperCase(),
            argPrefix: config.prefix,
            rcFile: `.${config.prefix}`,
            packageKey: config.prefix,
            resolution: RESOLUTION,
            parser(file) {
                return fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8'));
            },
            ...config,

        }, target);
    }
}


const strFn = (v: string) => v;
const jsonFn = (v: string) => JSON.parse(v);
const splitFn = (v) => v.split(/,\s*/);
const dateFn = (v) => new Date(v);
const regexFn = (v) => {
    if (v.startsWith('/') && v.endsWith('/')) {
        return new RegExp(v);
    }
    const parts = /^\/(.+?)\/(gimus)$/.exec(v);
    if (parts) {
        return new RegExp(parts[1], parts[2]);
    }
    return new RegExp(`/${v}/`);
};
const boolFn = (v) => /true|1|"true"/i.test(v);

export const CONVERTERS = new Map<any, Converter>([
    ['Int', v => parseInt(v, 10)],
    ['Number', parseFloat],
    ['number', parseFloat],
    ['Boolean', boolFn],
    ['boolean', boolFn],
    ['String', strFn],
    ['string', strFn],
    ['JSON', jsonFn],
    ['Date', dateFn],
    ['[]', splitFn],
    ['Array', splitFn],
    ['RegExp', regexFn],
    [Number, parseFloat],
    [String, strFn],
    [Boolean, boolFn],
    [Date, dateFn],
    [Array, splitFn],
    [RegExp, regexFn]
]);
const _usage = (conf: ArgType[]): string => {
    const shorts = conf.filter(v => !v.default).map(v => v.short).join('');
    const def = conf.find(v => v.default);
    if (def) {
        return `-${shorts} ${isArrayType(def) ? `[${def.long} ...]` : def.long}`
    }
    return `-${shorts}`;
};


const _help: HelpFn = (script: string, conf: ArgType[], message?: string): void => {

    const sorted = conf.concat().sort((a, b) => {

        if (a.required != b.required) {
            return a.required ? -1 : 1;
        }
        return a.default ? 1 : a.long.localeCompare(b.long);
    });

    if (message) {
        message = `${chalk.red('Error')}: ${message}\n\n`
    }
    console.warn(`${message || ''}${script}\nusage: ${_usage(sorted)}
${sorted.map(v => `  ${v.required ? '*' : ' '} --${v.long}\t-${v.short}\t${v.description || ''} `).join('\n')}

`);

    return;
};

type ArgTypeInt = ArgType & {
    _long: string
}

/**
 * Configures an object from command line arguments
 * @param target - Is the object to configure
 * @param args - `process.argv` or your own array of strings.
 * @param converters - A Map of converters that take a string and return a value.
 * @param help - A function for help, this one call on invocation, you may not want that.
 */
export const configure = <T>(target: T,
                             args: string[] = process.argv,
                             env: Record<string, string> = process.env,
                             converters: ConverterMap = CONVERTERS,
                             help: HelpFn = _help): T | undefined | void => {

    const conf = Reflect.getMetadata(configMetadataKey, target.constructor) as ConfigOptions;
    const resolution: Resolution[] = conf?.resolution || [Resolution.ARG];

    const script = args[1];
    const argumentConfsOrig = Reflect.getMetadata(argMetadataKey, target) as ArgType[];
    const argumentConfs: ArgTypeInt[] = conf?.argPrefix ? argumentConfsOrig.map(v => ({
        ...v,
        short: `${conf.argPrefix}-${v.short}`,
        long: `${conf.argPrefix}-${v.long}`,
        _long: v.long,
    })) : argumentConfsOrig.map((v) => ({...v, _long: v.long}));

    if (args.includes('-h') || args.includes('--help')) {
        return help(script, argumentConfs);
    }
    const order = [];
    order[Resolution.ARG] = (): boolean => {
        const local = {};
        for (let i = 2; i < args.length; i++) {
            const [arg, value] = args[i].split('=', 2);
            const found = argumentConfs.find(v => {
                if (arg === `-${v.short}` || arg === `--${v.long}`) {
                    return true;
                }
                return isBoolean(v.type) && arg === `--no-${v.long}`;
            });

            //Keep found because if a default option is present it will suck up the rest of the values.
            const c = found || argumentConfs.find(v => v.default);

            if (!c) {
                help(script, argumentConfs, `Unknown argument '${arg}'`);
                return true;
            }

            if (isBoolean(c.type)) {
                const convert = c.converter || converters.get(c.type) || boolFn;
                local[c.key] = value != null ? convert(value) : !arg.startsWith('--no-');
            } else {
                const convert = c.converter || converters.get(c.type) || strFn;

                try {
                    const unparsedValue = value != null ? value : found ? args[++i] : args[i];
                    if (isArrayType(c)) {
                        //TODO -- We need to allow
                        // multiple argument calls --arg 1 --arg 2  == [1,2] while env.ARG=3 should not get pushed on top.
                        // Depending on order of course.
                        local[c.key] = [
                            ...(local[c.key] || []),
                            ...(c.converter || converters.get(c.type) || splitFn)(unparsedValue).map(v => (converters.get(arrayType(c)) || strFn)(v))
                        ];
                    } else {
                        local[c.key] = convert(unparsedValue);
                    }
                } catch (e) {
                    help(script, argumentConfs, `Converting '${value ?? args[i]}' to type '${niceType(c.type)}' failed\n ${e.message || e}`);
                    return true;
                }
            }
        }
        Object.assign(target, local);
        return false;
    };

    order[Resolution.ENV] = (): boolean => !!argumentConfs.find((c) => {
        const key = `${conf?.envPrefix ? conf.envPrefix + '_' : ''}${c._long}`.toUpperCase();
        if (isBoolean(c.type)) {
            const negKey = (`NO_${key}` in env);
            const convert = c.converter || converters.get(c.type) || boolFn;
            const value = env[`NO_${key}`] ?? env[key];
            if (negKey || env[key]) {
                target[c.key] = negKey ? !convert(value) : convert(value);
            }
            return false;
        }

        if (!(key in env)) {
            return false;
        }

        const unparsedValue = env[key];

        const convert = c.converter || converters.get(c.type) || strFn;

        try {
            if (isArrayType(c)) {
                target[c.key] = (c.converter || converters.get(c.type) || splitFn)(unparsedValue).map(v => (converters.get(arrayType(c)) || strFn)(v));
            } else {
                target[c.key] = convert(unparsedValue);
            }
        } catch (e) {
            help(script, argumentConfs, `Converting ENV['${key}'] '${unparsedValue}' to type '${niceType(c.type)}' failed\n ${e.message || e}`);
            return true;
        }
        return false;

    });

    order[Resolution.PACKAGE] = (): boolean => {
        if (conf.packageKey) {

            let pkg;
            try {
                pkg = require.main.require(`./package.json`)[conf.packageKey === true ? conf.prefix : conf.packageKey];
            } catch (e) {
                return false;
            }
            pkg && argumentConfs.forEach((c) => {
                if (c._long in pkg) {
                    target[c.key] = pkg[c._long];
                }
            });
        }
        return false;
    };

    order[Resolution.FILE] = (): boolean => {
        if (conf.rcFile) {
            const pkg = conf.parser(`.${conf.rcFile}`);
            pkg && argumentConfs.forEach((c) => {
                if (c._long in pkg) {
                    target[c.key] = pkg[c._long];
                }
            });
        }
        return false;
    };
    //The last has highest precedent, so we reverse it and go through it.
    if (resolution.concat().reverse().find((r) => order[r]()) != null) {
        return;
    }

    const fail = argumentConfs.find(v => v.required && target[v.key] == null);

    if (fail) {
        return help(script, argumentConfs, `Required argument '${typeof fail.key == 'string' ? fail.key : fail.long}' was not supplied.`);
    }
    return target;
};