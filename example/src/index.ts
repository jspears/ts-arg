import {Arg, configure} from "ts-arg";

class Options {

    @Arg('Some name')
    name: string;

    @Arg({required: true, description: 'The date this expires'})
    expires: Date;

    @Arg({default: true, required: true})
    files: string[]

    @Arg((v) => `-${v}-`)
    strike: string;

    @Arg('watch for changes')
    watch:boolean;

}

const opts = configure(new Options());
//Now you can see them.
console.table(opts);