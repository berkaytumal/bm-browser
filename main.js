const path = require('path');
const { app, BrowserView, ipcMain, nativeTheme } = require('electron')
const { BrowserWindow } = require("electron-acrylic-window")
//const composition = require("ewc");
const request = require('request').defaults({ encoding: null });
const fs = require("fs")
const enableExperimentalBlur = false
const vibrancy = "#222222aa"
function UpdateTheme() {
    Object.keys(windows).forEach(element => {
        UpdateWindowTheme(windows[element])
    });
}

nativeTheme.on('updated', UpdateTheme)
function UpdateWindowTheme(window) {
    //composition.custom(window, 3, 0x000000)
}
function createWindow() {
    const uuid = generateUUID()
    var window = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        title: "JackDaw",
        /*icon: "assets/logocircle.png",*/
        frame: false,
        backgroundColor: '#00000000',

        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        show: false,
    })
    windows[uuid] = window
    UpdateWindowTheme(window)
    window.webContents.executeJavaScript(`window["UUID"]="${uuid}"`)
    window.webContents.once('did-finish-load', function () {
        window.show();
    });

    window.setMenuBarVisibility(false)
    window.loadFile("library/browserwindowcompact/index.html")
    window.on('resize', async function () {
        if (window.isFullScreen()) { window.webContents.executeJavaScript("onFullscreen(true)") } else {
            window.webContents.executeJavaScript("onFullscreen(false)")
        }
        try {
            resizeViewport(window, (await window.webContents.executeJavaScript("onResize()")))
        } catch (error) {
            resizeViewport(window)
        }
    });
    /* const view = new BrowserView()
     window.setBrowserView(view)
     view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
     view.webContents.loadURL('https://electronjs.org')*/

    /*  if (url == undefined) return
      if (url == "url") return*/
    //window.loadURL(url);

    return uuid
}
function createWindo2() {
    const uuid = generateUUID()
    var window = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        title: "JackDaw",
        /*icon: "assets/logocircle.png",*/
        titleBarStyle: "hidden",
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        show: false,
    })
    windows[uuid] = window
    window.setVibrancy()

    window.webContents.executeJavaScript(`window["UUID"]="${uuid}"`)
    window.webContents.once('did-finish-load', function () {
        window.show();
    });

    window.setMenuBarVisibility(false)
    window.loadFile("library/browserwindowcompact/index.html")
    window.on('resize', async function () {
        if (window.isFullScreen()) { window.webContents.executeJavaScript("onFullscreen(true)") } else {
            window.webContents.executeJavaScript("onFullscreen(false)")
        }
        try {
            resizeViewport(window, (await window.webContents.executeJavaScript("onResize()")))
        } catch (error) {
            resizeViewport(window)
        }
    });
    return uuid
}
function destroyWindow(uuid) {
    windows[uuid].close()
    delete windows[uuid]
}
app.on("ready", function () {
    createWindow()
    UpdateTheme()

})
ipcMain.on("evaluate", function (event, arg, now) {
    event.sender.send('result' + now, (eval(arg)()))
})
ipcMain.on("evaluatemono", function (event, arg, now) {
    tempsender[now] = event.sender
    eval(arg)
})
function returnMono(mono, result) {
    tempsender[mono].send('resultmono' + mono, result)
    delete tempsender[mono]
}
ipcMain.on("getUUID", function (event) {
    const searcwindow = BrowserWindow.fromWebContents(event.sender)
    Object.keys(windows).forEach(element => {
        if (windows[element] != searcwindow) return
        event.sender.send('yourUUID', element)
    });
})
ipcMain.on("evaluateraw", function (event, arg, now) {
    var result = (eval(arg))
    event.sender.send('result' + now, result)
})

function generateUUID() {
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
var browserviews = {}
var browserviewparents = {}
var windows = {}
var focusedtabperwindow = {}
var tempsender = {}
function createTab() {
    const uuid = generateUUID()
    const view = new BrowserView()
    const contents = view.webContents
    view.UUID = uuid
    contents.UUID = uuid
    browserviews[uuid] = view
    contents.setWindowOpenHandler(TabHandlers.windowOpenHandler)
    contents.setUserAgent(contents.getUserAgent() + " Custom Value");
    Object.keys(TabHandlers.nativeHandlers).forEach(element => {
        contents.on(element, TabHandlers.nativeHandlers[element])
    });
    return uuid
}
const TabHandlers = {
    windowOpenHandler: function (details) {
        const tab = createTab()

        return { action: "allow" }
    },
    nativeHandlers: {
        "page-title-updated": function (e, title, explicit) {
            browserviewparents[this.UUID].webContents.executeJavaScript(`mainoneway.pageTitleUpdated("${this.UUID}","${title}",${explicit})`)
        },
        "page-favicon-updated": function (e, favicons) {
            const faviconurl = new URL(favicons[0])
            var data = ""
            const contents = this
            if (faviconurl.protocol == "file:") {
                //fs.readFile(filename, encoding, callback_function)
            } else if (faviconurl.protocol == "https:" || faviconurl.protocol == "http:") {
                request.get(faviconurl.toString(), function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
                    }
                    browserviewparents[contents.UUID].webContents.executeJavaScript(`mainoneway.pageFaviconUpdated("${contents.UUID}","${data}")`)
                });
            }
        },
        "will-navigate": function (e, url) {
            browserviewparents[this.UUID].webContents.executeJavaScript(`mainoneway.pageURLUpdated("${this.UUID}","${url}")`)
        }, "did-navigate": function (e, url) {
            browserviewparents[this.UUID].webContents.executeJavaScript(`mainoneway.pageURLUpdated("${this.UUID}","${url}")`)
        }, "did-navigate-in-page": function (e, url) {
            browserviewparents[this.UUID].webContents.executeJavaScript(`mainoneway.pageURLUpdated("${this.UUID}","${url}")`)
        },
    }
}
function destroyTab(uuid) {
    browserviews[uuid].webContents.destroy()
}
function closeTab(uuid) {
    browserviews[uuid].webContents.executeJavaScript("window.close()");
}
async function showTab(uuid) {
    Object.keys(browserviewparents).forEach(element => { if (browserviewparents[element] != browserviewparents[uuid]) return; hideTab(uuid) });
    browserviewparents[uuid].setBrowserView(browserviews[uuid])
    resizeViewport(browserviewparents[uuid], (await browserviewparents[uuid].webContents.executeJavaScript("onResize()")))
    Object.keys(windows).forEach(element => {
        if (windows[element] != browserviewparents[uuid]) return
        focusedtabperwindow[element] = browserviews[uuid]
    });
}
function hideTab(uuid) {
    browserviewparents[uuid].removeBrowserView(browserviews[uuid])
}

