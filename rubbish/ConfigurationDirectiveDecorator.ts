import ConfigurationDirectiveOptions from "./ConfigurationDirectiveOptions";

export default
function ConfigurationDirective (options : ConfigurationDirectiveOptions) {
    return function (target: Object, propertyKey: string | symbol, descriptor : PropertyDescriptor) : void {
        descriptor.value = options.default;
    }
}