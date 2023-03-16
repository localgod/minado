import { AccessToken, ClientSecretCredential, CredentialUnavailableError } from '@azure/identity'
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

type WorkflowDefinition = {
  '$schema': string,
  actions: {
    Response: {
      inputs: Object[],
      kind: string,
      runAfter: {},
      type: string
    }
  },
  contentVersion: string,
  outputs: {},
  triggers: {
    manual: {
      inputs: {
        method: string,
        relativePath: string,
        schema: [Object]
      },
      operationOptions?: string,
      kind: string,
      type: string
    }
  }
}

type Workflow = {
    id?: string,
    name?: string,
    type?: string,
    kind?: string,
    location?: string,
    value?: string,
    method?: string,
    basePath?: string,
    relativePath?: string,
    relativePathParameters?: string[],
    queries?: {
        'api-version'?: string,
        sp?: string,
        sv?: string,
        sig?: string
    },
    properties?: {
      flowState?: string, health?: {
        state?: string
      }
    },
    definition: WorkflowDefinition
}

function checkEnv () {
  function out (variable?: string): void { if (variable) { console.log(`Environment variable '${variable}' cannot be empty.`) } }
  process.env.AZURE_CLIENT_ID === undefined ? out('AZURE_CLIENT_ID') : out()
  process.env.AZURE_TENANT_ID === undefined ? out('AZURE_TENANT_ID') : out()
  process.env.AZURE_CLIENT_SECRET === undefined ? out('AZURE_CLIENT_SECRET') : out()
  process.env.AZURE_SUBSCRIPTION_ID === undefined ? out('AZURE_SUBSCRIPTION_ID') : out()
  if (!process.env.AZURE_CLIENT_ID ||
        !process.env.AZURE_TENANT_ID ||
        !process.env.AZURE_CLIENT_SECRET ||
        !process.env.AZURE_SUBSCRIPTION_ID) {
    process.exit(1)
  }
}

async function getToken (): Promise<string> {
  checkEnv()
  const scope = 'https://management.azure.com/.default'
  const credentials = new ClientSecretCredential(process.env.AZURE_TENANT_ID, process.env.AZURE_CLIENT_ID, process.env.AZURE_CLIENT_SECRET)
  return credentials.getToken(scope, { tenantId: process.env.AZURE_TENANT_ID }).then((response: AccessToken) => {
    return response.token
  }).catch((error: CredentialUnavailableError) => {
    console.log(error.message)
    process.exit(1)
    return ''
  })
}

async function getLogicAppWorkflows (rg: string, la: string): Promise<Workflow[]> {
  const config: AxiosRequestConfig = {}
  config.method = 'GET'
  config.headers = { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }
  config.baseURL = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}`
  config.url = `/resourceGroups/${rg}/providers/Microsoft.Web/sites/${la}/workflows`
  config.params = { 'api-version': '2018-11-01' }
  return axios.request(config).then((response: AxiosResponse) => {
    return response.data.value
  }).catch((error: AxiosError) => {
    return error.message
  })
}

async function getWorkflowDetails (rg: string, la: string, wf: string): Promise<Workflow> {
  const config: AxiosRequestConfig = {}
  config.method = 'POST'
  config.headers = { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }
  config.baseURL = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}`
  config.url = `/resourceGroups/${rg}/providers/Microsoft.Web/sites/${la}/hostruntime/runtime/webhooks/workflow/api/management/workflows/${wf}/triggers/manual/listCallbackUrl`
  config.params = { 'api-version': '2018-11-01' }
  return axios.request(config).then((response: AxiosResponse) => {
    return response.data
  }).catch((error: AxiosError) => {
    return error.message
  })
}

async function getWorkflowCode(rg: string, la: string, wf: string) {
  const config: AxiosRequestConfig = {}
  config.method = 'GET'
  config.headers = { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }
  config.baseURL = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}`
  config.url = `/resourceGroups/${rg}/providers/Microsoft.Web/sites/${la}/workflows/${wf}`
  config.params = { 'api-version': '2018-11-01' }
  return axios.request(config).then((response: AxiosResponse) => {
    return response.data
  }).catch((error: AxiosError) => {
    return error.message
  })
}

async function getWorkflows(rg: string, la: string): Promise<Workflow[]> {
  const workflows: Workflow[] = await getLogicAppWorkflows(rg, la)
  const k: object[] = []
  workflows.forEach((element: Workflow) => {
    k.push(getWorkflowDetails(rg, la, element.id.match(/^.*\/(.*)$/)[1]))
  })
  const extendedata = await extendWorkflows(rg, la)

  return Promise.all(k).then((result) => {
    const l: Workflow[] = []
    result.forEach((element:Workflow) => {
      if (typeof element === 'object') {
        l.push(element)
      }
    })
    for (let y = 0; l.length > y; y++) {
      const name = l[y].value.replace(`https://${la}.azurewebsites.net:443/api/`, '').replace(/\/.*/, '')
      l[y].definition = extendedata.find((e:{name:string}) => e.name === name).definition
    }

    return l
  })
}

async function extendWorkflows(rg: string, la: string): Promise<{name:string, definition:WorkflowDefinition}[]> {
  const workflows: Workflow[] = await getLogicAppWorkflows(rg, la)
  const k: object[] = []
  workflows.forEach((element: Workflow) => {
    k.push(getWorkflowCode(rg, la, element.id.match(/^.*\/(.*)$/)[1]))
  })

  return Promise.all(k).then((result) => {
    const l: {name:string, definition:WorkflowDefinition}[] = []
    result.forEach((element:{name:string, properties:{files:[]}}) => {
      const name = element.name.replace(`${la}/`, '')
      const definition = element.properties.files['workflow.json'].definition
      l.push({ name, definition })
    })
    return l
  })
}

export { getToken, getWorkflows, type Workflow, type WorkflowDefinition }
