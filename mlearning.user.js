// ==UserScript==
// @name         浪潮大学自动刷视频 M—Learning
// @namespace    cn.shaojs.tampermonkey.mlearning
// @version      1.0.4
// @description  浪潮大学视频播放 文档浏览
// @author       shaojs
// @icon         https://picobd.yunxuetang.cn/sys/18653182312/images/202009/05d332081dbc4370b1dd7b184def21de.ico
// @match        *://edu.inspur.com/plan/*.html
// @match        *://edu.inspur.com/kng/plan/document/*
// @match        *://edu.inspur.com/kng/view/document/*
// @match        *://edu.inspur.com/kng/plan/video/*
// @match        *://edu.inspur.com/kng/view/video/*
// @match        *://edu.inspur.com/kng/view/package/*
// @match        *://edu.inspur.com/kng/plan/package/*
// @match        *://edu.inspur.com/mit/myhomeworkexprience*
// @match        *://edu.inspur.com/kng/course/package/video/*
// @match        *://edu.inspur.com/kng/course/package/document/*
// @match        *://edu.inspur.com/sty/index.htm
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      https://github.com/shaojs/tampermonkey
// @require      https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js
// ==/UserScript==

(function () {
    const path = window.location.pathname;
    const date = new Date();

    var host = window.location.protocol+"//" + window.location.host;

    var short_scan_seconds = 5;
    var long_scan_seconds = 10;

    if (path.match(/^\/sty.*/g)) {
        // 开始的任务页
        console.log('开始任务学习');
        // 如果有学习任务，就开始学习：查找立即参与的按钮并点击
        window.setTimeout(function(){
            var url = host +  $("div.pull-right.pt10:lt(1)").children("a:lt(1)").attr("href");
            console.log(url);
            window.open(url, '_self');
        }, short_scan_seconds * 1000);
        return false;
    } else if (path.match(/^\/plan.*/g)) { //任务列表页 mit/myhomeworkexprience
        console.log('任务列表页...');
 
        if ($(".hand > td").length == 0){
            console.log("本页所有任务已完成，返回上一页");
            window.location.href=document.referrer; // 返回上一级并刷新
        }

        let i = 0;
        $('.hand > td').each(function (index, item) {
            if ((index + 1) % 4 == 0) {
                const text = $(item).children('.text-grey').eq(1).text();
                console.log('任务' + (++i) + ', 播放进度:' + text);
                if (text.includes('%') && text !== '100%') {
                    console.log('点击这个未播放完成的');

                    window.setTimeout(function () {
                        const str = $(item).parent('.hand').attr('onclick') + '';
                        let arr = str.split("'");
                        console.info(arr[1]);
                        window.open(arr[1], '_self');
                    }, short_scan_seconds * 1000);
                    return false;
                }
            }
        });
    } else if (path.match(/^\/mit\/myhomeworkexprience.*/g)){
        // 学习中心，任务列表，点击所有的：立即学习
        console.log('任务列表页...');

        $("span.text-link.hand[data-localize='sys_btn_learnnow']:lt(1)").each(function(index, item){
            // str demo: StudyRowClick("/kng/view/video/743317dc35094ca9b028eb1d3df1ec88_d4853ac187124f669a97447ee3984342.html?uniqueid=637387129123048150", "VideoKnowledge", "", "True", "True", "True","")
            // 获取 /kng/view/video/743317dc35094ca9b028eb1d3df1ec88_d4853ac187124f669a97447ee3984342.html?uniqueid=637387129123048150
            window.setTimeout(function(){
                const str = $(item).attr("onclick") + "";
                const url = host + str.split(",")[0].split('"')[1]
                console.log(url);
                window.open(url, '_self');
            }, short_scan_seconds * 1000);
            return false;
        });
    } else if(path.match(/^\/kng\/view\/package.*/g)){
        console.log('任务列表页...');

        if ($("div.picstudying,div.picnostart.last").length == 0){
            console.log("本页所有任务已完成，返回上一页");
            window.location.href=document.referrer; // 返回上一级并刷新
        }

        $("div.picstudying,div.picnostart.last:lt(1)").each(function(index, item){ // 找到未播放的视频，进行播放
            // 定位到 url
            window.setTimeout(function(){
                const href = $(item).siblings("div.name.ellipsis:first").find("a.text-color6:first").attr("href") + "";
                const url = host + href.split(",")[0].split("'")[1]
                window.open(url, '_self');
            }, short_scan_seconds * 1000);
            return false;
        });
    }else if (path.match(/^\/kng\/plan\/document.*/g) || path.match(/^\/kng\/course\/package\/document.*/g) || path.match(/^\/kng\/view\/document.*/g)) {
        //文档页
        console.log('文档页准备就绪...');
        window.setInterval(function () {
            //检测在线
            detectionOnline();
            //防作弊
            checkMoreOpen();
            //完成度检测
            detectionComplete();
        }, long_scan_seconds * 1000);

    } else if (path.match(/^\/kng\/view\/video.*/g) || path.match(/^\/kng\/course\/package\/video.*/g) || path.match(/^\/kng\/plan\/video.*/g)) {
        //视频页
        console.log('视频页准备就绪...');
        //每30秒检测一次
        window.setInterval(function () {
            //检测在线
            detectionOnline();
            //防作弊
            checkMoreOpen();
            //完成度检测
            detectionComplete();
            //检测播放状态
            detectPlaybackStatus();
        }, long_scan_seconds * 1000);
    } else if (path.match(/^\/kng\/\w*\/package.*/g)) {
        // 3秒后点击开始学习按钮
        window.setTimeout(function () {
            $('#btnStartStudy').click(); // 可以直接点击
        }, short_scan_seconds * 1000)

    }

    //检测多开弹窗
    function checkMoreOpen() {
        console.debug('检测多开弹窗');
        if ($("#dvSingleTrack").length) {
            console.log("防止多开作弊 弹窗");
            StartCurStudy();
        }
    }

    //在线检测，检查看视频的人是否在线
    function detectionOnline() {
        const date = new Date();
        const dom = document.getElementById("dvWarningView");
        console.info(date.toLocaleString() + ' 检测是否有弹窗...');
        if (dom) {
            console.debug('弹窗出来了');
            const cont = dom.getElementsByClassName("playgooncontent")[0].innerText;
            if (cont.indexOf("请不要走开喔") != -1) {
                document.getElementsByClassName("btnok")[1].click();
            } else {
                //没遇到过这种情况 不能处理了 返回上一级
                console.error('没遇到过这种情况 不能处理了, 弹窗内容：' + cont);
                window.setTimeout(function () {
                    //刷新当前页吧
                    console.log("刷新当前页");
                    window.location.reload();
                }, short_scan_seconds * 1000)
            }
        }
    }

    //检测完成(进度100%)
    function detectionComplete() {
        const percentage = $('#ScheduleText').text();
        console.log('进度百分比: ' + percentage);
        if (percentage == '100%') {
            //返回上一级
            console.log("返回上一级");
            window.location.href=document.referrer; // 返回上一级并刷新
        }
    }

    //检测播放状态
    function detectPlaybackStatus() {
        const date = new Date();
        console.info(date.toLocaleString() + ' 检测播放状态...')
        if (myPlayer.getState() == 'playing') {
            console.log("播放中...啥也不操作了");
        } else if (myPlayer.getState() == 'paused') { //暂停
            console.log("暂停啦！！！");
            myPlayer.play();
            console.log("开始播放~");
        } else if (myPlayer.getState() == 'complete') {
            console.log($('#lblTitle').text() + "播放完成！！！");
            //返回上一级
            console.log("返回上一级");
            window.location.href=document.referrer; // 返回上一级并刷新
        }
    }
})();
