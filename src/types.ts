/**
 * Represents what order to resolve the arguments.
 */
export enum Resolution {
    ARG,
    ENV,
    FILE,
    PACKAGE,
}

/**
 * This function parses a file at a path and returns
 * a value
 */
export type ConfigParserFn = (path: string) => any;
/**
 * Configuration options for the `@Config` decorator
 */
export type ConfigOptions = {
    /**
     * Default prefix to use for all other prefix's.
     */
    prefix?: string,
    /**
     * The name of the desired rcFile defaults to `.${prefix}rc`
     */
    rcFile?: string,
    /**
     * The name of the desired argument prefix.  Defaults to `${prefix}-
     */
    argPrefix?: string,
    /**
     * The name of the desired ENV prefix.  Defaults to uppercase `prefix`
     */
    envPrefix?: string,
    /**
     * The name of the package.json key to find configuration information.
     * Defaults to `prefix`
     */
    packageKey?: string,
    /**
     * The order to resolve options.  Defaults to the following order
     * `ARG`, `ENV`, `File`, `package.json`
     */
    resolution?: [Resolution, Resolution?, Resolution?, Resolution?]
    /**
     * Parser to use to parse the rc file.  Currently its just
     * (filename)=>JSON.parse(fs.readFileSync(filename));
     */
    parser?: ConfigParserFn,
}

/**
 * @param v converts a string into the type the class is expecting.
 */
export type Converter = (v: string) => any;
/**
 * A map that allows for lookups of converters.
 */
export type ConverterMap = Map<any, Converter>;

export type HasConverter = {
    converter: Converter
}
export type HasType = {
    type?: any
}
/**
 * A function that can be used for converting, from
 * one string to a type.
 */
export type ConverterResolveFn = (v: HasConverter | HasType, def?: Converter) => Converter;

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