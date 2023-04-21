module.exports = function (router) {
    router.get('/news', require('./news'));
    router.get('/article', require('./article'));
};
