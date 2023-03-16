import * as core from '@actions/core'
import { getWorkflows } from './azureManagement.mjs'
import { OpenApi } from './OpenApi.mjs'
import { Policies } from './Policies.mjs'
import { Vault } from './azure/Secrets.mjs'
import { NamedValues } from './azure/ApiManagement/NamedValues.mjs'

async function run(): Promise<void> {
  try {
    const tenant: string = core.getInput('tenant')
    const clientId: string = core.getInput('clientId')
    const clientSecret: string = core.getInput('clientSecret')
    const sourcesub: string = core.getInput('sourcesub')
    const sourcerg: string = core.getInput('sourcerg')
    const targetrg: string = core.getInput('targetrg')
    const targetsub: string = core.getInput('targetsub')
    const sourceapp: string = core.getInput('sourceapp')
    const gateway: string = core.getInput('gateway')
    const api: string = core.getInput('api')
    const keyvault: string = core.getInput('keyvault')
    const suffix: string = core.getInput('suffix')
    const version: string = core.getInput('version')
    const title: string = core.getInput('title')
    const env: string = core.getInput('env')

    process.env.AZURE_TENANT_ID = tenant
    process.env.AZURE_CLIENT_ID = clientId
    process.env.AZURE_CLIENT_SECRET = clientSecret
    process.env.AZURE_SUBSCRIPTION_ID = sourcesub

    core.info('Reading workflows')
    const input = await getWorkflows(sourcerg, sourceapp)
    process.env.AZURE_SUBSCRIPTION_ID = targetsub

    core.info('Updating vault secrets')
    await new Vault(keyvault).parse(input)
    core.info('Updating named values')
    await new NamedValues(targetrg, gateway, keyvault).parse(input)
    core.info('Publish OpenApi specifications')
    await new OpenApi(targetrg, gateway, api).createOrUpdate(input, { title, suffix, version, env })
    core.info('Publish policies')
    await new Policies(targetrg, gateway).writePolicy(api, input)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
    core.error('This is a bad error. This will also fail the build.')
  }
}

run()
