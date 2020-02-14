import {expect} from 'chai';
import {Arg, configure} from "../index";

const test = (Clazz: any, res: any, ...args: string[]) => expect(configure(new Clazz, ['', 'script', ...args])).to.eql(res);

describe('Args', function () {

    describe('boolean', function () {
        class Opt {
            @Arg("what")
            what: boolean
        }

        it('should set option to --what true', function () {
            test(Opt, {what: true}, '--what',);
        });

        it('should set option to true', function () {
            test(Opt, {what: true}, '-w');
        });
        it('should set option to false', function () {
            test(Opt, {what: false}, '--no-what');
        });
        it('should set option to =true', function () {
            test(Opt, {what: true}, '--what=true');
        });
        it('should set option to =false', function () {
            test(Opt, {what: false}, '--what=false');
        });
    });
    describe('string', function () {
        class Opt {
            @Arg("what")
            what: string
        }

        it('should set option to --what isit', function () {
            test(Opt, {what: 'isit'}, '--what', 'isit');
        });
        it('should set option to --what=isit', function () {
            test(Opt, {what: 'isit'}, '--what=isit');
        });
    });
    describe('string[]', function () {
        class Opt {
            @Arg("what")
            what: string[]
        }

        it('should set option to --what isit', function () {
            test(Opt, {what: ['isit']}, '--what', 'isit');
        });
        it('should set option to --what=isit', function () {
            test(Opt, {what: ['isit']}, '--what=isit');
        });
        it('should set option to --what=isit,more', function () {
            test(Opt, {what: ['isit', 'more']}, '--what=isit,more');
        });
        it('should set option to --what isit,more', function () {
            test(Opt, {what: ['isit', 'more']}, '--what', 'isit,more');
        });
        it('should set option to --what isit --what more', function () {
            test(Opt, {what: ['isit', 'more']}, '--what', 'isit,more');
        });
    });
    describe('number[]', function () {
        class OptItemType {
            @Arg({itemType: 'Number'})
            what: number[]
        }

        class OptType {
            @Arg({type: 'Number[]'})
            what: number[]

        }

        [OptItemType, OptType].forEach((Opt) => {
            describe('using ' + Opt.name, function () {
                it('should set option to --what 0', function () {
                    test(Opt, {what: [0]}, '--what', '0');
                });
                it('should set option to --what=isit', function () {
                    test(Opt, {what: [0]}, '--what=0');
                });
                it('should set option to --what=0,1', function () {
                    test(Opt, {what: [0, 1]}, '--what=0,1');
                });
                it('should set option to --what isit,more', function () {
                    test(Opt, {what: [0, 1]}, '--what', '0,1');
                });
                it('should set option to --what isit --what more', function () {
                    test(Opt, {what: [0, 1]}, '--what', '0', '--what', '1');
                });
            });
        });
    });
    describe('required', () => {
        let called = 0;
        const help = () => {
            called++
        };

        class HasRequired {
            @Arg({required: true})
            what: string
        }

        it('should error on required', function () {
            configure(new HasRequired, ['', 'script', 'stuff'], void 0, help);
            expect(called).to.eql(1);
        });

        it('should not on required', function () {
            test(HasRequired, {what: 'yes'}, '--what=yes');
        });

    });
    describe('default', () => {


        it('should swallow the values', function () {
            class HasDefault {
                @Arg({default: true})
                what: string
            }

            test(HasDefault, {what: 'yes'}, 'yes');
        });

        it('should swallow the values', function () {
            class HasDefault {
                @Arg({default: true})
                what: string[];
            }

            test(HasDefault, {what: ['1']}, '1');
        });
        it('should default and many the values', function () {
            class HasDefault {
                @Arg({default: true})
                what: string[];
                @Arg('test')
                more: string;

            }

            test(HasDefault, {what: ['1'], more: '2'}, '--more', '2', '1');
        })
    });
    describe('long', function () {
        class HasLong {
            @Arg({long: 'more'})
            what: string;

        }

        it('should parse with long parameter', () => {
            test(HasLong, {what: 'stuff'}, '--more', 'stuff');
        });

        it('should parse with short parameter', () => {
            test(HasLong, {what: 'stuff'}, '-m', 'stuff');
        });

    });

    describe('converter', function () {
        it('should parse with converter', () => {
            class HasConverter {
                @Arg({converter: (v) => `-${v}-`})
                what: string;
            }
            test(HasConverter, {what: '-stuff-'}, '--what', 'stuff');
        });

        it('should parse with converter fn', () => {
            class HasConverter {
                @Arg((v) => `-${v}-`)
                what: string;
            }
            test(HasConverter, {what: '-stuff-'}, '--what', 'stuff');
        });
    });
});
