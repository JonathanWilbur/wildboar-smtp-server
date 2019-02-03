export default
interface SASLAuthenticationMechanism {
    // Base64-encoded authentication response (meaning the response to a challenge)
    processBase64Response (response : string) : void;
    // Base64 challenge or null if no more challenges
    nextBase64Challenge () : string | null;
    // String containing localPart if successfully authenticated
    getAuthenticatedLocalPart () : Promise<string>;
}