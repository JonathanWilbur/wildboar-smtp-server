import TypedKeyValueStore from "../ConfigurationSource";

export default
class EnvironmentVariableConfigurationSource implements TypedKeyValueStore {

    private transformKeyNameToEnvironmentVariableName (key : string) : string {
        return key.toUpperCase().replace(".", "_");
    }

    public getBoolean(key : string) : boolean | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        if (/^\s*True\s*$/i.test(environmentVariable)) return true;
        if (/^\s*False\s*$/i.test(environmentVariable)) return false;
        if (/^\s*Yes\s*$/i.test(environmentVariable)) return true;
        if (/^\s*No\s*$/i.test(environmentVariable)) return false;
        if (/^\s*T\s*$/i.test(environmentVariable)) return true;
        if (/^\s*F\s*$/i.test(environmentVariable)) return false;
        if (/^\s*Y\s*$/i.test(environmentVariable)) return true;
        if (/^\s*N\s*$/i.test(environmentVariable)) return false;
        if (/^\s*1\s*$/i.test(environmentVariable)) return true;
        if (/^\s*0\s*$/i.test(environmentVariable)) return false;
        if (/^\s*\+\s*$/i.test(environmentVariable)) return true;
        if (/^\s*\-\s*$/i.test(environmentVariable)) return false;
        return undefined;
    }

    // TODO: Check for NaN, Infinity, etc.
    public getInteger(key : string) : number | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        try {
            return Number(environmentVariable);
        } catch (e) {
            return undefined;
        }
    }

    public getString(key : string) : string | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }

    /**
     * The specific directive accessors go below here.
     */

    // get smtp_server_mode_test () : boolean {
    //     const DEFAULT_VALUE : boolean = false;
    //     const env : boolean | undefined = this.getBoolean("smtp.server.mode.test");
    //     if (!env) return DEFAULT_VALUE;
    //     return env;
    // }

    get smtp_server_mode_development () : boolean {
        const DEFAULT_VALUE : boolean = false;
        const env : boolean | undefined = this.getBoolean("smtp.server.mode.development");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    // get smtp_server_mode_debug () : boolean {
    //     const DEFAULT_VALUE : boolean = false;
    //     const env : boolean | undefined = this.getBoolean("smtp.server.mode.debug");
    //     if (!env) return DEFAULT_VALUE;
    //     return env;
    // }

    get smtp_server_mode_profiling () : boolean {
        const DEFAULT_VALUE : boolean = false;
        const env : boolean | undefined = this.getBoolean("smtp.server.mode.profiling");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get smtp_server_ip_bind_address () : string {
        const DEFAULT_VALUE : string = "0.0.0.0";
        const env : string | undefined = this.getString("smtp.server.ip.bind_address");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get smtp_server_tcp_listening_port () : number {
        const DEFAULT_VALUE : number = 25;
        const env : number | undefined = this.getInteger("smtp.server.tcp.listening_port");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get smtp_server_domain () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("smtp.server.domain");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    // localdomains

    get smtp_server_hostname () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("smtp.server.hostname");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get smtp_server_servername () : string {
        const DEFAULT_VALUE : string = "Wildboar SMTP Server";
        const env : string | undefined = this.getString("smtp.server.servername");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get smtp_server_greeting () : string {
        const DEFAULT_VALUE : string = "Hey there, hoss.";
        const env : string | undefined = this.getString("smtp.server.greeting");
        if (!env) return DEFAULT_VALUE;
        return env;
    }
    
}