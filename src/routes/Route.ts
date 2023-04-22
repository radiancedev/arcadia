import { Router } from "express";
import { WebsocketRequestHandler } from "express-ws";
import { glob } from "glob";
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

    route(path: string, method: RequestMethod, value: string | ContextFunction) {
        const routeFunc = this.router[method];

        if (typeof value === "string") {
            // Try to import the controller.
            let data = value.split("@");
            let name = data[0];
            let method = value.includes("@") ? data[1] : "index";

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

                            routeFunc(path, async(req, res) => {
                                const ctx = new Context(req, res);
                                // @ts-ignore
                                await this._handleRequest(ctx, this.controllers.get(name)[method]);
                            })
                        }
                    })
                })
                
            } catch {}
        } else if (typeof value === "function") {
            routeFunc(path, async(req, res) => {
                const ctx = new Context(req, res);
                await this._handleRequest(ctx, value);
            })
        }

        return this;
    }

    get(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.GET, value);
    }

    post(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.POST, value);
    }

    put(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.PUT, value);
    }

    delete(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.DELETE, value);
    }

    patch(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.PATCH, value);
    }

    options(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.OPTIONS, value);
    }

    head(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.HEAD, value);
    }

    all(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.ALL, value);
    }

    any(path: string, value: string | ContextFunction) {
        return this.route(path, RequestMethod.ALL, value);
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
