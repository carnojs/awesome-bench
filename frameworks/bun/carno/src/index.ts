import { Carno, Controller, Get } from '@carno.js/core';

@Controller()
class AppController {
    @Get('/health')
    health() {
        return new Response(null, { status: 200 });
    }

    @Get('/plaintext')
    plaintext() {
        return new Response("OK", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }

    @Get('/json')
    json() {
        return Response.json({ message: "OK" });
    }
}

const app = new Carno();
app.controllers([AppController]);
app.listen(8080);
console.log('Server running on port 8080');
