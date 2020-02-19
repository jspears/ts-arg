export enum Resolution {
    ARG,
    ENV,
    FILE,
    PACKAGE,
}

export type ParserFn = (path: string) => any;

export type ConfigOptions = {
    prefix?: string,
    rcFile?: string,
    argPrefix?: string,
    envPrefix?: string,
    packageKey?: string,
    description?: string,
    /**
     * The order to resolve options.
     */
    resolution?: [Resolution, Resolution?, Resolution?, Resolution?]
    checkHomeDir?: boolean,
    parser?: ParserFn,
}

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
    key?: string | symbol | number,
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