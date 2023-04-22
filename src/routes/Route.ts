import { Router } from "express";
import { ParamsDictionary, Request as CoreRequest, Response as CoreResponse } from "express-serve-static-core";
import { WebsocketRequestHandler } from "express-ws";
import { glob } from "glob";
import { ParsedQs } from "qs";
import { Controller } from "../structures/Controller";
import { Context } from "../structures/types/Context";

type ContextFunction = (ctx: Context) => Promise<any>;
type ProcessorFunction = (ctx: Context, data?: any) => Promise<any>;

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

    get(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.GET, value);
    }

    post(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.POST, value);
    }

    put(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.PUT, value);
    }

    delete(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.DELETE, value);
    }

    patch(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.PATCH, value);
    }

    options(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.OPTIONS, value);
    }

    head(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.HEAD, value);
    }

    all(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.ALL, value);
    }

    any(path: string, value: string | ContextFunction) {
        return this._handle(path, RequestMethod.ALL, value);
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

    
    private _handle(path: string, method: RequestMethod, value: string | ContextFunction) {
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
    
            } catch {}
        } else if (typeof value === "function") {
            this._handleRouteFunc(path, method, value);
        }

        return this;
    }

    private async _handleRouteFunc(path: string, method: RequestMethod, value: string | ContextFunction) {
        // implement all methods
        const callback = async(req: CoreRequest, res: CoreResponse) => {
            const ctx = new Context(req, res);

            if (typeof value === "string") {
                let data = value.split("@");
                let name = data[0];
                let func = value.includes("@") ? data[1] : "index";
                
                // @ts-ignore
                await this._handleRequest(ctx, this.controllers.get(name)[func]);
            } else {
                await this._handleRequest(ctx, value);
            }
        }

        if (method === RequestMethod.GET) {
            this.router.get(path, async(req, res) => await callback(req, res));
        }
    }

    private async _handleRequest(ctx: Context, ctxFunction: ContextFunction) {
        // Run preprocessors.
        for (const preprocessor of this.preprocessors) {
            if (ctx.response.headersSent) {
                break;
            }
            
            preprocessor(ctx, null);
        }
        
        if (ctx.response.headersSent) {
            return;
        }
        
        // kekw
        // @ts-ignore
        let response = await ctxFunction(ctx);

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
