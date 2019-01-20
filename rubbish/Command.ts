// REVIEW: Make data a slice instead of a buffer?
export default
interface Command {
    readonly verb : string,
    readonly arguments? : string,
    readonly data? : Buffer
}