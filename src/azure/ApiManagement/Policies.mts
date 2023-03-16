enum Actions {
    setQueryParam = 'set-query-parameter',
    setBackendService = 'set-backend-service',
    setHeader = 'set-header',
    rewriteUri = 'rewrite-uri'
}

enum Sections {
  inbound = 'inbound',
  outbound = 'outbound',
  backend = 'backend',
  'on-error' = 'on-error'
}

enum ExistsAction {
    override = 'override',
    skip = 'skip',
    append = 'append',
    delete = 'delete'
}

type SetQueryParameter = {
    $: {
        name: string,
        'exists-action': ExistsAction
    },
    value: string
}

type RewriteUri = {
  $: {
    name: string,
    template: string
  }
}

type SetBackendService = {
    $: {
    'base-url': string
    }
}

type SetHeader = {
    $: {
    'name': string,
    'exists-action': ExistsAction
  },
  value: string
}

type Condition = {
  $: { condition:string },
  'set-query-parameter'?: SetQueryParameter[],
  'set-header'?: SetHeader[],
  'set-backend-service'?: SetBackendService[]
}

type Choose = {
  'when'?: Condition[]
}

type Section = {
  'base': null,
  'set-query-parameter'?: SetQueryParameter[],
  'set-backend-service'?: SetBackendService[],
  'set-header'?: SetHeader[],
  'choose'?: Choose
}
type Policies = {
  policies: {
      inbound: Section,
      backend: Section
      outbound: Section
      'on-error': Section
  }
}

class AzureApiManangementPolices {
  doc:Policies = {
    policies: {
      inbound: {
        base: null,
        [Actions.setQueryParam]: [],
        [Actions.setHeader]: [],
        [Actions.setBackendService]: []
      },
      backend: {
        base: null,
        [Actions.setQueryParam]: [],
        [Actions.setHeader]: [],
        [Actions.setBackendService]: []
      },
      outbound: {
        base: null,
        [Actions.setQueryParam]: [],
        [Actions.setHeader]: [],
        [Actions.setBackendService]: []
      },
      'on-error': {
        base: null,
        [Actions.setQueryParam]: [],
        [Actions.setHeader]: [],
        [Actions.setBackendService]: []
      }
    }
  }

  inboundPolicies = new AzureApiManangementPolices.PolicesSection(this, Sections.inbound)
  outboundPolicies = new AzureApiManangementPolices.PolicesSection(this, Sections.outbound)
  backendPolicies = new AzureApiManangementPolices.PolicesSection(this, Sections.backend)
  onErrorPolicies = new AzureApiManangementPolices.PolicesSection(this, Sections['on-error'])

  inbound() {
    return this.inboundPolicies
  }

  outbound() {
    return this.outboundPolicies
  }

  backend() {
    return this.backendPolicies
  }

  onError() {
    return this.onErrorPolicies
  }

  static PolicesSection = class {
    policies:AzureApiManangementPolices = null
    section:Sections = undefined

    constructor(policies: AzureApiManangementPolices, section:Sections) {
      this.policies = policies
      this.section = section
    }

    private createCondition(condition:string):void {
      this.getSection().choose ??= {}
      this.getSection().choose.when ??= []
      this.getSection().choose.when.push({ $: { condition } } as Condition)
    }

    private findCondition(condition:string):number {
      if (this.getSection().choose === undefined || this.getSection().choose.when === undefined) {
        return -1
      }
      return this.getSection().choose.when.findIndex((elm:Condition) => {
        if (elm.$.condition === condition) {
          return true
        }
        return false
      })
    }

    private getSection():Section {
      return this.policies.doc.policies[this.section] as Section
    }

    private createActionList(condition:string, action:Actions):void {
      if (this.getSection().choose.when[this.findCondition(condition)][action] === undefined) {
        this.getSection().choose.when[this.findCondition(condition)][action] = []
      }
    }

    private addAction(type:Actions, action:any, condition?:string) {
      if (condition) {
        this.getSection().choose.when[this.findCondition(condition)][type].push(action)
      } else {
        this.getSection()[type].push(action)
      }
    }

    private actionExists(type:Actions, action, condition?:string) {
      let actionList: any[]
      if (condition) {
        if (this.findCondition(condition) >= 0) {
          actionList = this.getSection().choose.when[this.findCondition(condition)][type]
        }
      } else {
        actionList = this.getSection()[type]
      }
      return actionList.some((entry) => {
        switch (type) {
          case Actions.setQueryParam:
            if (entry.$.name === action.$.name) {
              return true
            }
            return false
          case Actions.setHeader:
            if (entry.$.name === action.$.name) {
              return true
            }
            return false
          case Actions.setBackendService:
            if (entry.$['base-url'] === action.$['base-url']) {
              return true
            }
            return false
          case Actions.rewriteUri:
            if (entry.$.template === action.$.template) {
              return true
            }
            return false
          default:
            return false
        }
      })
    }

    private appendAction(action, type:Actions, condition?:string) {
      if (condition) {
        if (!(this.findCondition(condition) >= 0)) {
          this.createCondition(condition)
          this.createActionList(condition, type)
          if (!this.actionExists(type, action, condition)) {
            this.addAction(type, action, condition)
          }
        } else {
          this.createActionList(condition, type)
          if (!this.actionExists(type, action, condition)) {
            this.addAction(type, action, condition)
          }
        }
      } else {
        if (!this.actionExists(type, action)) {
          this.addAction(type, action)
        }
      }
    }

    setQueryParam(name:string, value:string, action:ExistsAction, condition?:string) {
      const qp = { $: { name, 'exists-action': action }, value: encodeURIComponent(value) } as SetQueryParameter
      this.appendAction(qp, Actions.setQueryParam, condition)
    }

    setHeader(name:string, value:string, action:ExistsAction, condition?:string) {
      const sh = { $: { name, 'exists-action': action }, value } as SetHeader

      this.appendAction(sh, Actions.setHeader, condition)
    }

    setBackendService(baseurl:string, condition?:string):void {
      const bg = { $: { 'base-url': baseurl } } as SetBackendService
      this.appendAction(bg, Actions.setBackendService, condition)
    }

    setRewriteUri(template:string, condition?:string):void {
      const ru = { $: { template } } as RewriteUri
      this.appendAction(ru, Actions.rewriteUri, condition)
    }
  }
}

export { AzureApiManangementPolices, ExistsAction }
