module.exports = function (router) {
    router.get('/cointelegraph-news', require('./news'));
};
