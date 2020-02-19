import {expect} from "chai";
import {Config, Arg, configure} from "../index";
import {Resolution} from "../types";

const args = (...args: string[]) => ['', 'test', ...args];

describe('@Config', function () {

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

    it('should work with a custom parser', function () {

        @Config((what) => ({what}))
        class ConfigIt {
            @Arg("what")
            what: string
        }

        const res = configure(new ConfigIt, args());
        expect(res).to.eql({what: '.configitrc'})
    });

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
