import {expect} from "chai";
import {Config, Arg, configure} from "../index";
import {Resolution} from "../types";

const args = (...args: string[]) => ['', 'test', ...args];

describe('@Config', function () {
    describe('prefix', function () {
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

            const res = configure(new ConfigIt, args('--no-config-what'), {what: 'MORE'});
            expect(res).to.eql({what: false})
        });
        it('should configure negative arg env', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args(), {NO_CONFIG_WHAT: '1'});
            expect(res).to.eql({what: false})
        });

        it('should configure double negative arg env', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: boolean
            }

            const res = configure(new ConfigIt, args(), {NO_CONFIG_WHAT: '0'});
            expect(res).to.eql({what: true})
        });

        it('should configure negative arg', function () {
            @Config("config")
            class ConfigIt {
                @Arg("what")
                what: number
            }

            const res = configure(new ConfigIt, args('--config-what=2'), {CONFIG_WHAT: '1'});
            expect(res).to.eql({what: 2})
        });

        it('should work with a custom parser', function () {

            @Config((what) => ({what}))
            class ConfigIt {
                @Arg("what")
                what: string
            }

            const res = configure(new ConfigIt, args());
            expect(res).to.eql({what: '.configitrc'})
        });
    });

    describe('camelCase', function () {
        it('should configure with camelCase arg', function () {
            @Config()
            class ConfigIt {
                @Arg()
                whatThe: string
            }

            const res = configure(new ConfigIt, args('--config-it-what-the', 'heel'));
            expect(res).to.eql({whatThe: 'heel'})
        });

        it('should configure with camelCase env', function () {
            @Config()
            class ConfigIt {
                @Arg()
                whatThe: string
            }

            const res = configure(new ConfigIt, args(), {CONFIG_IT_WHAT_THE: 'heel'});
            expect(res).to.eql({whatThe: 'heel'})
        });
    });

    describe('package.json', function () {
        let orequire;
        beforeEach(() => {
            orequire = require.main.require;
            require.main.require = Object.assign((name) => ({name, tester: {whatThe: 'heel'}}), orequire);
        });

        afterEach(() => {
            require.main.require = orequire;
        });

        it('should configure from a package.json', function () {
            @Config("tester")
            class ConfigIt {
                @Arg()
                whatThe: string
            }

            const res = configure(new ConfigIt, args(), {});
            expect(res).to.eql({whatThe: 'heel'})
            require.main.require = orequire;

        })
    });
    describe('ENV', function () {
        it('should read an array from ENV', function () {
            @Config("tester")
            class ConfigIt {
                @Arg()
                whatThe: string[]
            }

            const res = configure(new ConfigIt, args(), {'TESTER_WHAT_THE': '1,2,3'});
            expect(res).to.eql({whatThe: ['1', '2', '3']})
        });
        it('should error an array from ENV', function () {
            @Config("tester")
            class ConfigIt {
                @Arg(() => {
                    throw 'Test'
                })
                whatThe: string
            }

            let found = [];

            const res = configure(new ConfigIt, args(), {'TESTER_WHAT_THE': '1,2,3'}, void (0), (...args) => found.push(args));
            expect(res).to.not.exist;
            expect(found[0][2]).to.eql("Converting ENV['TESTER_WHAT_THE'] '1,2,3' to type 'string' failed\n Test"
            )
        });
    })
});
