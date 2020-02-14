TS-Arg
===
Tool for making decorator based command line argument parsers.
More info [here](./docs/index.html)

## Installation
To use this tool you need to have ``` "experimentalDecorators": true,  "emitDecoratorMetadata": true,``` 
either in your tsconfig.json or your command line parameters.


## Usage
Add the `@Arg` decorator to the class you want to use for your CLI.

### Example

```ts static
import {Arg, configure} from "ts-arg";

class MyOptions {
  
   @Argv('do you want it to be chatty')
   verbose:boolean;

   @Argv({short:'T', description:'What is your T'})
   tbone:string;

   @Argv("A number of things");
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