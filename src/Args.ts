import chalk from "chalk";
import "reflect-metadata";

const argMetadataKey = Symbol("argMetadataKey");

export type Converter = (v: string) => any;

export type ArgType = {
    key?: string,
    long?: string
    short?: string,
    description?: string,
    required?: boolean,
    default?: boolean,
    type?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | '[]' | any,
    converter?: Converter,
    itemType?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | any,
}

const isArrayType = (v: ArgType) => v.itemType != null || v.type === Array || (typeof v.type == 'string' && v.type.endsWith('[]'));

const arrayType = (v: ArgType): string | any => v.itemType != null ? v.itemType : typeof v.type === 'string'
    ? v.type.replace(/\[\]$/, '') : 'string';


export type ConverterMap = Map<any, Converter>;

export type HelpFn = (script: string, conf: ArgType[], message?: string) => void;

export function Arg(description?: ArgType | string | Converter) {
    const conf = description == null ? undefined : typeof description === 'string' ? {description} : typeof description == 'function' ? {converter: description} : description;
    return function (target: any, propertyKey?: string) {
        const m = Reflect.getMetadata(argMetadataKey, target);
        const arg: ArgType = {
            key: propertyKey,
            long: propertyKey,
            short: (conf.long || propertyKey)[0],
            type: Reflect.getMetadata("design:type", target, propertyKey),
            ...conf
        };
        if (m) {
            m.push(arg);
        } else {
            Reflect.metadata(argMetadataKey, [arg])(target);
        }
    }
}

const strFn = (v: string) => v;
const jsonFn = (v: string) => JSON.parse(v);
const splitFn = (v) => v.split(/,\s*/);
export const CONVERTERS = new Map<any, Converter>();
CONVERTERS.set('Int', v => parseInt(v, 10));
CONVERTERS.set('Number', parseFloat);
CONVERTERS.set('number', parseFloat);
CONVERTERS.set('Boolean', jsonFn);
CONVERTERS.set('boolean', jsonFn);
CONVERTERS.set('String', strFn);
CONVERTERS.set('string', strFn);
CONVERTERS.set('JSON', jsonFn);
CONVERTERS.set('Date', jsonFn);
CONVERTERS.set('[]', splitFn);
CONVERTERS.set(Number, parseFloat);
CONVERTERS.set(String, strFn);
CONVERTERS.set(Boolean, jsonFn);
CONVERTERS.set(Date, jsonFn);
CONVERTERS.set(Array, splitFn);

const _help: HelpFn = (script: string, conf: ArgType[], message?: string): void => {

    const sorted = conf.concat().sort((a, b) => {
        if (a.required || b.required) {
            return -1;
        }
        return a.key.localeCompare(b.key);

    });
    if (message) {
        message = `${chalk.red('Error')}: ${message}\n\n`
    }
    console.warn(`${message} ${script}\n - Usage:
    ${sorted.map(v => `\v${v.required ? '*' : ' '}\t--${v.key} -${v.short} \t${v.description || ''} `).join('\n')}

`);

    return;
};
export const configure = <T>(target: T,
                             args: string[] = process.argv,
                             converters: ConverterMap = CONVERTERS,
                             help: HelpFn = _help): T | undefined | void => {
    const script = args[1];
    const conf = Reflect.getMetadata(argMetadataKey, target) as ArgType[];

    function resolveConvert(this: ArgType, v: string): any {
        const converter = converters.get(arrayType(this)) || strFn;
        return converter(v);
    }

    if (args.includes('-h') || args.includes('--help')) {
        return help(script, conf);
    }

    for (let i = 2; i < args.length; i++) {
        const [arg, value] = args[i].split('=', 2);
        const found = conf.find(v => {

            if (arg === `-${v.short}` || arg === `--${v.long}`) {
                return true;
            }
            if (v.type === Boolean) {
                if (arg === `--no-${v.long}`) {
                    return true;
                }
            }
            return false;
        });
        //Keep found because if a default option is present it will suck up the rest of the values.
        const c = found || conf.find(v => v.default);

        if (!c) {
            return help(script, conf, `Unknown argument '${arg}'`);
        }

        const convert = c.converter || converters.get(c.type) || strFn;
        if (c.type === Boolean) {
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
                return help(script, conf, `Converting '${value ?? args[i]}' to type '${c.type}' failed\n ${e.message || e}`);
            }
        }
    }


    const fail = conf.find(v => v.required && target[v.key] == null);
    if (fail) {
        return help(script, conf, `Required argument '${fail.key}' was not supplied.`);
    }
    return target;
};