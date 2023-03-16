import { ApiManagementClient, KeyVaultContractCreateProperties, NamedValueCreateContract } from '@azure/arm-apimanagement'
import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'
import { Workflow } from '../../azureManagement.mjs'

class NamedValues {
  private apiMngClient:ApiManagementClient
  private vault:string
  rg:string
  service:string
  constructor(rg:string, service:string, vault:string) {
    this.apiMngClient = new ApiManagementClient(new DefaultAzureCredential(), process.env.AZURE_SUBSCRIPTION_ID)
    this.vault = vault
    this.rg = rg
    this.service = service
  }

  async createNamedValue(name:string) {
    const vaultClient = new SecretClient(`https://${this.vault}.vault.azure.net`, new DefaultAzureCredential())
    const secret = await vaultClient.getSecret(name)
    const t = {
      displayName: name,
      keyVault: {
        secretIdentifier: secret.properties.id
      } as KeyVaultContractCreateProperties,
      secret: true
    } as NamedValueCreateContract
    this.apiMngClient.namedValue.beginCreateOrUpdate(this.rg, this.service, name, t)
  }

  async parse(data:Workflow[]) {
    for (let i = 0; i < data.length; i++) {
      const name = `${new URL(data[i].basePath).pathname.replace('/api/', '').replace('/triggers/manual/invoke', '')}`
      this.createNamedValue(NamedValues.parseName(name))
    }
  }

  static parseName(name:string):string {
    return `${name.replace('_', '-')}-sig`
  }
}

export { NamedValues }
