import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'
import { Workflow } from '../azureManagement.mjs'

class Vault {
  private client:SecretClient

  constructor(vault:string) {
    this.client = new SecretClient(`https://${vault}.vault.azure.net`, new DefaultAzureCredential())
  }

  async setSecret(name:string, secret:string) {
    await this.client.setSecret(name, secret, {
      enabled: true
    })
  }

  async parse(data:Workflow[]) {
    for (let i = 0; i < data.length; i++) {
      const name = `${new URL(data[i].basePath).pathname.replace('/api/', '').replace('/triggers/manual/invoke', '').replace('_', '-')}-sig`
      const sig = data[i].queries.sig
      await this.setSecret(name, sig)
    }
  }
}

export { Vault }
