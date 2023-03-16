import { ApiManagementClient, ApiCreateOrUpdateParameter, KnownApiType, ApiCreateOrUpdateResponse, KnownContentFormat, KnownProtocol } from '@azure/arm-apimanagement'
import { DefaultAzureCredential } from '@azure/identity'
import { ContentObject, MediaTypeObject, OpenApiBuilder, OpenAPIObject, OperationObject, ParameterObject, PathItemObject, RequestBodyObject, ResponseObject, ResponsesObject, SchemaObject, SecuritySchemeObject, ServerObject } from 'openapi3-ts'
import { type Workflow } from './azureManagement.mjs'
type Config = {
  title: string,
  suffix: string,
  version: string,
  env: string
}

const logicAppSchemaValidationErrorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string'
        },
        message: {
          type: 'string'
        }
      },
      required: [
        'code',
        'message'
      ]
    }
  },
  required: [
    'error'
  ]
}

class OpenApi {
  private apiMngClient: ApiManagementClient
  private rg: string
  private gateway: string
  private api: string

  constructor(rg: string, gateway: string, api: string) {
    this.apiMngClient = new ApiManagementClient(new DefaultAzureCredential(), process.env.AZURE_SUBSCRIPTION_ID)
    this.rg = rg
    this.gateway = gateway
    this.api = api
  }

  async createOrUpdate(data: Workflow[], conf: Config): Promise<ApiCreateOrUpdateResponse> {
    const parameters: ApiCreateOrUpdateParameter = {
      apiType: KnownApiType.Http,
      format: KnownContentFormat.OpenapiJson,
      protocols: [KnownProtocol.Https],
      description: conf.title,
      displayName: conf.title,
      path: conf.suffix,
      value: JSON.stringify(await this.parse(data, conf)),
      isOnline: true
    }
    return this.apiMngClient.api.beginCreateOrUpdateAndWait(this.rg, this.gateway, this.api, parameters)
  }

  private async createPathItem(oab: OpenApiBuilder, workflow: Workflow): Promise<PathItemObject> {
    const httpVerb = workflow.method.toLowerCase()
    const description = new URL(workflow.basePath).pathname.replace('/api/', '').replace('/triggers/manual/invoke', '')
    const result: PathItemObject = { [httpVerb]: { summary: description, description, responses: { default: { description: '' } as ResponseObject } as ResponsesObject } as OperationObject }
    result[httpVerb].responses = { default: { description: 'default', content: { 'application/json': {} } as MediaTypeObject } } as ResponsesObject
    result[httpVerb].responses[500] = { description: 'Internal server error', content: { 'application/json': {} } }
    result[httpVerb].responses[200] = { description: 'Ok', content: { 'application/json': {} } }
    if (httpVerb === 'post') {
      if (workflow.definition.triggers.manual.operationOptions === 'EnableSchemaValidation') {
        result[httpVerb].responses[400] = { description: 'Bad request', content: { 'application/json': { schema: logicAppSchemaValidationErrorSchema } as MediaTypeObject } }

        if (workflow.definition.triggers.manual.inputs.schema) {
          const schema = workflow.definition.triggers.manual.inputs.schema as unknown as SchemaObject
          let rb: RequestBodyObject
          if (schema) {
            // console.log(`NAME: ${description}`)
            // console.dir(schema, { depth: 10 })
            rb = { content: { 'application/json': { schema } as MediaTypeObject } as ContentObject } // this will break the openapi if the schema is not valid
          } else {
            console.log('No definitions found')
            rb = { content: { 'application/json': { schema: {} } as MediaTypeObject } as ContentObject }
          }
          result[httpVerb].requestBody = rb
        }
      }
    }
    return result
  }

  private async parse(data: Workflow[], config: Config): Promise<OpenAPIObject> {
    const oab: OpenApiBuilder = new OpenApiBuilder()

    oab.addTitle(config.title).addVersion(config.version).addDescription('This API is generated')
    oab.addSecurityScheme('apiKeyHeader', { type: 'apiKey', name: 'Ocp-Apim-Subscription-Key', in: 'header' } as SecuritySchemeObject)
    oab.addSecurityScheme('apiKeyQuery', { type: 'apiKey', name: 'subscription-key', in: 'query' } as SecuritySchemeObject)
    oab.addServer({ url: `https://${this.gateway}.azure-api.net/${config.suffix}`, description: 'This api is auto-generated' } as ServerObject)

    for (let i = 0; i < data.length; i++) {
      const path = new URL(data[i].basePath).pathname.replace('/api/', '').replace('/triggers/manual/invoke', '')
      const pathItem = await this.createPathItem(oab, data[i])

      data[i]?.relativePath ? oab.addPath(`/${(path + data[i]?.relativePath).trim()}`, pathItem) : oab.addPath(`/${(path).trim()}`, pathItem)

      const parameters: ParameterObject[] = []
      if (data[i]?.relativePathParameters?.length > 0) {
        for (let j = 0; j < data[i].relativePathParameters.length; j++) {
          const t: ParameterObject = {
            name: data[i].relativePathParameters[j],
            in: 'path',
            required: true,
            schema: { type: 'string' } as SchemaObject
          }
          parameters.push(t)
        }
      }

      if (parameters.length > 0) {
        const fPath = `/${path}${data[i]?.relativePath}`
        oab.rootDoc.paths[fPath].parameters = parameters
      }
    }

    return oab.rootDoc
  }
}

export { OpenApi }