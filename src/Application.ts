import http from "http";
import express from "express";
import expressWs from "express-ws";
import { ContextFunction, Route } from "./routes/Route";
import { ApplicationContext } from "./structures/ApplicationContext";
import multer from "multer";
import { EventEmitter } from "events";
import { Context } from "./structures/types/Context";

export interface ApplicationOptions {
    viewFolder?: string;
    render?: (view: string, data?: object) => Promise<string>;
}

/**
 * An advanced webserver build over ExpressJS.
 */
export class Application extends EventEmitter {
    private app: expressWs.Application;
    public static SELF: Application;
    public options: ApplicationOptions;
    public statusHandlers: Map<number, ContextFunction>;

    constructor(options?: ApplicationOptions) {
        super();

        const app = express();
        expressWs(app);

        // body-parser
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(multer().any());

        this.app = app as unknown as expressWs.Application;

        this.options = options ?? {};
        this.statusHandlers = new Map();

        Application.SELF = this;
    }

    get express() {
        return this.app;
    }

    get context() {
        if (ApplicationContext.SELF != null) {
            return ApplicationContext.SELF;
        } else {
            return new ApplicationContext(this);
        }
    }

    public register(routes: Route) {
        const router = routes.build();

        for (let [path, callback] of routes.websockets) {
            this.app.ws(path, callback);
        }

        this.app.use(routes.path, router);
    }

    public render(view: string, state: any) {
        return this.context.render(view, state);
    }
    
    listen(port: number, hostname: string, backlog: number, callback?: () => void): http.Server
    listen(port: number, callback?: () => void): http.Server
    listen(callback?: () => void): http.Server
    listen(handle: any, listeningListener?: () => void): http.Server
    listen(path: string, callback?: () => void): http.Server
    listen(port: number, hostname: string, callback?: () => void): http.Server
    listen(...args: any[]): http.Server {
        // register default handlers
        this.app.use(async (req, res, next) => {
            if (res.headersSent) {
                return;
            }
            
            let ctx = new Context(req, res);

            // send a 404 if the route doesn't exist.
            let handler = Application.SELF.statusHandlers.get(404);
            let response = handler ? await handler(ctx) : "Not Found";

            ctx.status(404).response.json(response);
        });


        return this.app.listen(...args)
    }

    throwError(ctx: Context, error: Error) {
        this.emit("error", ctx, error);
    }

    handle(status: number, ctxFunction: ContextFunction) {
        this.statusHandlers.set(status, ctxFunction);
    }
}
