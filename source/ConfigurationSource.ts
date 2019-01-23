export default
interface ConfigurationSource {
    smtp_server_ip_bind_address : string;
    smtp_server_tcp_listening_port : number;
    smtp_server_domain : string;
    smtp_server_hostname : string;
    smtp_server_servername : string;
    smtp_server_greeting : string;
    queue_server_hostname : string;
    queue_server_tcp_listening_port : number;
    queue_username : string;
    queue_password : string;
}