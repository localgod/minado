import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Logger from '../Logger.js';
import { inspect } from 'util'
/**
 * Confluence access object
 */
export default class Confluence {
  private log: Logger;
  private axios: AxiosInstance;
  /**
   * Contruct Confluence access object
   * @constructor
   * @param {object} config - Config options
   */
  constructor(config: object) {
    this.log = new Logger();
    this.axios = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      baseURL: `${config['host']}`,
      proxy: false,
      auth: {
        username: process.env.AD_USERNAME,
        password: process.env.AD_PASSWORD,
      },
    });
  }

  /**
   * Create page
   * @param {string} space    - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title    - Page title
   * @param {string} content  - Page content
   */
  async createPage(space: string, ancestor: number, title: string, content: string): Promise<ConfluencePage> {
    const data = this.marshal(space, title, ancestor, content);
    return this.axios.post(`/rest/api/content`, data).then((response: AxiosResponse) => {
      return response.data;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.message)
      process.exit(1)
    })
  }

  /**
   * Update page
   * @param {string} space    - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title    - Page title
   * @param {number} id       - Page id
   * @param {number} version  - Page version
   * @param {string} content  - Page content
   */
  async updatePage(space: string, ancestor: number, title: string, id: number, version: number, content: string): Promise<ConfluencePage> {
    const data = this.marshal(space, title, ancestor, content, version);
    return this.axios.put(`/rest/api/content/${id}`, data).then((response: AxiosResponse) => {
      return response.data;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.message)
      process.exit(1)
    })
  }

  /**
   * Get page
   * @param {string} space - Space key
   * @param {string} title - Page title
   */
  async getPage(space: string, title: string): Promise<ConfluenceContentQuery> {
    return this.axios.get(
      `/rest/api/content?spaceKey=${space}&title=${title.trim()}&expand=version`,
    ).then((response: AxiosResponse) => {
      console.log(inspect(response.data, false, null))
      return response.data;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.message)
      process.exit(1)
    })
  }

  /**
   * Store page
   * @param {string} space    - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title    - Page title
   * @param {string} content  - Page content
   */
  async store(space: string, ancestor: number, title: string, content: string): Promise<void> {
    const query = await this.getPage(space, title);
    if (query.size === 0) {
      this.createPage(space, ancestor, title, content).then((page) => {
        this.log.info(`Created page: ${page._links.base}/${page._links.webui}`);
      })
    } else {
      this.updatePage(space, ancestor, title, query.results[0].id, query.results[0].version.number, `${content}`)
        .then((page) => {
          this.log.info(`Updated page: ${page._links.base}/${page._links.webui}`);
        })
    }
  }

  /**
   * Marshal data
   * 
   * @param {string} space    - Space key
   * @param {string} title    - Page title
   * @param {number} ancestor - Ancestor id
   * @param {string} content  - Page content
   * @param {number} version  - Page version
   * @return {object}
   */
  marshal(space: string, title: string, ancestor: number, content: string, version?: number): object {
    const data: object = {};
    data['type'] = 'page';
    data['title'] = title.trim();
    data['ancestors'] = [{
      'id': ancestor,
    }];
    data['space'] = {
      'key': space,
    };
    data['body'] = {
      'storage': {
        'value': content,
        'representation': 'storage',
      },
    };
    if (version) {
      data['version'] = {
        'number': version + 1,
      };
    }
    return data;
  }
}

interface ConfluencePage {
  id: number,
  type: string,
  status: string,
  title: string,
  space: {
    id: number,
    key: string,
    name: string,
    type: string,
    _links: {
      webui: string,
      self: string
    },
    _expandable: {
      metadata: string,
      icon: string,
      description: string,
      homepage: string
    }
  },
  history: {
    latest: boolean,
    createdBy: {
      type: string,
      username: string,
      userKey: string,
      profilePicture: {
        path: string,
        width: number,
        height: number,
        isDefault: boolean
      },
      displayName: string,
      _links: {
        self: string
      },
      _expandable: { status: string }
    },
    createdDate: string,
    _links: {
      self: string
    },
    _expandable: {
      lastUpdated: string,
      previousVersion: string,
      contributors: string,
      nextVersion: string
    }
  },
  version: {
    by: {
      type: string,
      username: string,
      userKey: string,
      profilePicture: {
        path: string,
        width: number,
        height: number,
        isDefault: boolean
      },
      displayName: string,
      _links: {
        self: string
      },
      _expandable: { status: string }
    },
    when: string,
    number: number,
    minorEdit: boolean,
    hidden: boolean,
    _links: {
      self: string
    },
    _expandable: { content: string }
  },
  ancestors: [
    {
      id: number,
      type: string,
      status: string,
      title: string,
      extensions: { position: string },
      _links: {
        webui: string,
        edit: string,
        tinyui: string,
        self: string
      },
      _expandable: {
        container: string,
        metadata: string,
        operations: string,
        children: string,
        restrictions: string,
        history: string,
        ancestors: string,
        body: string,
        version: string,
        descendants: string,
        space: string
      }
    },
    {
      id: number,
      type: string,
      status: string,
      title: string,
      extensions: { position: string },
      _links: {
        webui: string,
        edit: string,
        tinyui: string,
        self: string
      },
      _expandable: {
        container: string,
        metadata: string,
        operations: string,
        children: string,
        restrictions: string,
        history: string,
        ancestors: string,
        body: string,
        version: string,
        descendants: string,
        space: string
      }
    }
  ],
  container: {
    id: number,
    key: string,
    name: string,
    type: string,
    _links: {
      webui: string,
      self: string
    },
    _expandable: {
      metadata: string,
      icon: string,
      description: string,
      homepage: string
    }
  },
  body: {
    storage: {
      value: string,
      representation: string,
      _expandable: { content: string }
    },
    _expandable: {
      editor: string,
      view: string,
      export_view: string,
      styled_view: string,
      anonymous_export_view: string
    }
  },
  extensions: { position: string },
  _links: {
    webui: string,
    edit: string,
    tinyui: string,
    collection: string,
    base: string,
    context: string,
    self: string
  },
  _expandable: {
    metadata: string,
    operations: string,
    children: string,
    restrictions: string,
    descendants: string
  }
}

interface ConfluenceContentQuery {
  results: [
    {
      id: number,
      type: string,
      status: string,
      title: string,
      version: {
        by: {
          type: string,
          username: string,
          userKey: string,
          profilePicture: {
            path: string,
            width: number,
            height: number,
            isDefault: boolean
          },
          displayName: string,
          _links: {
            self: string
          },
          _expandable: { status: string }
        },
        when: string,
        message: string,
        number: number,
        minorEdit: boolean,
        hidden: boolean,
        _links: {
          self: string
        },
        _expandable: { content: string }
      },
      extensions: { position: string },
      _links: {
        webui: string,
        edit: string,
        tinyui: string,
        self: string
      },
      _expandable: {
        container: string,
        metadata: string,
        operations: string,
        children: string,
        restrictions: string,
        history: string,
        ancestors: string,
        body: string,
        descendants: string,
        space: string
      }
    }
  ],
  start: number,
  limit: number,
  size: number,
  _links: {
    self: string,
    base: string,
    context: string
  }
}

