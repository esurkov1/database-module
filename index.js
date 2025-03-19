const express = require('express');
const cookieParser = require('cookie-parser');

const errorHandler = (error, req, res) => res.status(500).json({ error: error.message });
const notFoundHandler = (req, res) => res.status(404).json({ error: "Module not found", path: req.path });

// Функция для поднятия сервера с динамическим роутером
function server({ port, prefix = '/api', middleware = [], routes }) {

    const app = express();

    app.use(express.json()); // Middleware для парсинга JSON тел запросов
    app.use(cookieParser()); // Middleware для парсинга cookies

    function parseRoutes(obj, path = '') {
        for (const key in obj) {

            const method = (obj[key].method && ['get', 'post', 'put', 'delete'].includes(obj[key].method.toLowerCase())) ? obj[key].method.toLowerCase() : 'post';

            let newPath = path ? `${path}/${key}` : key;

            if (obj[key].handler) {
                newPath = prefix + '/' + newPath;
                app[method](newPath, ...middleware, obj[key].handler);

            } else if (typeof obj[key] === 'object') {
                parseRoutes(obj[key], newPath);
            }
        }
    }

    parseRoutes(routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(port, () => console.log(`${prefix} is running on port ${port}`));

    return app;
}

module.exports = server;