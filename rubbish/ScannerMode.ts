const enum ScannerMode {
    LINE, // Iterate over lines ending with <CR><LF>
    DATA, // Iterate over bytes until <CR><LF>.<CR><LF>
    CHUNK // Iterate over a pre-specified number of bytes
}
export default ScannerMode;