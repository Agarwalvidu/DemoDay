// ci_main.ts
import { Command } from 'commander';
import { Step } from './classes/step'; 
import { Pipeline } from './classes/pipeline';
import { Condition } from './classes/condition'; 
import * as yaml from 'yaml'; 

const program = new Command();

program
    .option('--enable-multi-region-deploy', 'Enable multi-region deployment CI.')
    .option('--re-trigger-db-reset', 'Re-trigger CI deployment for DB reset.')
    .option('--disable-ci-deploy', 'Disable CI deployment.')
    .parse(process.argv);

const options = program.opts();

function createCiDeploymentPipeline(): Pipeline {
    const pipeline = new Pipeline('ci-deployment-main', 'Dynamic CI Deployment');

    // Set global environment variables (e.g., from Buildkite agent meta-data, etc.)
    pipeline.setGlobalEnvironmentVariables({
        'BACKEND_GIT_REF': 'master',
        'WEBAPP_GIT_REF': process.env.BUILDKITE_COMMIT || 'HEAD',
        'BUILDKITE_BRANCH': process.env.BUILDKITE_BRANCH || 'main',
        'DATADOG_TAGS_SOURCE': 'dynamic-pipeline-demo',
        'COMMON_VAR_1': 'value-from-ci-main',
        'COMMON_VAR_2': 'another-value',
        // Example of a global variable that could be used in a condition
        'IS_DEMO_ENV': 'true', 
    });

    const baseEnv = {
        'DB_RESET_REQUIRED': 'false',
        'DEPLOY_SERVICES': 'both',
        'ENABLE_COVERAGE_REPORT': 'false',
        'ENABLE_DEPLOYMENT': 'true',
        'FBP_IMAGE_TAG': 'main',
        'IDENTITY_GIT_REF': 'PROD_ON_CI',
        'POSTGRES_ENABLED': 'true',
        'QUEUE_RIPPLING_WEBAPP_BUILDER': 'rippling-webapp-builder-blue',
        'SHOULD_USE_CACHE': 'true',
        // ... many more env vars as seen in eks_showcase_deploy.sh
    };

    // Scenario 1: Primary CI Deployment (Single Region - Always triggered if not disabled or re-triggered)
    // This step will be included if neither --disable-ci-deploy nor --re-trigger-db-reset are true.
    // This simulates the default path when no special flags are given.
    if (!options.disableCiDeploy && !options.reTriggerDbReset) {
        pipeline.addStep(new Step('trigger-single-region', '🚀 Trigger CI Deployment (Single Region)', {
            type: 'trigger',
            command: 'ci-deployment', // Buildkite pipeline slug to trigger
            build: {
                message: `CI Deployment For ${pipeline.globalEnvironmentVariables.BUILDKITE_BRANCH} (Single Region)`,
                commit: 'HEAD',
                branch: 'main',
                env: {
                    ...baseEnv,
                    'API_MAX_REPLICA_COUNT': '20', // Example specific env
                    'MULTI_REGION': 'false',
                    'TERRITORY': process.env.TERRITORY || 'us1',
                },
            },
        }));
    }

    // Scenario 2: Primary CI Deployment (Multi-Region)
    // This step is triggered only if --enable-multi-region-deploy is passed.
    if (options.enableMultiRegionDeploy) {
        pipeline.addStep(new Step('trigger-multi-region', '🌍 Trigger CI Deployment (Multi-Region)', {
            type: 'trigger',
            command: 'ci-deployment',
            build: {
                message: `CI Deployment For ${pipeline.globalEnvironmentVariables.BUILDKITE_BRANCH} (Multi-Region)`,
                commit: 'HEAD',
                branch: 'main',
                env: {
                    ...baseEnv,
                    'API_MAX_REPLICA_COUNT': '5', // Example specific env from eks_showcase_deploy.sh
                    'MULTI_REGION': 'true',
                    'TERRITORY': process.env.TERRITORY || 'us1',
                    'RESTART_MONGO_MULTI_REGION': 'true', // Example specific env from eks_showcase_deploy.sh
                },
            },
        }));
    }

    // Scenario 3: Re-Triggering CI Deployment For DB Reset
    // This step is triggered only if --re-trigger-db-reset is passed.
    // It's mutually exclusive with the default single-region deploy in this demo.
    if (options.reTriggerDbReset) {
        pipeline.addStep(new Step('trigger-db-reset', '🔄 Re-Trigger CI Deployment For DB Reset', {
            type: 'trigger',
            command: 'ci-deployment',
            build: {
                message: `CI Deployment For ${pipeline.globalEnvironmentVariables.BUILDKITE_BRANCH} (DB Reset)`,
                commit: 'HEAD',
                branch: 'main',
                env: {
                    ...baseEnv,
                    'API_MAX_REPLICA_COUNT': '10', // As seen in original script's DB reset branch
                    'RESTART_MONGO': 'true',
                    'DB_RESET_REQUIRED': 'true',
                    'TERRITORY': process.env.TERRITORY || 'us1',
                },
            },
            // Example of using a condition on the step itself for Buildkite's 'if'
            // This condition would mean "only add this trigger if IS_DEMO_ENV is 'true' in Buildkite"
            // You would need to ensure IS_DEMO_ENV is correctly set in Buildkite's agent environment
            // condition: new Condition('env_check', { envVarName: 'IS_DEMO_ENV', envVarValue: 'true' }),
        }));
    }

    // Scenario 4: Disabled CI Deployment (Current)
    // This step is triggered if --disable-ci-deploy is passed.
    if (options.disableCiDeploy) {
        pipeline.addStep(new Step('disable-ci-current', '🚫 Disable CI Deployment', {
            type: 'trigger',
            command: 'frontend-ci-disable-deployment', // Different Buildkite pipeline slug
            async: true, // Asynchronous trigger
            build: {
                message: `Disable CI Deployment: ${pipeline.globalEnvironmentVariables.BUILDKITE_BRANCH}`,
                commit: 'HEAD',
                branch: pipeline.globalEnvironmentVariables.BUILDKITE_BRANCH,
                env: {
                    'CONCURRENCY_GROUP': 'dynamic-group-123', // Example static value
                    'MULTI_REGION': 'false',
                    'SOURCE': pipeline.globalEnvironmentVariables.DATADOG_TAGS_SOURCE,
                    'TERRITORY': process.env.TERRITORY || 'us1',
                },
            }
        }));
    }

    // Scenario 5: Disabled CI Deployment (Previous - Conceptual, requires more context)
    // This would be another 'disable' trigger step, potentially with a condition
    // checking for `PREVIOUS_TERRITORY_TO_BE_RELEASED_EXIST` from Buildkite metadata,
    // similar to how eks_showcase_deploy.sh handles it.
    // For the demo, focusing on the 4 explicit command-line driven ones is enough.
    // You can talk about how this would be added in your explanation.

    return pipeline;
}

const pipeline = createCiDeploymentPipeline();
const buildkiteYaml = pipeline.generateBuildkiteSteps();

// Output the generated YAML to the console
console.log(yaml.stringify(buildkiteYaml));