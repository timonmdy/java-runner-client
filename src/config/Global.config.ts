interface GlobalConfig {
    repositoryApiUrl: string;
    repositoryUrl: string;
    releaseTagPrefix: string;
}

export const globalConfig: GlobalConfig = {
    repositoryApiUrl: 'https://api.github.com/repos/timonmdy/java-runner-client',
    repositoryUrl: 'https://github.com/timonmdy/java-runner-client',
    releaseTagPrefix: 'jrc-v'
}