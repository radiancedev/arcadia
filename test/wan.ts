
import { Application } from '../src/Application';
import { Route } from '../src/routes/Route';
import { Context } from '../src/structures/types/Context';

const app = new Application();
const route = new Route();

route.group("/hi", (route) => {
    route.preprocess(async(ctx) => {
        console.log("Hi :3");
    });

    route.get("/test", "TestController@test", "TestController@test2");

    route.view("/test2", "comedy");
});

app.handle(404, async(ctx) => {
    return {
        status: 404,
        message: "Not found!"
    }
});

app.register(route);
app.listen(4000);
