import { Step } from './step'; 

export class Pipeline {
    key: string;
    label: string;
    steps: Step[]; 
    globalEnvironmentVariables: { [key: string]: string };

    constructor(key: string, label: string) {
        this.key = key;
        this.label = label;
        this.steps = [];
        this.globalEnvironmentVariables = {};
    }

    addStep(step: Step): void {
        this.steps.push(step);
    }

    setGlobalEnvironmentVariable(key: string, value: string): void {
        this.globalEnvironmentVariables[key] = value;
    }

    setGlobalEnvironmentVariables(env: { [key: string]: string }): void {
        this.globalEnvironmentVariables = { ...this.globalEnvironmentVariables, ...env };
    }

    generateBuildkiteSteps(): any {
        const generatedSteps: any[] = [];
        for (const step of this.steps) {
            generatedSteps.push(step.toBuildkiteYaml());
        }

        return {
            env: this.globalEnvironmentVariables,
            steps: generatedSteps
        };
    }

    defineFlow(flowDefinition: (pipeline: Pipeline) => void): void {
        flowDefinition(this);
    }
}