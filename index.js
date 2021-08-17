const puppeteer = require('puppeteer');
const fs = require("fs");
//健康九九網站
//const url='https://health99.hpa.gov.tw/search?page=9&data[keyword]=肥胖&data[startDate]=1970-01-01&data[endDate]=2020-12-22&data[tab]=0';
const url='https://health99.hpa.gov.tw/search?page=';
const filter='&data%5Bkeyword%5D=%E8%82%A5%E8%83%96&data%5BstartDate%5D=1970-01-01&data%5BendDate%5D=2021-01-28&data%5Btab%5D=0';

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    let currentPage = 1;
    let stop = false;
   
    let results = [];

    try {

     while(!stop)
     {
        //紀錄處理到哪一頁
        console.log(currentPage);

        await page.goto(url+currentPage.toString()+filter); 
        //第一次執行 處理跳出視窗
        if (currentPage==1)
        {
            //close modal dailog
            const MODAL_BUTTON_SELECTOR = '.modal-dialog .modal-header > button';
            await page.click(MODAL_BUTTON_SELECTOR);
            await page.waitForTimeout(500);
            //執行查詢動作
            await page.click('input[id="keyword"]');
            //await page.keyboard.type('肥胖');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
        }
       //先等待網頁載入到底下的section的html標籤，不然有時候執行太快抓不到網頁   
       await page.waitForSelector('section');
       let data= await page.evaluate(()=>{
              var list= [];
              const items=document.querySelectorAll("a.news_list");
              items.forEach((item) => {
                 var dtObject = {};
                  dtObject.url=item.getAttribute('href');
                  const content=item.querySelectorAll('div');             
                  dtObject.cat = content[1].textContent;
                  dtObject.date = content[2].textContent;
                  dtObject.title = content[3].querySelector("h4").innerText;
                  dtObject.author = content[4].textContent;
        
                list.push(dtObject);
               
            });
            return list;

          });
          //資料放入陣列
          Array.prototype.push.apply(results, data);
         //取得頁數
          let lastpage= await page.evaluate(()=>{
           const nav=document.querySelectorAll("nav ul.pagination li a");
            
            var count = nav.length - 2;
            var text=nav[count].textContent;
           return text;//document.body.innerHTML;
          });
       
        if(currentPage<lastpage)
        {
            currentPage++;
        }
        else
        {
            stop=true;
        }
        
     }

     console.log(results);
    // 寫入 result.json 檔案
    fs.writeFileSync("result.json", JSON.stringify(results));
       
    }
    catch (ex) {
        console.log(ex);
    }
   
})();