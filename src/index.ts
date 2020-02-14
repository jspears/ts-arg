/**
 * @remarks
 * This module is meant to allow quick and easy command line argument parsing.   It does not intend to be a full
 * fledged DI system.  It is meant to be a basic parser but strives for convience and correctness in parsing.
 *
 */
import chalk from "chalk";
import "reflect-metadata";

const argMetadataKey = Symbol("argMetadataKey");

/**
 * @param v converts a string into the type the class is expecting.
 */
export type Converter = (v: string) => any;
/**
 * A map that allows for lookups of converters.
 */
export type ConverterMap = Map<any, Converter>;
/**
 * A configuration object for the `@Arg` decorator.
 */
export type ArgType = {
    key?: string,
    /**
     * The long version of your argument (--arg) (optional) defaults to property key.
     */
    long?: string
    /**
     * The short version of your argument (-a) defaults to the first letter of long.
     */
    short?: string,
    /**
     * A description of your argument for use in help messages.
     */
    description?: string,
    /**
     * Is this field required.
     */
    required?: boolean,
    /**
     * Is this the default parameter that will recieve values if no parameter name is given
     */
    default?: boolean,
    /**
     * The type, automatically inferred.  Can be set manually.
     */
    type?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | '[]' | any,
    /**
     * The string to type converter to use.
     */
    converter?: Converter,
    /**
     * If an array the type inside the array.
     */
    itemType?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | any,
}

/**
 * This function is called when `configure` fails.   The default implementation exists with `process.exit(1)`,  If you
 * provide your own it can do as you want.
 *
 * @param script - the name of the running script defaults to process.argv[1]
 * @param conf - the configured argument types.
 * @param message - the error message to show on failure.
 */
export type HelpFn = (script: string, conf: ArgType[], message?: string) => void;


const isArrayType = (v: ArgType) => v.itemType != null || v.type === Array || (typeof v.type == 'string' && v.type.endsWith('[]'));

const arrayType = (v: ArgType): string | any => v.itemType != null ? v.itemType : typeof v.type === 'string'
    ? v.type.replace(/\[\]$/, '') : 'string';

/**
 * This a decorator for properties fields in typescript classes.
 * @param description - Either a description a converter or a configuration argument.
 **/
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
/**
 * Configures an object from command line arguments
 * @param target - Is the object to configure
 * @param args - `process.argv` or your own array of strings.
 * @param converters - A Map of converters that take a string and return a value.
 * @param help - A function for help, this one call process.exit(1) on invocation, you may not want that.
 */
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