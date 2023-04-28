import express, { NextFunction, Router } from "express";
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { WebsocketRequestHandler } from "express-ws";
import { glob } from "glob";
import { ParsedQs } from "qs";
import { Application } from "../Application";
import { Controller } from "../structures/Controller";
import { Context } from "../structures/types/Context";
import { EventEmitter } from "events";

export type ContextFunction = ((ctx: Context, ...args: any) => Promise<any>) & {
    fromController?: boolean;
    controller?: Controller;
};
export type ProcessorFunction = (ctx: Context, data?: any) => Promise<any>;
export type StringOrContextFunction = string | ContextFunction;

export enum RequestMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    OPTIONS = "options",
    HEAD = "head",
    ALL = "all",
}

export class Route extends EventEmitter {
    private paths: Map<string, Route>;
    private router: Router;
    public path: string;
    public controllers: Map<string, Controller>;
    public preprocessors: ProcessorFunction[];
    public postprocessors: ProcessorFunction[];
    public websockets: Map<string, WebsocketRequestHandler>;

    constructor(path?: string) {
        super();

        this.paths = new Map();
        this.path = path ?? "/";
        this.router = Router();
        this.controllers = new Map();
        this.preprocessors = [];
        this.postprocessors = [];
        this.websockets = new Map();
    }

    group(path: string, callback: (route: Route) => void) {
        const route = new Route(path);
        callback(route);
        this.paths.set(path, route);

        return this;
    }

    view(path: string, view: string, data?: object) {
        this.router.get(path, (req, res) => {
            let ctx = new Context(req, res);

            ctx.render(view, data);
        })
    }

    preprocess(callback: ProcessorFunction) {
        this.preprocessors.push(callback);

        return this;
    }

    postprocess(callback: ProcessorFunction) {
        this.postprocessors.push(callback);

        return this;
    }

    get(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.GET, ...values);
    }

    post(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.POST, ...values);
    }

    put(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.PUT, ...values);
    }

    delete(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.DELETE, ...values);
    }

    patch(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.PATCH, ...values);
    }

    options(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.OPTIONS, ...values);
    }

    head(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.HEAD, ...values);
    }

    all(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.ALL, ...values);
    }

    any(path: string, ...values: StringOrContextFunction[]) {
        return this._handle(path, RequestMethod.ALL, ...values);
    }

    ws(path: string, callback: WebsocketRequestHandler) {
        this.websockets.set(path, callback);

        return this;
    }

    static(path: string, folder: string) {
        this.router.use(path, express.static(folder));
    }

    build() {
        for (const [path, route] of this.paths) {
            this.router.use(path, route.build());
        }

        return this.router;
    }


    private async _handle(path: string, method: RequestMethod, ...values: StringOrContextFunction[]) {
        const routes: ContextFunction[] = [];
        for (let value of values) {
            if (typeof value === "string") {
                // Try to import the controller.
                let data = value.split("@");
                let name = data[0];
                let method = data[1];

                try {
                    const files = await glob(`**/${name}.ts`, {
                            absolute: true,
                            ignore: ["node_modules/**/*", "dist/**/*"],
                        })
                    const modules = await import(files[0]);
                    if (modules[name]) {
                        if (!this.controllers.has(name)) {
                            this.controllers.set(name, new modules[name]());
                        }
                        const func = this.controllers.get(name)?.[method] as ContextFunction;
                        func.controller = this.controllers.get(name);
                        func.fromController = true;

                        routes.push(func);
                    }

                } catch { }
            } else if (typeof value === "function") {
                routes.push(value);
            }
        }

        await this._handleRouteFunctions(path, method, routes);

        return this;
    }

    private async _handleRouteFunctions(path: string, method: RequestMethod, values: ContextFunction[]) {
        // implement all methods
        const callback = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction, ctxFunction: ContextFunction) => {
            if (res.headersSent === true) {
                return;
            }

            const ctx: Context = res.locals.ctx ?? new Context(req, res);
            res.locals.ctx = ctx;

            // parse parameters
            const params: string[] = [];
            for (const [key, value] of Object.entries(req.params)) {
                ctx.parsedParams.push(value);
            }

            try {
                await this._handleRequest(ctx, ctxFunction);
            } catch (error: any) {
                // send to the route error handler
                if (this.listeners("error").length !== 0) {
                    this.emit("error", ctx, error);
                }

                if (res.headersSent === false) {
                    Application.SELF.emit("error", ctx, error);
                }
            }

            if (res.headersSent === false) {

                next();
            } else {
            }
        }

        const routeFunctions = values.map(value => async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => await callback(req, res, next, value));

        if (method === RequestMethod.GET) {
            this.router.get(path, ...routeFunctions);
        } else if (method === RequestMethod.POST) {
            this.router.post(path, ...routeFunctions);
        } else if (method === RequestMethod.PUT) {
            this.router.put(path, ...routeFunctions);
        } else if (method === RequestMethod.DELETE) {
            this.router.delete(path, ...routeFunctions);
        } else if (method === RequestMethod.PATCH) {
            this.router.patch(path, ...routeFunctions);
        } else if (method === RequestMethod.OPTIONS) {
            this.router.options(path, ...routeFunctions);
        } else if (method === RequestMethod.HEAD) {
            this.router.head(path, ...routeFunctions);
        } else if (method === RequestMethod.ALL) {
            this.router.all(path, ...routeFunctions);
        }
    }

    private async _handleRequest(ctx: Context, ctxFunction: ContextFunction) {
        // Run preprocessors.
        for (const preprocessor of this.preprocessors) {
            if (ctx.response.headersSent) {
                break;
            }

            await preprocessor(ctx, null);
        }

        if (ctx.response.headersSent) {
            return;
        }

        // kekw
        // @ts-ignore
        let response;
        if (ctxFunction.fromController == true) {
            response = await ctxFunction.call(ctxFunction.controller, ctx, ...ctx.parsedParams);
        } else {
            response = await ctxFunction(ctx, ...ctx.parsedParams);
        }
        // Run postprocessors.
        for (const postprocessor of this.postprocessors) {
            if (ctx.response.headersSent) {
                break;
            }

            response = await postprocessor(ctx, response);
        }

        if (!ctx.response.headersSent) {
            if (typeof response === "object") {
                ctx.response.json(response);
            } else if (typeof response === "string") {
                ctx.response.send(response);
            }
        }

    }
}
