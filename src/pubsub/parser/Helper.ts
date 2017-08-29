import * as request from 'request';

export class Helper {
    public static getUrl(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            request.get(url, (err, response) => {
                if (err) {
                    return reject(err);
                } else if (response.statusCode >= 400) {
                    return reject(new Error(`Received status code ${response.statusCode} when trying to get ${url}`));
                }
                return resolve(response.body);
            });
        });
    }
}
