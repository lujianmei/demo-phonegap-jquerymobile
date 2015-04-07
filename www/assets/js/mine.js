

function inithomepage(){
    //初使化banner图 -- 先取缓存，再重新下载新图片
    var mainbanner_storage = getCache("mainbanner");

    alert(mainbanner_storage);
    if(mainbanner_storage!=null){
        alert("have mainbanner");
        $('#js_flexslider>ul').html("");
        $('#js_flexslider>ul').html(mainbanner_storage);
        alert("before settimeout finished:"+$('#js_flexslider>ul').html());
        //重新再加载新的banner图片
       // setTimeout(flexslider_datainit(null,false), 5000);

        alert("all finished:"+$('#js_flexslider>ul').html());

    }else{
        alert("do not have mainbanner");
        //下载并加载
        flexslider_datainit(null,true);
        alert("loading from json finished");
    }
}

/********
 * 处理异步重新加载json内容
 * @finishFun 完成后的函数
 * @showloading 是否需要显示loading显示框
 * ************/
function flexslider_datainit(finishFun,showLoading) {///轮播图加载
    //检查网络情况
    if(checkConnection()){
        //    if(showLoading){
        //        showLoading();
        //    }
        $.ajax({
            url: "http://hd.zhoushan.cn/app/tpxw/index.json",
            //url: "http://www.test.com/zhoushan/index.json",
            success: function (data) {
                displayBanner(data);
                if(finishFun){
                    finishFun();
                }
            }
        });
    }
}


/********
 * 显示banner HTML, 记录HTML缓存
 * @data 加载成功后的返回json对象
 * ********/
function displayBanner(data){
    var list_l = "";
    //$('#js_flexslider').html("<ul class='slides'></ul>");
    var mainbanner_html =$('#js_flexslider>ul');
    mainbanner_html.html("");
    $.each(data.topic_datas,function(i, n){
        var imgName = getFilenameInURL(n.image);
        list_l = "<li><a href='###' data-url='"+n.url+"' data-docid='"+n.docid+"' rel='external'><img src='"+n.image+"' id='"+imgName+"' onerror='this.src=\"./assets/images/zs_errorimg.png\";' /></a><p class='flex-caption'>"+n.title+"</p></li>";
        //下载图片
        if(n.image!=null&&""!=n.image&&undefined!=n.image){
            try {
                localFile(n.image,imgName);
            } catch (e) {
                alert(e.name + ": " + e.message);
            }
        }
        mainbanner_html.append(list_l);
        list_l = "";
    });
    var mainbanner_cache = $('#js_flexslider>ul').html();
    alert("flexslider>ul="+$('#js_flexslider>ul').html());
    //写入缓存
    setCache('mainbanner',mainbanner_cache);
    setCache('mainbanner_time', getTimestamp());  //写入缓存的时候顺便写入缓存的时间

}



var dir = "zhoushannews_files";
var fileSystem;
/**
 * 加载图片 若缓存中没有该图片则下载
 * @param sourceUrl 目标图片地址
 * @param imgName 图片名称/图片id
 */
function localFile(sourceUrl,imgName) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
        fileSystem = fs;
        //创建目录
        fileSystem.root.getDirectory(dir, {create:true,exclusive:false},
                                     function(dirEntry){
                                         var dirPath = dirEntry.fullPath;
                                         var _localFile = dirPath+"/"+imgName+".jpg";
                                         var _localFile_download = dir+"/"+imgName+".jpg";
                                         alert("fullpath for localfile="+_localFile);
                                         var _url = sourceUrl;
                                         //查找文件
                                         fileSystem.root.getFile(_localFile, null, function(fileEntry){
                                             alert("have files already");
                                             //文件存在就直接显示
                                             var smallImage = document.getElementById(imgName);
                                             smallImage.style.display = 'block';
                                             smallImage.src = fileEntry.fullPath;
                                             alert("entry.fullPath="+fileEntry.fullPath);
                                         }, function(){
                                             alert("redownload file");
                                             //否则就到网络下载图片!
                                             fileSystem.root.getFile(_localFile_download, {create:true,exclusive:false}, function(fileEntry){
                                                 var targetURL = fileEntry.toURL();
                                                 downloadPic(_url,targetURL,imgName);
                                             },function(){
                                                 alert('下载图片出错');
                                             });
                                         });
                                     },
                                     function(){
                                         alert('创建目录失败');
                                         console.log("创建目录失败");});
    }, function(evt){
        alert("加载文件系统出现错误");
        console.log("加载文件系统出现错误");
    });
}

/**
 * 下载图片
 *  @param sourceUrl 目标图片地址
 *  @param targetUrl 图片存储地址
 *  @param id        页面图片id
 */

function downloadPic(sourceUrl,targetUrl,id){
    var fileTransfer = new FileTransfer();
    var uri = encodeURI(sourceUrl);
    fileTransfer.download(
        uri,targetUrl,function(entry){
            var smallImage = document.getElementById(id);
            smallImage.style.display = 'block';
            smallImage.src = entry.fullPath;
            alert("redownload entry.fullPath="+entry.fullPath);
        },function(error){
            console.log("下载网络图片出现错误");
        });
}

/**
 * 删除缓存目录及文件
 */
