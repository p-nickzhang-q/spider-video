/* 方法集 */
const config = require('./cofig'),
  fs = require('fs'),
  axios = require('axios'),
  http = require('http'),
  https = require('https'),
  puppeteer = require('puppeteer'),
  cheerio = require('cheerio');

module.exports = {
  // 新建保存视频的文件夹
  mkdirSaveFolder(savePath) {
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath)
      console.log(`文件夹已生成：${savePath}`)
    } else {
      console.log(`文件夹已存在：${savePath}`)
    }
    // 生成保存截图的文件夹
    if (!fs.existsSync('./screenshot')) {
      fs.mkdirSync('./screenshot')
    }
  },
  // 获取西瓜视频所在页面的地址 list
  // name：头条号名称
  // offset: 0：第一页数据，20：第二页数据，依次类推
  async getVideoPageList(name, pageNo = 1) {
    const headers = {
      Referer: `http://video.kepuchina.cn/search/search.php?keyword=&type=%E8%88%AA%E7%A9%BA%E8%88%AA%E5%A4%A9&s_5=0&s_1=0&s_6=1&s_0=0&s_8=0&`
      // Referer: `https://www.ixigua.com/search/?keyword=${encodeURI(name)}`,
      // "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36",
      // cookie: "t_webid=6601999464352253444; WEATHER_CITY=%E5%8C%97%E4%BA%AC; UM_distinctid=165e525dafb1d9-0baaa42bbf8325-551e3f12-1fa400-165e525dafcb2a; __tasessionId=mnw1y8gjn1537147788480; tt_webid=6601999464352253444; csrftoken=c7f2776bbd139000288ce7cf6644df4b; CNZZDATA1259612802=1709968793-1537143142-https%253A%252F%252Fwww.baidu.com%252F%7C1537148542",
      // "authority": "www.ixigua.com",
      // "scheme": "https"
    }
    const result = await axios({
      method: 'get',
      url: `${config.originPath}?type=${encodeURI(name)}&page=${pageNo}`,
      // headers
    })
    const $ = cheerio.load(result.data)
    const list = $('.list_img li').toArray();
    const pageUrlList = []
    list.forEach(i => {
      pageUrlList.push({
        pathname: i.childNodes[1].attribs.href,
        title: i.childNodes[1].childNodes[5].childNodes[0].data
      })
    })
    // // 过滤，只获取包含视频的页面 url
    // data.forEach(item => {
    //   if (item.has_video) {
    //     pageUrlList.push({
    //       pathname: item.seo_url,
    //       title: item.title
    //     })
    //   }
    // })
    return pageUrlList
  },
  // 根据页面地址获取页面内的视频地址
  async getVideoSrc(pathname) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log('visit site:', `${pathname}`)
    await page.goto(`${pathname}`);
    await page.waitFor(5000); // 留给页面充分的加载时间
    let shotPicName = pathname.replace(/\//g, '') // 移除两头'/'
    await page.screenshot({ path: `screenshot/${shotPicName}.png` });
    await page.content()
    // 获取视频地址
    try {
      let src = await page.$eval('#hv_player', ele => ele.src)
      return src
    } catch (e) {
      console.log('异常图片截图：', `${shotPicName}.png`)
      console.log('e', e)
    }
    // await browser.close()
    return ''
  },
  // 获取视频数据
  getVideoData(url, encoding) {
    return new Promise((resolve, reject) => {
      let req = http.get(url, function (res) {
        let result = ''
        encoding && res.setEncoding(encoding)
        res.on('data', function (d) {
          result += d
        })
        res.on('end', function () {
          resolve(result)
        })
        res.on('error', function (e) {
          reject(e)
        })
      })
      req.end()
    })
  },
  // 下载视频到本地
  savefileToPath(fileFolder, fileName, fileData) {
    let fileFullName = `${fileFolder}/${fileName}.mp4`
    return new Promise((resolve, reject) => {
      fs.writeFile(fileFullName, fileData, 'binary', function (err) {
        if (err) {
          console.log('savefileToPath error:', err)
        }
        resolve('已下载')
      })
    })
  }
}
