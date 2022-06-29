'use strict';
import axios from 'axios';
import config from 'config';

/**
 * Git wrapper object
 */
export default class Github {

    /**
    * Dummy task
    * @link https://docs.github.com/en/rest/reference/repos
    */
    async listRepos() {

        const axe = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            baseURL: `${config.get('github')['host']}/orgs/${config.get('github')['org']['key']}/`,
            proxy: false,
            auth: {
                username: process.env.GITHUB_USER,
                password: process.env.GITHUB_PASS,
            },
        });

        await axe.get('/repos').then((response: { data: { name: string }[] }) => {
            console.log(response.data.map(entry => entry.name));
        }).catch((error) => {
            console.error(error);
        });
    }
}
