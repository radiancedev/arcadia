import { Edge } from "edge.js";
import { join } from "path";
import type { Application } from "../Application";

export class ApplicationContext {
    public static SELF: ApplicationContext;
    
    private app: Application;
    public views: Edge;

    constructor(app: Application) {
        this.app = app;
        this.views = new Edge();

        // Attempt to load the views.
        this.views.mount(join(process.cwd(), app.options.viewFolder ?? "views"));

        ApplicationContext.SELF = this;
    }

    render(view: string, data?: object) {
        return this.app.options?.render?.(view, data);
    }
}