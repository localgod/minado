# Minado

Minado is used for generating OpenApi specifications and Azure API Management policies from Azure Logic App Standard workflows. The tool requires arguments/env varibles to be set to be executed with the proper permissions.

Minado has two modes:

- Console mode
- Action mode

## Console mode

### Required env variable

- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_CLIENT_SECRET
- AZURE_SUBSCRIPTION_ID

### Example

```bash
$ node ./dist/Minado.mjs --help

Usage: Minado [options]

Generate OpenApi specifications and Azure API Management policies from Azure Logic App Standard workflows.

Options:
  --suffix <suffix>    api suffix (default: "las")
  --version <version>  api version (default: "1.0.0")
  --title <title>      api title (default: "Logic App Standard")
  --env <env>          environment (default: "dev")
  --source-rg <rg>     name of resource group containing logic app
  --source-app <app>   name of logic app
  --target-rg <rg>     name of resource group containing api manager
  --gateway <name>     name of gateway
  --api <name>         name of api
  --keyvault <name>    keyvault name
  -h, --help           display help for command

$ node ./dist/Minado.mjs --source-rg rg-platform --source-app las-1-dev --target-rg rg-platform --gateway apim-group-dev --api las-1-dev --keyvault kv-bubf2njz1skn2aeqrvtb --suffix las-1-dev
```

## Action mode

### Arguments

| Argument     | Required | Description                                           |
|--------------|----------|-------------------------------------------------------|
| tenant       | ✓        | azure tenant id                                       |
| clientId     | ✓        | azure client id                                       |
| clientSecret | ✓        | azure client secret                                   |
| sourcesub    | ✓        | azure source subscription id                          |
| sourcerg     | ✓        | name of resource group containing logic app           |
| sourceapp    | ✓        | name of logic app                                     |
| targetsub    | ✓        | azure target subscription id                          |
| targetrg     | ✓        | name of resource group containing api manager gateway |
| gateway      | ✓        | name of gateway                                       |
| keyvault     | ✓        | keyvault name                                         |
| api          | ✓        | name of api                                           |
| suffix       |          | api suffix                                            |
| version      |          | api version                                           |
| title        |          | api title                                             |
| env          |          | api environment                                       |

```yml
name: 'example'
on:
  push:
    branches:    
      - '**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generating OpenApi specifications and Azure API Management policies from Azure Logic App Standard workflows.
        uses: 3ShapeInternal/Minado@master
        with:
          tenant: ${{ env.ARM_TENANT_ID }}
          clientId: ${{ env.ARM_CLIENT_ID }}
          clientSecret: ${{ env.ARM_CLIENT_SECRET }}
          sourcesub: ${{ env.ARM_SUBSCRIPTION_ID }}
          sourcerg: ${{ vars.ARM_RESOURCE_GROUP }}
          sourceapp: ${{ vars.ARM_LOGICAPP_NAME }}
          targetsub: 0df5caa6-afaf-432b-b246-e9335aa553d1
          targetrg: rg1
          gateway: apim-1
          keyvault: kv-bubf2njz4tkn2aeqrvtb
          api: sub
          suffix: sub
          version: 1.0.0
          title: Subscription 
          env: ${{ github.event.inputs.environment }}
```
