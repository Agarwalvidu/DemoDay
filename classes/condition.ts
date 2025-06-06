export class Condition {
    type: 'env_check' | 'expression';
    envVarName?: string;
    envVarValue?: string;
    expression?: string;

    constructor(
        type: 'env_check' | 'expression',
        options: { envVarName?: string; envVarValue?: string; expression?: string }
    ) {
        this.type = type;
        if (type === 'env_check') {
            if (!options.envVarName || !options.envVarValue) {
                throw new Error("Env check condition requires envVarName and envVarValue.");
            }
            this.envVarName = options.envVarName;
            this.envVarValue = options.envVarValue;
        } else if (type === 'expression') {
            if (!options.expression) {
                throw new Error("Expression condition requires an expression string.");
            }
            this.expression = options.expression;
        }
    }

    // Generates the Buildkite 'if' attribute string
    toBuildkiteIfString(): string {
        if (this.type === 'env_check' && this.envVarName && this.envVarValue) {
            return `env("<span class="math-inline">\{this\.envVarName\}"\) \=\= "</span>{this.envVarValue}"`;
        } else if (this.type === 'expression' && this.expression) {
            return this.expression;
        }
        return '';
    }

    // Only for demo - not actually used in Buildkite YAML generation
    evaluate(pipelineState: Map<string, any>, environment: { [key: string]: string }): boolean {
        if (this.type === 'env_check' && this.envVarName && this.envVarValue) {
            return environment[this.envVarName] === this.envVarValue;
        }
        if (this.type === 'expression' && this.expression) {
        }
        return false;
    }
}