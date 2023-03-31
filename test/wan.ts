
import { Application } from '../src/Application';
import { Route } from '../src/routes/Route';

const app = new Application();
const route = new Route();

route.group("/hi", (route) => {
    route.preprocess(async(ctx) => {
        console.log("Hi :3");
    });

    route.get("/test", "TestController@test");
    route.view("/test2", "comedy");
})

app.register(route);
app.listen(3000);
