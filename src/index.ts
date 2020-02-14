/**
 * @remarks
 * This module is meant to allow quick and easy command line argument parsing.   It does not intend to be a full
 * fledged DI system.  It is meant to be a basic parser but strives for convience and correctness in parsing.
 *
 */
import chalk from "chalk";
import "reflect-metadata";
import {ArgType, HelpFn, Converter, ConverterMap} from "./types";

const argMetadataKey = Symbol("argMetadataKey");

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
    return 'string';

};
const niceType = (v: ArgType): string => isArrayType(v) ?
    `${v.itemType ? _niceType(v.itemType) : ''}[]` : _niceType(v.type);

const niceKey = (v: ArgType): string | number => typeof v.key == 'symbol' ? v.long : v.key;

const isBoolean = (v: any): boolean => (v === Boolean || v === 'boolean' || v === 'Boolean');


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

const strFn = (v: string) => v;
const jsonFn = (v: string) => JSON.parse(v);
const splitFn = (v) => v.split(/,\s*/);
const dateFn = (v) => new Date(v);
export const CONVERTERS = new Map<any, Converter>([
    ['Int', v => parseInt(v, 10)],
    ['Number', parseFloat],
    ['number', parseFloat],
    ['Boolean', jsonFn],
    ['boolean', jsonFn],
    ['String', strFn],
    ['string', strFn],
    ['JSON', jsonFn],
    ['Date', dateFn],
    ['[]', splitFn],
    ['Array', splitFn],
    [Number, parseFloat],
    [String, strFn],
    [Boolean, jsonFn],
    [Date, dateFn],
    [Array, splitFn],
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
/**
 * Configures an object from command line arguments
 * @param target - Is the object to configure
 * @param args - `process.argv` or your own array of strings.
 * @param converters - A Map of converters that take a string and return a value.
 * @param help - A function for help, this one call on invocation, you may not want that.
 */
export const configure = <T>(target: T,
                             args: string[] = process.argv,
                             converters: ConverterMap = CONVERTERS,
                             help: HelpFn = _help): T | undefined | void => {
    const script = args[1];
    const conf = Reflect.getMetadata(argMetadataKey, target) as ArgType[];

    if (args.includes('-h') || args.includes('--help')) {
        return help(script, conf);
    }

    for (let i = 2; i < args.length; i++) {
        const [arg, value] = args[i].split('=', 2);
        const found = conf.find(v => {

            if (arg === `-${v.short}` || arg === `--${v.long}`) {
                return true;
            }
            return isBoolean(v.type) && arg === `--no-${v.long}`;
        });
        
        //Keep found because if a default option is present it will suck up the rest of the values.
        const c = found || conf.find(v => v.default);

        if (!c) {
            return help(script, conf, `Unknown argument '${arg}'`);
        }

        const convert = c.converter || converters.get(c.type) || strFn;
        if (isBoolean(c.type)) {
            target[c.key] = value != null ? convert(value) : !arg.startsWith('--no-');
        } else {
            try {
                const unparsedValue = value != null ? value : found ? args[++i] : args[i];
                if (isArrayType(c)) {
                    target[c.key] = [
                        ...(target[c.key] || []),
                        ...(c.converter || converters.get(c.type) || splitFn)(unparsedValue).map(v => (converters.get(arrayType(c)) || strFn)(v))
                    ];
                } else {
                    target[c.key] = convert(unparsedValue);
                }
            } catch (e) {
                return help(script, conf, `Converting '${value ?? args[i]}' to type '${niceType(c.type)}' failed\n ${e.message || e}`);
            }
        }
    }


    const fail = conf.find(v => v.required && target[v.key] == null);
    if (fail) {
        return help(script, conf, `Required argument '${typeof fail.key == 'string' ? fail.key : fail.long}' was not supplied.`);
    }
    return target;
};