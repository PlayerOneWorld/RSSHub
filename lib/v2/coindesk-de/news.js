const got = require('@/utils/got');
const cheerio = require('cheerio');
const rootUrl = 'https://www.coindesk.com/arc/outboundfeeds/rss/';

const selectors = {
    item: 'item',
    title: (title) => title.find('title').text(),
    desc: (desc) => desc.find('description').text(),
    url: (url) => url.find('link').text(),
    date: (date) => date.find('pubDate').text(),
    tag: (tag) => tag.find('category').first().text(),
};

module.exports = async (ctx) => {
    const pageResponse = await got({
        method: 'get',
        url: rootUrl,
    });

    const content = cheerio.load(pageResponse.data, { xml: true });

    const newsItems = [];

    content(selectors.item).each(function () {
        const title = selectors.title(content(this));
        const description = selectors.desc(content(this));
        const link = selectors.url(content(this));
        const pubDate = selectors.date(content(this));
        const tag = selectors.tag(content(this));

        newsItems.push({
            title,
            description,
            link,
            pubDate,
            tag,
        });
    });

    // 标注 "Market"| Finance | policy | Techonlogy | web3| 均可以加工成快讯
    // Markets Finance Policy Technology Web3
    const filterTags = ['Markets', 'Finance', 'Policy', 'Technology', 'Web3'];
    const newsList = newsItems.filter((item) => filterTags.some((tag) => item.tag.includes(tag)));

    const items = await Promise.all(
        newsList.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detailResponse.data);

                // content('.at-category').remove();
                // content('.at-headline').remove();
                // content('.at-subheadline').remove();
                // content('.typography__StyledTypography-owin6q-0').remove();
                // content('.display-desktop-none.display-tablet-block.display-mobile-block').remove();
                item.author = content('.at-authors span:first-child a').text();
                
                item.description = content('.main-body-grid.false div[data-submodule-name="composer-content"]').html();

                return item;
            })
        )
    );

    if (items.length > 0) {
        ctx.state.data = {
            title: 'Coindesk News',
            link: `${rootUrl}/`,
            item: items,
        };
    }
};
