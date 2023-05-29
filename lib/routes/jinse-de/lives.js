const got = require('@/utils/got');

module.exports = async (ctx) => {
    // const liveUrl = `https://api.jinse.com/v4/live/list?limit=20`;

    const liveUrl = `https://api.jinse.cn/noah/v2/lives?limit=20&reading=false&source=web&flag=down&id=0&category=0`;
    
    const response = await got({
        method: 'get',
        url: liveUrl,
    });

    ctx.state.data = {
        title: '金色财经 - 快讯',
        link: liveUrl,
        item: response.data.list[0].lives.map((item) => ({
            title: item.content_prefix,
            link: `https://www.jinse.com/lives/${item.id}`,
            description: item.content + (item.link ? `<br><a href="${item.link}" target="_blank">${item.link_name}</a>` : ''),
            pubDate: new Date(`${new Date(response.data.list[0].date).toLocaleString().substr(0, 10)} ${new Date(item.created_at).toLocaleString().substr(-8, 8)}`).toUTCString(),
        })),
    };
};
