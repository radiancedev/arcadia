import e, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Application as ArcadiaApplication } from '../../Application';

export class Context {
    public request: ExpressRequest;
    public response: ExpressResponse;
    private _values: Map<string, any>;
    public parsedParams: string[];

    constructor(request: ExpressRequest, response: ExpressResponse) {
        this.request = request;
        this.response = response;
        this.parsedParams = [];
        this._values = new Map();
    }


    has(key: string) {
        return this._values.has(key);
    }

    get(key: string) {
        return this._values.get(key);
    }

    set(key: string, value: any) {
        this._values.set(key, value);
    }

    contains(key: keyof Context, values: string[]): boolean {
        // If the key doesn't exist, return false.
        if (this[key] === undefined) return false;

        // If the key exists and there are no values, return true.
        if (values.length === 0) return true;

        // If the key exists and there are values, check if the values exist.
        return this[key] !== undefined && values.every((value) => this[key][value] !== undefined);
    }

    missing(key: keyof Context, values: string[]): string[] {
        // get all missing keys
        const missing = [];

        for (const value of values) {
            if (this[key][value] === undefined) missing.push(value);
        }
        
        return missing;
    }

    async render(view: string, data?: object) {
        return await ArcadiaApplication.SELF.render(view, data);
    }

    async view(view: string, data?: object) {
        // Render the view.
        const html = await this.render(view, data);

        this.response.send(html);
    }

    status(code: number) {
        this.response.status(code);

        return this;
    }

    send(data: any) {
        this.response.send(data);

        return this;
    }

    json(data: any) {
        this.response.json(data);

        return this;
    }

    redirect(url: string) {
        this.response.redirect(url);

        return this;
    }

    header(key: string) {
        return this.request.get(key);
    }

    setHeader(key: string, value: string) {
        this.response.setHeader(key, value);
    }



    /* Express Request Methods & Properties */
    
    get files() {
        return this.request.files;
    }

    get body() {
        return this.request.body;
    }

    get cookies() {
        return this.request.cookies;
    }

    get fresh() {
        return this.request.fresh;
    }

    get hostname() {
        return this.request.hostname;
    }

    get ip() {
        return this.request.ip;
    }

    get ips() {
        return this.request.ips;
    }

    get method() {
        return this.request.method;
    }

    get originalUrl() {
        return this.request.originalUrl;
    }

    get params() {
        return this.request.params;
    }

    get path() {
        return this.request.path;
    }

    get protocol() {
        return this.request.protocol;
    }

    get query() {
        return this.request.query;
    }

    get route() {
        return this.request.route;
    }

    get secure() {
        return this.request.secure;
    }

    get signedCookies() {
        return this.request.signedCookies;
    }

    get stale() {
        return this.request.stale;
    }

    get subdomains() {
        return this.request.subdomains;
    }

    get xhr() {
        return this.request.xhr;
    }
}