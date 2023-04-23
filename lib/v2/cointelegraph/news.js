const got = require('@/utils/got');
const cheerio = require('cheerio');
const rootUrl = 'https://cointelegraph.com';
// const rootApiUrl = 'https://conpletus.cointelegraph.com';
// const apiVersion = 'v1';

const selectors = {
    item: '.main-page__posts article.post-card__article',
    title: (title) => title.find('.post-card__header span.post-card__title').text(),
    desc: (desc) => desc.find('.post-card__text-wrp p.post-card__text').text(),
    url: (url) => rootUrl + url.find('.post-card__header a.post-card__title-link').attr('href'),
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

    const newsList = newsItems.filter((item) => item.slug.includes('News'));

    const items = await Promise.all(
        newsList.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detailResponse.data);
                
                content('.post-actions.post__block.post__block_post-actions').remove();
                content('.post-cover.post__block').remove();
                content('.mint_nft.mint_nft__button.post__block_nft').remove();
                content('.post-meta').remove();
                content('.post__socials-block.post-socials_EpBtt').remove();
                content('.post__content-shares').remove();
                content('.post__title').remove();
                content('.tags-list.post__block.post__block_tags').remove();
                content('.reactions_3eiuR').remove();

                item.description = content('.post__article').html();

                return item;
            })
        )
    );

    if (items.length > 0) {
        ctx.state.data = {
            title: 'Cointelegraph News',
            link: `${rootUrl}/`,
            item: items,
        };
    }

    // const jsonData = await fetch('https://conpletus.cointelegraph.com/v1/', {
    //     headers: {
    //         accept: 'application/graphql+json, application/json',
    //         'accept-language': 'zh-CN,zh;q=0.9',
    //         baggage: '',
    //         'content-type': 'application/json',
    //         'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
    //         'sec-ch-ua-mobile': '?0',
    //         'sec-ch-ua-platform': '"macOS"',
    //         'sec-fetch-dest': 'empty',
    //         'sec-fetch-mode': 'cors',
    //         'sec-fetch-site': 'same-site',
    //         'sentry-trace': '',
    //         Referer: 'https://cointelegraph.com/',
    //         'Referrer-Policy': 'strict-origin-when-cross-origin',
    //     },
    //     body:
    //         '{"query":"query MainPagePostsQuery($short: String, $offset: Int!, $length: Int!, $place: String = \\n\\"index\\") {\\n  locale(short: $short) {\\n    posts(\\n      order: \\n\\"postPublishedTime\\"\\n      offset: $offset\\n      length: $length\\n      place: $place\\n    ) {\\n      data {\\n        cacheKey\\n        id\\n        slug\\n        postTranslate {\\n          cacheKey\\n          id\\n          title\\n          avatar\\n          published\\n          publishedHumanFormat\\n          leadText\\n          author {\\n            cacheKey\\n            id\\n            slug\\n            innovationCircleUrl\\n            authorTranslates {\\n              cacheKey\\n              id\\n              name\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        category {\\n          cacheKey\\n          id\\n          slug\\n          categoryTranslates {\\n            cacheKey\\n            id\\n            title\\n            __typename\\n          }\\n          __typename\\n        }\\n        author {\\n          cacheKey\\n          id\\n          slug\\n          authorTranslates {\\n            cacheKey\\n            id\\n            name\\n            __typename\\n          }\\n          __typename\\n        }\\n        postBadge {\\n          cacheKey\\n          id\\n          label\\n          postBadgeTranslates {\\n            cacheKey\\n            id\\n            title\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      postsCount\\n      hasMorePosts\\n      __typename\\n    }\\n    __typename\\n  }\\n}","operationName":"MainPagePostsQuery","variables":{"offset":0,"length":' +
    //         30 +
    //         ',"short":"en","cacheTimeInMS":1000}}',
    //     method: 'POST',
    // });

    // const allData = await jsonData.json().then((res) => res.data.locale.posts.data);

    // const filterList = allData
    //     .filter((item) => item.category.slug.includes('news'))
    //     .map((item) => ({
    //         title: item.postTranslate.title,
    //         link: `https://cointelegraph.com/news/${item.slug}`,
    //         description: item.postTranslate.leadText,
    //         pubDate: item.published,
    //     }));

    // const items = await Promise.all(
    //     filterList.map((item) =>
    //         ctx.cache.tryGet(item.link, async () => {
    //             const detailResponse = await got({
    //                 method: 'get',
    //                 url: item.link,
    //             });
    //             const content = cheerio.load(detailResponse.data);

    //             content('.post-meta').remove();
    //             content('.post__title').remove();

    //             item.description = content('.post__article').html();

    //             // item.author

    //             return item;
    //         })
    //     )
    // );

    // ctx.state.data = {
    //     title: 'Cointelegraph News',
    //     link: `${rootUrl}/`,
    //     item: items,
    // };
};
