require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0',
        routes: {
            cors: { origin: ['*'] },
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    server.ext('onPreResponse', (request, h) => {
        const { response } = request;

        if (response instanceof InputError) {
            return h.response({
                status: 'fail',
                message: response.message,
            }).code(response.statusCode);
        }

        if (response.isBoom) {
            return h.response({
                status: 'fail',
                message: response.message,
            }).code(response.output.statusCode);
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
})();
