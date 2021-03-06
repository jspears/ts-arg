import {expect} from 'chai';
import {Arg, configure} from "../index";

const args = (...args: string[]) => ['', 'test', ...args];
const test = (Clazz: any, res: any, ...rest: string[]) => expect(configure(new Clazz, args(...rest))).to.eql(res);

describe('@Arg', function () {
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
        it('should work with camelCase no arg', function () {
            class Camel {
                @Arg({short: 'c'})
                hasCamel: boolean;
            }

            test(Camel, {hasCamel: true}, '--has-camel');
        });
        it('should work with camelCase =true', function () {
            class Camel {
                @Arg({short: 'c'})
                hasCamel: boolean;
            }

            test(Camel, {hasCamel: true}, '--has-camel=true');
        });
        it('should work with camelCase =false', function () {
            class Camel {
                @Arg({short: 'c'})
                hasCamel: boolean;
            }

            test(Camel, {hasCamel: false}, '--has-camel=false');
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


        it('should error on required', function () {
            let called = 0;
            const help = () => {
                called++
            };

            class HasRequired {
                @Arg({required: true})
                what: string
            }

            configure(new HasRequired, args('stuff'), {}, void 0, help);
            expect(called).to.eql(1);
        });

        it('should not on required', function () {
            let called = 0;
            const help = () => {
                called++
            };

            class HasRequired {
                @Arg({required: true})
                what: string
            }

            configure(new HasRequired, args(), {}, void 0, help);
            expect(called).to.eql(1);
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

    describe('json', function () {
        class HasJson {
            @Arg({"type": "JSON"})
            json
        }

        it('should parse json', function () {
            test(HasJson, {json: {what: 1}}, '--json', JSON.stringify({what: 1}))
        });

        it('should parse json=', function () {
            test(HasJson, {json: {what: 1}}, `--json=${JSON.stringify({what: 1})}`)
        });

        it('should work as default', function () {
            class HasJsonDefault {
                @Arg()
                what: boolean;

                @Arg({"type": "JSON", default: true})
                json: any;
            }

            test(HasJsonDefault, {json: {what: 1}, what: true}, '-w', `${JSON.stringify({what: 1})}`)

        })
    });

    describe('date', function () {
        it('should parse date', () => {
            class HasDate {
                @Arg()
                date: Date;
            }

            const hd = configure(new HasDate(), ['', '', '--date', '10/10/10']);
            if (hd) {
                expect(hd.date.getFullYear()).to.eql(2010);
                expect(hd.date.getMonth()).to.eql(9);
                expect(hd.date.getDate()).to.eql(10);

            } else {
                expect(hd).to.exist;
            }
        });
    });
    describe('regex', function () {
        it('should parse regex', () => {
            class HasRegex {
                @Arg()
                regex: RegExp;
            }

            const hd = configure(new HasRegex(), args('--regex=/.+?/'));
            expect(hd).to.eql({regex: /.+?/});
        });
        it('should parse regex with flags', () => {
            class HasRegex {
                @Arg()
                regex: RegExp;
            }

            const hd = configure(new HasRegex(), args('--regex=/.+?/i'));
            expect(hd).to.eql({regex: /.+?/i});
        });
    });

    describe('errors', function () {
        it('should error when short is h', function () {
            let error;
            try {
                class Help {
                    @Arg()
                    hey: string;
                }
            } catch (e) {
                error = e.message;
            } finally {
                expect(error).to.eql('-h is always help, please assign a different short value for \'hey\'');
            }

        });
        it('should error when long is help', function () {
            let error;
            try {
                class Help {
                    @Arg()
                    help: string;
                }
            } catch (e) {
                error = e.message;
            } finally {
                expect(error).to.eql('--help is always help, please assign a different long value for \'help\'');
            }

        });

        it('should error when 2 properties have same short', function () {
            let error;
            try {
                class Duplicate {
                    @Arg("what")
                    what: string;
                    @Arg("won")
                    won: string;
                }
            } catch (e) {
                error = e.message;
            } finally {
                expect(error).to.eql('Can not have 2 properties with same long or short names. \'what\' or \'w\' is already used, check \'what\'.');
            }

        });
        it('should error if more than one property is marked default', function () {
            let error: string;
            try {
                class Required {
                    @Arg({default: true})
                    what: string;
                    @Arg({default: true})
                    on: string;
                }
            } catch (e) {
                error = e.message;
            } finally {
                expect(error).to.eql('There are multiple properties marked as default, check \'what\'');
            }
        });
    });
    describe('help', function () {
        class Help {
            @Arg("what")
            what: string;
            @Arg("won")
            on: string;
        }

        it('should -h', function () {
            const owarn = console.warn;
            let warn = [];
            console.warn = (...args) => warn.push(args);
            expect(configure(new Help, ['', 'help-script', '-h'])).to.not.exist;
            console.warn = owarn;

            expect(warn).to.eql([[
                "help-script\nusage: -how\n    --help\t-h\tThis helpful message \n    --on\t-o\twon \n    --what\t-w\twhat \n\n"
            ]])
        });

        it('should --help', function () {
            expect(configure(new Help, ['', 'help-script', '--help'])).to.not.exist;
        });

        it('should error', function () {
            class HasError {
                @Arg((more) => {
                    throw `Error ${more}`
                })
                stuff: string;
            }

            const owarn = console.warn;
            let warn = [];
            console.warn = (...args) => warn.push(args);
            expect(configure(new HasError, ['', 'help-script', '--stuff', 'more'])).to.not.exist;
            console.warn = owarn;
            expect(warn[0][0]).to.contains("Converting 'more' to type 'string' failed\n Error more");

        })
    });
    describe("symbol", function () {
        it('should work with symbols', function () {
            const key = Symbol('test');

            class HasSymbol {
                @Arg({long: 'test'})
                [key]: string
            }

            test(HasSymbol, {[key]: 'what'}, '--test', 'what');
        });

        it('should  error with symbols', function () {
            const key = Symbol('test');
            let error;
            try {
                class HasSymbol {
                    @Arg()
                    [key]: string
                }
            } catch (e) {
                error = e.message;
            } finally {
                expect(error).to.eql('When annotating a symbol, a long argument descriptor is required');
            }
        })
    });
    describe("Int", function () {
        it('should work with int', function () {

            class HasInt {
                @Arg({type: 'Int'})
                test: number;
            }

            test(HasInt, {test: 1}, '--test', '1.1');
        })
    });
});
