export default
interface TypedKeyValueStore {
    getBoolean(key : string) : boolean | undefined;
    getInteger(key : string) : number | undefined;
    getString(key : string) : string | undefined;

    // Specific configuration directives
    smtp_server_ip_bind_address : string;
    smtp_server_tcp_listening_port : number;
    smtp_server_domain : string;
    smtp_server_hostname : string;
    smtp_server_servername : string;
    smtp_server_greeting : string;
}