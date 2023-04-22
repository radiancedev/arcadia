import { Request, Response } from 'express';
import { Application } from '../../Application';

export class Context extends Request{
    private _response: Response;

    constructor(request: Request, response: Response) {
        super("", undefined); // Hacky way to get the Request object to work.

        this._response = response;

        // Copy all properties from the request to this object.
        Object.assign(this, request);
    }

    public get response() {
        return this._response;
    }

    public async render(view: string, data?: object) {
        return await Application.SELF.context.views.render(view, data);
    }

    public async view(view: string, data?: object) {
        // Render the view.
        const html = await this.render(view, data); 
        
        this.response.send(html);
    }
}