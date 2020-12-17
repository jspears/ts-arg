TS-Arg
===
Tool for making decorator based command line argument parsers.
More info [here](https://jspears.github.io/ts-arg/)

## Installation
To use this tool you need to have 
``` 
"experimentalDecorators": true,  
"emitDecoratorMetadata": true,
``` 
either in your tsconfig.json or your command line parameters.

![Node.js CI](https://github.com/jspears/ts-arg/workflows/Node.js%20CI/badge.svg)

## Usage
Add the `@Arg` decorator to the class you want to use for your CLI.

### Example
See a full example in [./example](./example)
```ts static
import {Arg, configure} from "ts-arg";

class MyOptions {
  
   @Arg('do you want it to be chatty')
   verbose:boolean;

   @Arg({short:'T', description:'What is your T'})
   tbone:string;

   @Arg("A number of things");
   count:number;

}

const opts = configure(new MyOptions);



```

### Configuration
If it doesn't quite do what you want checkout the possible options.
```ts
     
    long?: string
    short?: string,
    description?: string,
    required?: boolean,
    default?: boolean,
    type?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | '[]' | any,
    converter?: Converter,
    itemType?: 'Boolean' | 'String' | 'Number' | 'Int' | 'JSON' | any,
```

### Application Style
Sometimes storing the parameters is desired, by labeling your class with
the `@Config` decorator, a few things happen.

- All commands are prefixed with the "argPrefix" value which defaults to the "prefix" value which itself defaults to className.
- ENV parameters are enabled allowing ENV properties to be read with the correct prefix.  Similar to the
  `argPerfix` the `envPrefix` defaults to the `prefix` and then to the class name.
- A configuration file is looked for, by default a JSON file (parser is specfiable).  The rcFile variable
   is defaulted to the `.${prefix}`. value.
- A property named `packagePrefix` which defaults to `prefix` is read from the current project's 
  package.json and attempts to set the current project. 
  
Example:

```ts 
#!/usr/bin/env node

import {configure, Config, Arg} from 'ts-arg';

@Config("myapp")
class MyOptions {
  @Arg("verbosity on/off")
  verbose:boolean;

  @Arg({description:"Paths to look for", default:true})
  paths:string[]

  @Arg()
  name:string;
 
}
console.table(configure(new MyOption));


```  
       
Then options can be provided via cli:
```sh
 $ ./bin/myapp.js --myapp-name=stuff -v ./path/to/thing.
```
or they can be combined with ENV
```sh
 $ MYAPP_VERBOSE=1 ./bin/myapp.js --myapp-name=stuff ./path/to/thing.
```
and it could be combined with `package.json`
```json

{
"name": "my-super-app",
"myapp": {
    "name": "stuff",
    "paths": ["./src","./test"],
    "verbose": true
  }
}

```
Or a dot file `.myapprc`
```json
{
   "paths": ["./src","./test"],
   "verbose": true,
   "name": "stuff"
}


```



