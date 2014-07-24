//进行
( function() {
    //初始化参数
    var head = document.head || document.getElementsByTagName('head')[0];
    var keyPrex = 'ucMaxCms-';
    var jsName={path:"/app/js/pageJson.js",keyName:keyPrex+"js",ver:"0.0.3"}
    var cssName={path:"/app/css/styleJson.css",keyName:keyPrex+"css",ver:"0.0.3"}
    //存取方法
    var GS={
        set:function (key, val) {
            this.key = key;
            this.val = val;
            if (window.ucweb) {//如果支持UC的全局存储
                ucweb.startRequest("globalStorage.setItem", [this.key, this.val]);
            }

            else { //如果不支持UC的全局存储
                localStorage.setItem(this.key, this.val);
            }
        },
        get:function (key) {
            this.key = key;
            if (window.ucweb) {//如果支持UC的全局存储
                return ucweb.startRequest("globalStorage.getItem", [this.key])
            }

            else { //如果不支持UC的全局存储
                return localStorage.getItem(this.key)
            }
        }
    }
    //判断本地是否存在缓存
    var loadfile=function(cacheName){
        var cacheStr=GS.get(cacheName.keyName)
        try
        {
            var cacheObj=JSON.parse(cacheStr);
        }
        catch(err)   //如果取出的格式无法序列化，则判断为不存在缓存
        {
            cacheStr="";
        }
        if (cacheStr==null || cacheStr==""){ //如果不存在，则先行注入脚本路径到HEAD，再远程加载

            if (cacheName.keyName.indexOf("css")>0){  //如果是需要更新CSS
                document.addEventListener('DOMContentLoaded', function () {
                    showLoad();
                }, false);
            }
            getJSONfile(cacheName)

        } else{  //如果存在，则判断是否需要更新
            if (cacheName.ver!=cacheObj.ver)  { //如果版本不一致，则需要更新
                //getUrl(cacheName);
                if (cacheName.keyName.indexOf("css")>0){  //如果是需要更新CSS
                    document.addEventListener('DOMContentLoaded', function () {  //为了让升级时候的加载动画留存更长时间，在动画加载完毕后，再进行CSS的升级
                        showLoad();
                        getJSONfile(cacheName)
                    }, false);

                } else{
                    getJSONfile(cacheName)
                }


            }else{ //版本一致，直接加载
                addLocal(cacheName.keyName,cacheObj.str)
            }


        }
    }
    //加载本地资源
    var addLocal=function(keyName,thisStr){
        if (keyName.indexOf("js")>0){ //如果是JS类型
            injectScript(thisStr)
        }    else if (keyName.indexOf("css")>0){
            injectCss(thisStr)
            //删除页面上的动画容器
            if (document.getElementById("ucload")){
                document.body.removeChild(document.getElementById("ucload"))
                document.body.removeChild(document.getElementsByClassName("_ucbbsContainer")[0].querySelectorAll("div")[0])
            }
        }
    }

    /*! 加载外部资源 AJAX
     var getUrl = function(cacheName ) {
     alert("开始加载")
     var xhr = new XMLHttpRequest();
     xhr.open( 'GET', cacheName.path );
     xhr.onreadystatechange = function() {
     if ( xhr.readyState === 4 ) {
     alert("载入中"+xhr.status)
     if( xhr.status === 200 ) {  //如加载成功，则将其保存进入本地存储
     // alert("成功")
     var cacheObj={str:xhr.responseText,ver:cacheName.ver}
     GS.set(cacheName.keyName,JSON.stringify(cacheObj));
     //随后加载
     addLocal(cacheName.keyName,xhr.responseText);
     } else {   //如果加载失败,则尝试直接注入JS与CSS地址


     }
     }
     };

     alert("开始发送")
     xhr.send()
     }
     */
    /*! 加载外部资源 iframe
     var getFile=function(cacheName){
     iframeReq = document.createElement('iframe');
     iframeReq.style.display = 'none';
     iframeReq.onload = function(){

     var cacheObj={str:iframeReq.contentDocument.body.textContent,ver:cacheName.ver}
     GS.set(cacheName.keyName,JSON.stringify(cacheObj));
     //随后加载
     addLocal(cacheName.keyName,iframeReq.contentDocument.body.textContent);
     }
     document.body.appendChild(iframeReq);
     iframeReq.src = cacheName.path;

     }
     */
    //JSON方式加载
    var getJSONfile=function(cacheName){
        scriptReq = document.createElement('script');
        scriptReq.type = "text/javascript";
        scriptReq.onload = function(){  //JS加载成功后
            //alert("加载成功"+scriptReq.src)
            if  (cacheName.keyName.indexOf("js")>0){  //加载了JS
                var cacheObj={str:jsFile.str,ver:cacheName.ver}
                GS.set(cacheName.keyName,JSON.stringify(cacheObj));
                //随后加载
                addLocal(cacheName.keyName,jsFile.str);
                //自定义事件
                var evt = document.createEvent('Event');
                evt.initEvent('storgeSaved',false,false);
                document.dispatchEvent(evt);

            }
            /*   暂时去除动画提示
            else if(cacheName.keyName.indexOf("gif")>0){
                //图片BASE64字符
                var cacheObj={str:gifFile.str,ver:cacheName.ver}
                GS.set(cacheName.keyName,JSON.stringify(cacheObj));
            } */
            else{
                var cacheObj={str:cssFile.str,ver:cacheName.ver}
                GS.set(cacheName.keyName,JSON.stringify(cacheObj));
                //随后加载
                addLocal(cacheName.keyName,cssFile.str);
            }

        };

        scriptReq.onerror=function(){ //JS加载失败后，直接从本地加载数据
            addLocal(cacheName.keyName,JSON.parse(GS.get(cacheName.keyName)).str);
        }
        scriptReq.src = cacheName.path+"?t="+(new Date()).getTime();
        //alert("开始加载")
        head.appendChild(scriptReq);


    }

    //注入脚本文件
    var injectScript = function( Text ) {
        var script = document.createElement('script');
        script.text = Text;
        script.charset="utf-8";
        script.type="text/javascript"
        head.appendChild( script );
    };
    var injectCss = function( Text ) {
        var css = document.createElement('style');
        css.type = 'text/css';
        css.innerHTML=Text
        css.charset='utf-8'
        head.appendChild(css);

    };
    //
    //首次启动动画
    var showLoad=function(){

        var loadStr="<style type=\"text/css\">#ucload{position: absolute;height:100%;width:100%;background: #fff;top: 0;left: 0;z-index: 99999;}.loading {margin-top:-25px;width:100%;min-height:50px;text-align:center;position:absolute;left:0;top:48%;}.loading span {display:inline-block;margin-right:5px;width:10px;height:10px;overflow:hidden;background:#2a8ae0; -webkit-animation:ani_loading 0.5s linear infinite;}.loading .txt {margin-top:5px;font-size:14px;color:#ccc;}@-webkit-keyframes ani_loading {from {opacity: 1;}to {opacity: 0.1;}}.loading .s1 {-webkit-animation-delay: 0s;}.loading .s2 {-webkit-animation-delay: 0.1s;}.loading .s3 {-webkit-animation-delay: 0.2s;}.loading .s4 {-webkit-animation-delay: 0.3s;}.loading .s5 {-webkit-animation-delay: 0.4s;}.loading_img{text-align: center;font-size: 18px;color: #666;}.loading_img img{display: block;margin: 0 auto;margin-bottom: 30px;.margin-bottom: 3;margin-top: 20%;}</style>";
        loadStr=loadStr+"<div class=\"loading\"><span class=\"s1\"></span><span class=\"s2\"></span><span class=\"s3\"></span><span class=\"s4\"></span><span class=\"s5\"></span><div class=\"txt\">数据正在努力加载中</div></div>";
        var loadDiv=document.createElement('div');
        loadDiv.id="ucload";
        loadDiv.innerHTML=loadStr;
        document.body.appendChild(loadDiv)

    }

    //加载前端资源
    loadfile(cssName)
    loadfile(jsName)
    //loadfile(imgName)


} () );