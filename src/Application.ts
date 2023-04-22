import express from "express";
import expressWs from "express-ws";
import type { Express } from "express";
import { Route } from "./routes/Route";
import { ApplicationContext } from "./structures/ApplicationContext";
import multer from "multer";

export interface ApplicationOptions {
    viewFolder?: string;
}

/**
 * An advanced webserver build over ExpressJS.
 */
export class Application {
    private app: expressWs.Application;
    public static SELF: Application;
    public options: ApplicationOptions;

    constructor(options?: ApplicationOptions) {
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

    public listen(port: number) {
        this.app.listen(port);
    }
}
