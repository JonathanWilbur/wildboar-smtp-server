"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
class EnvironmentVariableConfigurationSource {
    constructor() {
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
    }
    transformKeyNameToEnvironmentVariableName(key) {
        return key.toUpperCase().replace(".", "_");
    }
    getBoolean(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        if (/^\s*True\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*False\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*Yes\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*No\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*T\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*F\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*Y\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*N\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*1\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*0\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*\+\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*\-\s*$/i.test(environmentVariable))
            return false;
        return undefined;
    }
    getInteger(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        try {
            return Number(environmentVariable);
        }
        catch (e) {
            return undefined;
        }
    }
    getString(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }
    get smtp_server_mode_development() {
        const DEFAULT_VALUE = false;
        const env = this.getBoolean("smtp.server.mode.development");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_mode_profiling() {
        const DEFAULT_VALUE = false;
        const env = this.getBoolean("smtp.server.mode.profiling");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_ip_bind_address() {
        const DEFAULT_VALUE = "127.0.0.1";
        const env = this.getString("smtp.server.ip.bind_address");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_tcp_listening_port() {
        const DEFAULT_VALUE = 25;
        const env = this.getInteger("smtp.server.tcp.listening_port");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_domain() {
        const DEFAULT_VALUE = "";
        const env = this.getString("smtp.server.domain");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_hostname() {
        const DEFAULT_VALUE = "";
        const env = this.getString("smtp.server.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_servername() {
        const DEFAULT_VALUE = "Wildboar SMTP Server";
        const env = this.getString("smtp.server.servername");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get smtp_server_greeting() {
        const DEFAULT_VALUE = "Hey there, hoss.";
        const env = this.getString("smtp.server.greeting");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_server_hostname() {
        const DEFAULT_VALUE = "localhost";
        const env = this.getString("queue.server.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_server_tcp_listening_port() {
        const DEFAULT_VALUE = 5672;
        const env = this.getInteger("queue.server.tcp.listening_port");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_username() {
        const DEFAULT_VALUE = "";
        const env = this.getString("queue.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_password() {
        const DEFAULT_VALUE = "";
        const env = this.getString("queue.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
}
exports.default = EnvironmentVariableConfigurationSource;
//# sourceMappingURL=EnvironmentVariables.js.map