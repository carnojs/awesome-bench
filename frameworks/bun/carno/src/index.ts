import { Carno, Controller, Get } from '@carno.js/core';

@Controller()
class AppController {
    @Get('/health')
    health() {
        return;
    }

    @Get('/plaintext')
    plaintext() {
        return 'OK'
    }

    @Get('/json')
    json() {
        return Response.json({ message: "OK" });
    }
}

const app = new Carno();
app.controllers([AppController]);
app.listen(8080);
