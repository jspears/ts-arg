import {expect} from 'chai';
import {Arg, Config, configure} from "../index";
import {Resolution} from "../types";

const args = (...args: string[]) => ['', 'test', ...args];
const test = (Clazz: any, res: any, ...rest: string[]) => expect(configure(new Clazz, args(...rest))).to.eql(res);

describe('Args', function () {
    describe('config', function () {

        it('should configure arg', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args('--config-what'), {CONFIG_WHAT: '0'});
            expect(res).to.eql({what: true})
        });

        it('should configure arg different resolution', function () {
            @Config({prefix: "config", resolution: [Resolution.ENV, Resolution.ARG]})
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args('--no-config-what'), {CONFIG_WHAT: '1'});
            expect(res).to.eql({what: true})
        });
        it('should configure arg different resolution reverse', function () {
            @Config({prefix: "config", resolution: [Resolution.ARG, Resolution.ENV]})
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args('--no-config-what'), {CONFIG_WHAT: '1'});
            expect(res).to.eql({what: false})
        });

        it('should configure env', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args(), {CONFIG_WHAT: '1'});
            expect(res).to.eql({what: true})
        });

        it('should configure negative arg', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, ['', 'test', '--no-config-what'], {what: 'MORE'});
            expect(res).to.eql({what: false})
        });
        it('should configure negative arg env', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, ['', 'test'], {NO_CONFIG_WHAT: '1'});
            expect(res).to.eql({what: false})
        });

        it('should configure double negative arg env', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, ['', 'test'], {NO_CONFIG_WHAT: '0'});
            expect(res).to.eql({what: true})
        });

        it('should configure negative arg', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: number
            }

            const res = configure(new ConfigIt, ['', 'test', '--config-what=2'], {CONFIG_WHAT: '1'});
            expect(res).to.eql({what: 2})
        });

    });
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


        it('should error on required', function () {
            let called = 0;
            const help = (...args) => {
                console.log(args);
                called++
            };

            class HasRequired {
                @Arg({required: true})
                what: string
            }

            configure(new HasRequired, ['', 'script', 'stuff'], {}, void 0, help);
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

    describe('errors', function () {
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
                error = e;
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
                error = e;
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
                "help-script\nusage: -ow\n    --on\t-o\twon \n    --what\t-w\twhat \n\n"
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
            expect(warn[0][0]).to.contains("Converting 'more' to type 'string' failed\n Error more\n\nhelp-script\nusage: -s\n    --stuff\t-s\t \n\n");

        })
    })
});
