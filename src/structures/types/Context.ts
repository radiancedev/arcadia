import { Request, Response } from 'express';
import { Application } from '../../Application';

export class Context {
    private _request: Request;
    private _response: Response;

    constructor(request: Request, response: Response) {
        this._request = request;
        this._response = response;
    }

    public get app() {
        return Application.SELF;
    }

    public get request() {
        return this._request;
    }

    public get response() {
        return this._response;
    }

    public async render(view: string, data?: object) {
        return await this.app.context.views.render(view, data);
    }

    public async view(view: string, data?: object) {
        // Render the view.
        const html = await this.render(view, data); 
        
        this.response.send(html);
    }
}