function doDeleteCatcheFile() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
        fs.root.getDirectory(dir,{create:false},function(dirEntry) {
            // 删除此目录及其所有内容
            dirEntry.removeRecursively(function(evt){
                clearCache();
                console.log("删除缓存文件成功!");
            }, function(evt){
                myAlert("删除缓存文件失败!");
                console.log("删除缓存文件失败");
            });

        }, function(evt){
            console.log("缓存文件不存在");
            myAlert("缓存文件不存在");
        });
    }, function(evt){
        console.log("加载文件系统出现错误");
        alert("加载文件系统出现错误");
    });
}

function isDeleteCatcheFile() {
    navigator.notification.confirm('确认删除缓存文件？', showConfirmDelete, '删除缓存', '确定,取消');
}
function showConfirmDelete(button) {
    if (button == 1) {
        doDeleteCatcheFile();
    }
}


/**
 * 检查网络情况
 * @returns {Boolean}
 */
function checkConnection() {
    var networkState = navigator.network.connection.type;
    if (networkState == Connection.NONE) {
        navigator.notification.confirm('请确认网络连接已开启,并重试', showAlert, '提示',
                                       '确定');
        return false;
    }else{
        return true;
    }
}
function showAlert(button) {
    return false;
}

/**
 * 删除缓存数据
 */
function clearCache(){
    localStorage.clear();
    myAlert('清除缓存成功!');
    doDeleteFile();
}



/**
 * 合并cache
 * @param key
 * @param jsonData
 */
function putCache(key,jsonData){
    //localStorage.clear();
    var localdatas = localStorage.getItem(key);
    if(localdatas==null||typeof localdatas === "undefined"){
        localStorage.setItem(key,jsonData);
    }else{
        var jsonList = JSON.parse(localdatas);
        var preLength = jsonList.length;
        var newJsonList = JSON.parse(jsonData);
        var newLength = newJsonList.length;

        //根据时间数据是否匹配来检查是否已经缓存
        var isExist = false;
        loop_1:for(var i=0;i<preLength;i++){
            for(var j=0;j<newLength;j++){
                if(newJsonList[j]==null||jsonList[i]==null){
                    continue;
                }
                if(jsonList[i].time!=null&&newJsonList[j].time!=null&&jsonList[i].time==newJsonList[j].time){
                    isExist = true;
                    break loop_1;
                }
            }
        }

        if(isExist == false){
            //拼接json对象
            for(var i=0;i<newLength;i++){
                if(newJsonList[i]!=null){
                    jsonList[preLength+i] = newJsonList[i];
                }


            }
        }

        //存入缓存
        localStorage.setItem(key,JSON.stringify(jsonList));
    }

}
function putCacheToFirst(key,jsonData){
    var localdatas = localStorage.getItem(key);
    if(localdatas==null||typeof localdatas === "undefined"){
        localStorage.setItem(key,jsonData);
    }else{
        var jsonList = JSON.parse(localdatas);
        var preLength = jsonList.length;
        var newJsonList = JSON.parse(jsonData);
        var newLength = newJsonList.length;

        //根据时间数据是否匹配来检查是否已经缓存
        var isExist = false;
        loop_1:for(var i=0;i<preLength;i++){
            for(var j=0;j<newLength;j++){
                if(newJsonList[j]==null||jsonList[i]==null){
                    continue;
                }
                if(jsonList[i].time!=null&&newJsonList[j].time!=null&&jsonList[i].time==newJsonList[j].time){
                    isExist = true;
                    break loop_1;
                }
            }
        }

        if(isExist == false){
            //拼接json对象

            for(var i=0;i<preLength;i++){
                if(jsonList[i]!=null){
                    newJsonList[newLength+1] = jsonList[i];
                }

            }

        }

        //存入缓存
        localStorage.setItem(key,JSON.stringify(newJsonList));
    }

}

/**
 * 设置cache
 * @param key
 * @param data
 */
function setCache(key,data){
    localStorage.setItem(key,data);
}
/**
 * 获得getCache
 * @param key
 * @returns
 */
function getCache(key){
    return localStorage.getItem(key);
}


/*获取时间戳的方法*/
function getTimestamp(){
    var timestamp1 =Date.parse(new Date());
    return timestamp1/1000;
}

function showLoading() {
    $.mobile.loadingMessageTextVisible = true;
    $.mobile.showPageLoadingMsg("a", "加载中...");
}

function hideLoading() {
    $.mobile.hidePageLoadingMsg();
}

function showMyAlert(text) {
    $.mobile.loadingMessageTextVisible = true;
    $.mobile.showPageLoadingMsg("a", text, true);
}
function myAlert(text) {
    showMyAlert(text);
    setTimeout(hideLoading, 2000);
}

/*获取url请求后面的文件名*/
function getFilenameInURL(sourceURL){
    var tmp = new Array();
    tmp = sourceURL.split("/");
    var filename = tmp[tmp.length-1];
    tmp = filename.split(".");
    return tmp[0];
}

/**
 * 获得cache最新数据的time属性值
 */
function getFirstCacheTimeAttriVal(key){
    var localdatas = localStorage.getItem(key);
    if(localdatas==null||typeof localdatas === "undefined"){
        return null;
    }else{
        var jsonList = JSON.parse(localdatas);
        return jsonList[0].time
    }
}



