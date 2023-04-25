import http from "http";
import express from "express";
import expressWs from "express-ws";
import { Route } from "./routes/Route";
import { ApplicationContext } from "./structures/ApplicationContext";
import multer from "multer";
import { EventEmitter } from "events";
import { Context } from "./structures/types/Context";

export interface ApplicationOptions {
    viewFolder?: string;
}

/**
 * An advanced webserver build over ExpressJS.
 */
export class Application extends EventEmitter {
    private app: expressWs.Application;
    public static SELF: Application;
    public options: ApplicationOptions;

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
    
    listen(port: number, hostname: string, backlog: number, callback?: () => void): http.Server
    listen(port: number, callback?: () => void): http.Server
    listen(callback?: () => void): http.Server
    listen(handle: any, listeningListener?: () => void): http.Server
    listen(path: string, callback?: () => void): http.Server
    listen(port: number, hostname: string, callback?: () => void): http.Server
    listen(...args: any[]): http.Server {
        return this.app.listen(...args)
    }

    throwError(ctx: Context, error: Error) {
        this.emit("error", ctx, error);
    }
}
