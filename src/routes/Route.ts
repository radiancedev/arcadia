import { Router } from "express";
import { glob } from "glob";
import { Controller } from "../structures/Controller";
import { Context } from "../structures/types/Context";

type ContextFunction = (ctx: Context) => Promise<any>;
type ProcessorFunction = (ctx: Context, data?: any) => Promise<any>;

export class Route {
    private paths: Map<string, Route>;
    private router: Router;
    public path: string;
    public controllers: Map<string, Controller>;
    public preprocessors: ProcessorFunction[];
    public postprocessors: ProcessorFunction[];   
    
    constructor(path?: string) {
        this.paths = new Map();
        this.path = path ?? "/";
        this.router = Router();
        this.controllers = new Map();
        this.preprocessors = [];
        this.postprocessors = [];
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

    preprocess(callback: ContextFunction) {
        this.preprocessors.push(callback);

        return this;
    }

    postprocess(callback: ContextFunction) {
        this.postprocessors.push(callback);

        return this;
    }

    get(path: string, value: string | ContextFunction) {
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

                            this.router.get(path, async(req, res) => {
                                const ctx = new Context(req, res);
                                // @ts-ignore
                                await this._handleRequest(ctx, this.controllers.get(name)[method]);
                            })
                        }
                    })
                })
                
            } catch {}
        } else if (typeof value === "function") {
            this.router.get(path, async(req, res) => {
                const ctx = new Context(req, res);
                await this._handleRequest(ctx, value);
            })
        }

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