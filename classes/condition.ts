// classes/condition.ts

// Simplified Condition class for demo
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
        return ''; // Should not happen with proper validation
    }

    // Simplified evaluate for demo - not actually used in Buildkite YAML generation,
    // but useful if you were to simulate pipeline execution logic within Node.js
    evaluate(pipelineState: Map<string, any>, environment: { [key: string]: string }): boolean {
        if (this.type === 'env_check' && this.envVarName && this.envVarValue) {
            return environment[this.envVarName] === this.envVarValue;
        }
        // Very basic expression evaluation for demo; real one would use an expression parser
        if (this.type === 'expression' && this.expression) {
            // For a demo, you might only support simple 'true'/'false' or specific checks
            return this.expression === 'true'; // Simplistic evaluation
        }
        return false;
    }
}