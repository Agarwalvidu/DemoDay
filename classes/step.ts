import { Condition } from './condition'; 

// Represents a single Buildkite pipeline step
export class Step {
    key: string;
    label: string;
    command?: string; // Optional for group/trigger steps
    type: 'command' | 'group' | 'trigger';
    dependencies?: string[]; 
    condition?: Condition; 
    env?: { [key: string]: string };
    build?: { // For trigger steps
        message: string;
        commit: string;
        branch: string;
        env?: { [key: string]: string; };
    };
    async?: boolean; // For trigger steps

    constructor(
        key: string,
        label: string,
        options?: {
            command?: string;
            type?: 'command' | 'group' | 'trigger';
            dependencies?: string[];
            condition?: Condition;
            env?: { [key: string]: string };
            build?: { message: string; commit: string; branch: string; env?: { [key: string]: string; }; };
            async?: boolean;
        }
    ) {
        this.key = key;
        this.label = label;
        this.command = options?.command;
        this.type = options?.type || 'command'; 
        this.dependencies = options?.dependencies;
        this.condition = options?.condition;
        this.env = options?.env;
        this.build = options?.build;
        this.async = options?.async;

        if (this.type === 'trigger' && !this.build) {
            throw new Error(`Trigger step '${key}' requires a 'build' configuration.`);
        }
    }

    // Converts this Step object into a Buildkite-compatible YAML structure
    toBuildkiteYaml(): any {
        const yamlOutput: any = { 
            label: this.label,
            key: this.key
        };

        if (this.type === 'command') {
            yamlOutput.command = this.command;
        } else if (this.type === 'trigger') {
            yamlOutput.trigger = this.command; 
            yamlOutput.build = this.build;
            if (this.async !== undefined) {
                yamlOutput.async = this.async;
            }
        }
        if (this.dependencies && this.dependencies.length > 0) {
            yamlOutput.depends_on = this.dependencies;
        }
        if (this.condition) {
            yamlOutput.if = this.condition.toBuildkiteIfString();
        }
        if (this.env && Object.keys(this.env).length > 0) {
            yamlOutput.env = this.env;
        }

        return yamlOutput;
    }
}

