import { URL } from 'url'
import xml2js from 'xml2js'
import { ExistsAction, AzureApiManangementPolices } from './azure/ApiManagement/Policies.mjs'
import { type Workflow } from './azureManagement.mjs'
import { NamedValues } from './azure/ApiManagement/NamedValues.mjs'
import { ApiManagementClient, ApiPolicyCreateOrUpdateResponse, PolicyContract } from '@azure/arm-apimanagement'
import { DefaultAzureCredential } from '@azure/identity'

class Policies {
  private apiMngClient:ApiManagementClient
  rg:string
  service:string
  constructor(rg:string, service:string) {
    this.apiMngClient = new ApiManagementClient(new DefaultAzureCredential(), process.env.AZURE_SUBSCRIPTION_ID)
    this.rg = rg
    this.service = service
  }

  async writePolicy(api:string, data:Workflow[]):Promise<ApiPolicyCreateOrUpdateResponse> {
    const policyName = 'policy'
    return await this.apiMngClient.apiPolicy.createOrUpdate(this.rg, this.service, api, policyName, { format: 'xml', value: await this.parse(data) } as PolicyContract)
  }

  /**
   * @see https://learn.microsoft.com/en-us/azure/api-management/api-management-policy-expressions
   */
  private async parse(data:Workflow[]):Promise<string> {
    const policies = new AzureApiManangementPolices()
    for (let i = 0; i < data.length; i++) {
      const path = new URL(data[i].basePath).pathname.replace('/api/', '').replace('/triggers/manual/invoke', '')
      for (let j = 0; j < Object.entries(data[i].queries).length; j++) {
        const name = Object.entries(data[i].queries)[j][0]
        const value = Object.entries(data[i].queries)[j][1]
        if (['api-version', 'sp', 'sv'].includes(name)) {
          policies.inbound().setQueryParam(name, value, ExistsAction.override)
          policies.inbound().setHeader('Content-Type', 'application/json', ExistsAction.override)
        } else {
          let condition:string
          if (data[i].relativePath !== undefined) {
            const relative = data[i].relativePath.replace(/[A-Za-z0-9{}]+/g, '[A-Za-z0-9]+')
            condition = `@(Regex.Match(context.Request.Url.Path, @"${path}${relative}$").Success != false)`
          } else {
            condition = `@(Regex.Match(context.Request.Url.Path, @"${path}$").Success != false)`
          }
          if (name === 'sig') {
            policies.inbound().setQueryParam(name, `{{${NamedValues.parseName(path)}}}`, ExistsAction.override, condition)
          } else {
            policies.inbound().setQueryParam(name, value, ExistsAction.override, condition)
          }
          policies.inbound().setBackendService(data[i].basePath, condition)
          if (data[i].relativePathParameters !== undefined && data[i].relativePathParameters.length > 0) {
            const relative = []
            for (let k = 0; k < data[i].relativePathParameters.length; k++) {
              relative.push(`context.Request.MatchedParameters["${data[i].relativePathParameters[k]}"]`)
            }
            policies.inbound().setRewriteUri(`@{ return "/" + ${relative.join(' + "/" + ')};}`, condition)
          } else {
            policies.inbound().setRewriteUri('/', condition)
          }
        }
      }
    }
    return new xml2js.Builder({ headless: true }).buildObject(policies.doc).replaceAll('%7B', '{').replaceAll('%7D', '}')
  }
}

export { Policies }
