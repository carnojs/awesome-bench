import { Carno, Controller, Get, Post, Param, Query, Body } from '@carno.js/core';

@Controller()
class AppController {
    @Get('/health')
    health() {
        return new Response(null, { status: 200 });
    }

    @Get('/plaintext')
    plaintext() {
        return 'OK'
    }

    @Get('/json')
    json() {
        return Response.json({ message: "OK" });
    }

    @Post('/echo')
    echo(@Body() body: any) {
        return Response.json(body);
    }

    @Get('/search')
    search(@Query('q') q: string, @Query('limit') limit: string) {
        return Response.json({ query: q || "", limit: parseInt(limit || "0", 10) });
    }

    @Get('/user/:id')
    user(@Param('id') id: string) {
        return Response.json({ id });
    }
}

const app = new Carno();
app.controllers([AppController]);
app.listen(8080);
