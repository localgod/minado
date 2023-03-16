import fs from 'fs'
import { Command } from 'commander'
import { getWorkflows } from './azureManagement.mjs'
import { OpenApi } from './OpenApi.mjs'
import { Policies } from './Policies.mjs'
import { Vault } from './azure/Secrets.mjs'
import { NamedValues } from './azure/ApiManagement/NamedValues.mjs'
import chalk from 'chalk'

const log = console.log
const program = new Command()
program.description('Genenrate OpenApi specifications and Azure API Management policies from Azure Logic App Standard workflows.')
program.option('--suffix <suffix>', 'api suffix', 'las')
program.option('--version <version>', 'api version', '1.0.0')
program.option('--title <title>', 'api title', 'Logic App Standard')
program.option('--env <env>', 'environment', 'dev')
program.requiredOption('--source-rg <rg>', 'name of resource group containing logic app')
program.requiredOption('--source-app <app>', 'name of logic app')
program.requiredOption('--target-rg <rg>', 'name of resource group containing api manager')
program.requiredOption('--gateway <name>', 'name of gateway')
program.requiredOption('--api <name>', 'name of api')
program.requiredOption('--keyvault <name>', 'keyvault name')
program.action(async (options) => {
  const cache:string = '/tmp/minado-cache.json'
  if (!fs.existsSync(cache)) {
    log(chalk.yellow('Caching request'))
    await fs.promises.writeFile(cache, JSON.stringify(await getWorkflows(options.sourceRg, options.sourceApp), null, 2))
  }

  log(chalk.yellow('Reading workflows'))
  const input = JSON.parse(await fs.promises.readFile(cache, 'utf8'))
  const config = { title: options.title, suffix: options.suffix, version: options.version, env: options.env }
  log(chalk.yellow('Updating vault secrets'))
  await new Vault(options.keyvault).parse(input)
  log(chalk.yellow('Updating named values'))
  await new NamedValues(options.targetRg, options.gateway, options.keyvault).parse(input)
  log(chalk.yellow('Publish OpenApi specifications'))
  await new OpenApi(options.targetRg, options.gateway, options.api).createOrUpdate(input, config)
  log(chalk.yellow('Publish policies'))
  await new Policies(options.targetRg, options.gateway).writePolicy(options.api, input)
})
program.parse()