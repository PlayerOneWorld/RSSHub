const got = require('@/utils/got');
const cheerio = require('cheerio');
const rootUrl = 'https://cointelegraph.com';

const selectors = {
    item: '.main-page__posts article.post-card__article',
    title: (title) => title.find('.post-card__header span.post-card__title').text(),
    desc: (desc) => desc.find('.post-card__text-wrp p.post-card__text').text(),
    url: (url) => {
        const findUrl = url.find('.post-card__header a.post-card__title-link').attr('href');
        if (findUrl.includes('https://')) {
            return findUrl;
        } else {
            return rootUrl + findUrl;
        }
    },
    image: (image) => image.find('.lazy-image ').attr('src'),
    date: (date) => date.find('.post-card__footer time.post-card__date').attr('datetime'),
    author: (author) => author.find('.post-card__footer a.post-card__author-link').text(),
    slug: (slug) => slug.find('.post-card__figure .post-card__badge').text(),
};

module.exports = async (ctx) => {
    const pageResponse = await got({
        method: 'get',
        url: rootUrl,
    });

    const content = cheerio.load(pageResponse.data);

    const newsItems = [];

    content(selectors.item, pageResponse.data).each(function () {
        const title = selectors.title(content(this));
        const description = selectors.desc(content(this));
        const link = selectors.url(content(this));
        const image = selectors.image(content(this));
        const pubDate = selectors.date(content(this));
        const author = selectors.author(content(this));
        const slug = selectors.slug(content(this));

        newsItems.push({
            title,
            description,
            image,
            link,
            pubDate,
            author,
            slug,
        });
    });

    const newsList = newsItems.filter((item) => !item.slug.includes('News'));

    const items = await Promise.all(
        newsList.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detailResponse.data);

                content('.post-meta').remove();
                content('.post__title').remove();

                item.description = content('.post__article').html();

                return item;
            })
        )
    );

    if (items.length > 0) {
        ctx.state.data = {
            title: 'Cointelegraph Article',
            link: `${rootUrl}/`,
            item: items,
        };
    }
};
