import createHandler from 'github-webhook-handler';
import { config } from 'dotenv';
import http from 'http';
import path from 'path';
import { exec } from 'child_process';

class EnvError extends Error {}

config();

function assertEnv(key: string, defaultValue?: string) {
    const e = process.env[key];
    if (e === undefined) {
        if (defaultValue) 
            return defaultValue;
        else
            throw new EnvError(`${key} is not defined at the .env file.`);
    }
    return e;
}

try {
    const secret = assertEnv('SECRET');
    const port = assertEnv('PORT', '7777');
    const branch = assertEnv('BRANCH', 'master');
    const scriptPath = assertEnv('SCRIPT_PATH');

    const handler = createHandler({ path: '/', secret });

    http.createServer((req, res) => {
        handler(req, res, (err) => {
            res.statusCode = 404;
            res.end('no such location');
        });
    }).listen(parseInt(port));

    handler.on('push', function ({payload}) {
        if (payload.refs !== `ref/heads/${branch}`) {
            console.log('Received hooks but the ref is ' + payload.ref + ' so ignored');
            return;
        }
        exec(scriptPath, {
            cwd: path.dirname('sh ' + scriptPath),
        });
    });
} catch (e) {
    if (e instanceof EnvError) {
        console.error(e.message);
        process.exit(1);
    }
}