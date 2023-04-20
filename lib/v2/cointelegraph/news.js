const got = require('@/utils/got');
const cheerio = require('cheerio');
const rootUrl = 'https://conpletus.cointelegraph.com';
// const apiVersion = 'v1';

module.exports = async (ctx) => {
    const limit = isNaN(parseInt(ctx.query.limit)) ? 30 : parseInt(ctx.query.limit);

    const jsonData = await fetch('https://conpletus.cointelegraph.com/v1/', {
        headers: {
            accept: 'application/graphql+json, application/json',
            'accept-language': 'zh-CN,zh;q=0.9',
            baggage: '',
            'content-type': 'application/json',
            'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'sentry-trace': '',
            Referer: 'https://cointelegraph.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body:
            '{"query":"query MainPagePostsQuery($short: String, $offset: Int!, $length: Int!, $place: String = \\n\\"index\\") {\\n  locale(short: $short) {\\n    posts(\\n      order: \\n\\"postPublishedTime\\"\\n      offset: $offset\\n      length: $length\\n      place: $place\\n    ) {\\n      data {\\n        cacheKey\\n        id\\n        slug\\n        postTranslate {\\n          cacheKey\\n          id\\n          title\\n          avatar\\n          published\\n          publishedHumanFormat\\n          leadText\\n          author {\\n            cacheKey\\n            id\\n            slug\\n            innovationCircleUrl\\n            authorTranslates {\\n              cacheKey\\n              id\\n              name\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        category {\\n          cacheKey\\n          id\\n          slug\\n          categoryTranslates {\\n            cacheKey\\n            id\\n            title\\n            __typename\\n          }\\n          __typename\\n        }\\n        author {\\n          cacheKey\\n          id\\n          slug\\n          authorTranslates {\\n            cacheKey\\n            id\\n            name\\n            __typename\\n          }\\n          __typename\\n        }\\n        postBadge {\\n          cacheKey\\n          id\\n          label\\n          postBadgeTranslates {\\n            cacheKey\\n            id\\n            title\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      postsCount\\n      hasMorePosts\\n      __typename\\n    }\\n    __typename\\n  }\\n}","operationName":"MainPagePostsQuery","variables":{"offset":0,"length":' +
            limit +
            ',"short":"en","cacheTimeInMS":1000}}',
        method: 'POST',
    });

    const allData = await jsonData.json().then((res) => res.data.locale.posts.data);

    const filterList = allData
        .filter((item) => item.category.slug.includes('news'))
        .map((item) => ({
            title: item.postTranslate.title,
            link: `https://cointelegraph.com/news/${item.slug}`,
            description: item.postTranslate.leadText,
            pubDate: item.published,
        }));

    const items = await Promise.all(
        filterList.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detailResponse.data);

                content('.post-meta').remove();
                content('.post__title').remove();

                item.description = content('.post__article').html();

                // item.author

                return item;
            })
        )
    );

    ctx.state.data = {
        title: 'Cointelegraph News',
        link: `${rootUrl}/`,
        item: items,
    };
};
