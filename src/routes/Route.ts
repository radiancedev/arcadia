import { Router } from "express";
import { ParamsDictionary, Request as CoreRequest, Response as CoreResponse } from "express-serve-static-core";
import { WebsocketRequestHandler } from "express-ws";
import { glob } from "glob";
import { ParsedQs } from "qs";
import { Controller } from "../structures/Controller";
import { Context } from "../structures/types/Context";

type ContextFunction = (ctx: Context, ...args: any) => Promise<any>;
type ProcessorFunction = (ctx: Context, data?: any) => Promise<any>;
type StringOrContextFunction = string | ContextFunction;

enum RequestMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    OPTIONS = "options",
    HEAD = "head",
    ALL = "all",
}

export class Route {
    private paths: Map<string, Route>;
    private router: Router;
    public path: string;
    public controllers: Map<string, Controller>;
    public preprocessors: ProcessorFunction[];
    public postprocessors: ProcessorFunction[];
    public websockets: Map<string, WebsocketRequestHandler>;

    constructor(path?: string) {
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

    build() {
        for (const [path, route] of this.paths) {
            this.router.use(path, route.build());
        }

        return this.router;
    }


    private _handle(path: string, method: RequestMethod, ...values: StringOrContextFunction[]) {
        for (let value of values) {
            if (typeof value === "string") {
                // Try to import the controller.
                let data = value.split("@");
                let name = data[0];

                try {
                    glob(`**/${name}.ts`, {
                        absolute: true,
                        ignore: ["node_modules/**/*", "dist/**/*"],
                    }).then(files => {
                        import(files[0]).then((modules) => {
                            if (modules[name]) {
                                if (!this.controllers.has(name)) {
                                    this.controllers.set(name, new modules[name]());
                                }

                                this._handleRouteFunc(path, method, value);
                            }
                        })
                    })

                } catch { }
            } else if (typeof value === "function") {
                this._handleRouteFunc(path, method, value);
            }
        }

        return this;
    }

    private async _handleRouteFunc(path: string, method: RequestMethod, value: StringOrContextFunction) {
        // implement all methods
        const callback = async (req: CoreRequest, res: CoreResponse) => {
            const ctx = new Context(req, res);

            // parse parameters
            const params = [];
            for (const [key, value] of Object.entries(req.params)) {
                ctx.parsedParams.push(value);
            }

            if (typeof value === "string") {
                let data = value.split("@");
                let name = data[0];
                let func = value.includes("@") ? data[1] : "index";

                // @ts-ignore
                await this._handleRequest(ctx, this.controllers.get(name)[func], this.controllers.get(name));
            } else {
                await this._handleRequest(ctx, value);
            }
        }

        if (method === RequestMethod.GET) {
            this.router.get(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.POST) {
            this.router.post(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.PUT) {
            this.router.put(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.DELETE) {
            this.router.delete(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.PATCH) {
            this.router.patch(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.OPTIONS) {
            this.router.options(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.HEAD) {
            this.router.head(path, async (req, res) => await callback(req, res));
        } else if (method === RequestMethod.ALL) {
            this.router.all(path, async (req, res) => await callback(req, res));
        }
    }

    private async _handleRequest(ctx: Context, ctxFunction: ContextFunction, self?: Controller) {
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
        if (self) {
            response = await ctxFunction.call(self, ctx, ...ctx.parsedParams);
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