function stopRendering(windowuuid) {
    windows[windowuuid].removeBrowserView(focusedtabperwindow[windowuuid])
}
async function startRendering(windowuuid) {
    windows[windowuuid].setBrowserView(focusedtabperwindow[windowuuid])
    resizeViewport(windows[windowuuid], (await windows[windowuuid].webContents.executeJavaScript("onResize()")))
}
async function moveTab(uuid, windowuuid) {
    //if (browserviewparents[uuid] != undefined) browserviewparents[uuid].webContents.executeJavaScript("onResize()")
    browserviewparents[uuid] = windows[windowuuid]

    showTab(uuid)
}
function resizeViewport(window, locsize) {
    if (locsize == undefined) {
        var size = window.getSize();
        var width = size[0];
        var height = size[1];
        Object.keys(browserviewparents).forEach(element => {
            if (browserviewparents[element] != window) return
            const tab = browserviews[element]
            tab.setBounds({ x: 0, y: 50, width: size[0], height: size[1] - 50 })
        });
    } else {
        Object.keys(browserviewparents).forEach(element => {
            if (browserviewparents[element] != window) return
            const tab = browserviews[element]
            try {
                tab.setBounds({ x: Math.round(locsize[0]), y: Math.round(locsize[1]), width: Math.round(locsize[2]), height: Math.round(locsize[3]) })
            } catch (error) {
                console.log("ERROR")
                console.log({ x: Math.round(locsize[0]), y: Math.round(locsize[1]), width: Math.round(locsize[2]), height: Math.round(locsize[3]) })
            }
        });
    }

}
async function animview(windowuuid) {
    var size = await windows[windowuuid].webContents.executeJavaScript("onResize()")
    var interval = setInterval(async function () {
        var locsi = (await windows[windowuuid].webContents.executeJavaScript("onResize()"))
        const result = [size[0], locsi[1], size[2], size[3]]
        resizeViewport(windows[windowuuid], result)

    }, 0);
    var timeout = setTimeout(async function () {
        clearInterval(interval)
        resizeViewport(windows[windowuuid], (await windows[windowuuid].webContents.executeJavaScript("onResize()")))
    }, 300);
}

const windowcontrol = {
    minimize: (uuid) => {
        windows[uuid].minimize()
    },
    maximize: (uuid) => {
        const win = windows[uuid]
        if (win.isMaximized()) { // Determine whether the window has been maximized 
            win.restore();// Restore original window size
        } else {
            win.maximize();  //maximize window
        }
        return win.isMaximized()
    },
    close: (uuid) => {
        windows[uuid].close()
    },
    tabnavigate: (uuid, url) => {
        console.clear()
        var local = false
        if (isURL(url)) {
            var initurl
            try {
                initurl = new URL(url)
                if (initurl.protocol == "about:") {
                    console.clear()
                    console.log(url)
                    console.log(initurl)
                    url = path.resolve(__dirname + "/library/public/about/" + initurl.pathname + ".html")
                    local = true
                }
            } catch (error) {
                var [isHTTPS, isHTTP] = [url.startsWith("https:"), url.startsWith("http:")]
                if (!isHTTP && !isHTTPS) {
                    url = "https:" + url
                }
            }

        } else {
            //search word
        }
        if (local) {
            console.log(url)
            browserviews[uuid].webContents.loadFile(url)

        } else {
            browserviews[uuid].webContents.loadURL(url)

        }
    },
    tabgoback: (uuid) => {
        if (browserviews[uuid].webContents.canGoBack()) browserviews[uuid].webContents.goBack()
    },
    tabgoforward: (uuid) => {
        if (browserviews[uuid].webContents.canGoForward()) browserviews[uuid].webContents.goForward()
    },
    tabcango: (uuid) => {
        return { canGoBack: browserviews[uuid].webContents.canGoBack(), canGoForward: browserviews[uuid].webContents.canGoForward() }
    }
}
async function captureTab(uuid, mono) {
    var answer
    try {
        answer = String((await browserviews[uuid].webContents.capturePage()).toDataURL())
    } catch (error) {
        answer = ""
    }
    returnMono(mono, answer)
}
function isURL(input) {
    return !!(String(input).match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)))
}
const crypto = {}
