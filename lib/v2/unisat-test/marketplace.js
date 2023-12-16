const querystring = require('querystring');

const rootUrl = 'https://unisat.io/inscription/';

module.exports = async (ctx) => {
    const browser = await require('@/utils/puppeteer')();

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    const item = [];
    page.on('request', (request) => {
        item.push(request.url());
    });

    const parsedQuery = querystring.parse(ctx.request.href.split('?')[1]);

    await page.goto(rootUrl + parsedQuery.inscription_id, {
        waitUntil: 'domcontentloaded',
    });

    await page.close();

    ctx.state.data = {
        title: 'brc20 marketplace',
        link: String(rootUrl),
        item: item.map((v) => ({
            title: v,
            link: 'sdfsd',
            description: v,
        })),
    };
};
