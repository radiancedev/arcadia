import express from "express";
import type { Express } from "express";
import { Route } from "./routes/Route";
import { ApplicationContext } from "./structures/ApplicationContext";

export interface ApplicationOptions {
    viewFolder?: string;
}

/**
 * An advanced webserver build over ExpressJS.
 */
export class Application {
    private app: Express;
    public static SELF: Application;
    public options: ApplicationOptions;

    constructor(options?: ApplicationOptions) {
        this.app = express();

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

        this.app.use(routes.path, router);
    }

    public listen(port: number) {
        this.app.listen(port);
    }
}
