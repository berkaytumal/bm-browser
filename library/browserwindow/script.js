const timing = require('timing-function');
window.$ = require("jquery");
const { ipcRenderer } = require('electron')
function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}
var test = !isElectron()
if (test) {
    ipcRenderer = {
        on: function () {

        },
        send: function () {

        }
    }
}
function onResize() {
    var position = $("#browserview").offset()
    return ([position.left, position.top, $("#browserview").width(), $("#browserview").height()])

}
var fullscreen = [false, false]
function onFullscreen(bool) {
    fullscreen[0] = bool
    if (fullscreen[1] != fullscreen[0]) {
        if (bool) {
            //   alert("fullscren")
            $("body").addClass("fullscreen")
        } else {
            $("body").removeClass("fullscreen")

        }
        main.animateView()

    }

    fullscreen[1] = bool
}
$("#toppart").on("pointerenter", function () {
    main.animateView()
})
$("#toppart").on("pointerleave", function () {
    main.animateView()
})
var tabbar = $("#tabbar")

const ginputhandler = {
    keydown: function (e) {

        if (e.keyCode == 13) {
            main.browser.navigate(main.temp.activetab, $(this).val())
            $(this).blur()
        }
    },
    pointerdown: function (e) {
        $(this).focus()
    },
    focus: function (e) {
        $(this).parent().parent()[0].inputactive = true
    },
    blur: function (e) {
        $(this).parent().parent().removeClass("focus animate dragging")
        $(this).parent().parent()[0].inputactive = false
    }
}
const ginputphhandler = {
    pointerdown: function (e) {

    },
    pointerup: function (e) {
        if ($(this).parent().parent().hasClass("dragging")) {
            $(this).parent().parent().removeClass("dragging animate")
        } else if (this.focusable == true) {
            console.log("ananke")
            $(this).parent().parent().addClass("focus")
            $(this).parent().children(".g-input").focus()
        }


    },
}
const faviconhandler = {
    pointerdown: function (e) {
        window["tempfaviconmouseloc"] = [e.clientX, e.clientY]
        window["tempfaviconuuid"] = $(this).parent().attr("uuid")
    },
    pointerup: function (e) {

    }
}
$(window).on("pointerup", function (e) {
    if (!(window["tempfaviconmouseloc"] && window["tempfaviconuuid"])) return
    if (e.clientX == window["tempfaviconmouseloc"][0] && e.clientY == window["tempfaviconmouseloc"][1]) {
        console.log("Aas")
        const uuid = window["tempfaviconuuid"]
        destroyTabRep(uuid)
        main.destroyTab(uuid)
    } else {
        console.log([e.clientX, e.clientY], window["tempfaviconmouseloc"])
    }
})
function createTabRep(uuid) {
    tabbar.append(`
    <div class="tabrepresentative created" uuid="${uuid}">
        <div class="g-favicon">
            <div class="g-closetab"></div>
            <img class="favicon" src="">
        </div>
        <div class="title">
            <p class="tabtitle">New Tab</p>
        </div>
        <div class="active">
            <div class="urlinput g-inputph">about:newtab</div>
            <input class="urlinput g-input" type="url">
        </div>
    </div>
    `)
    dragdroptab.refreshBind()
    updateTabBarHidden()
    main.animateView()
    updateTabSize()

}
function getTabRep(uuid) {
    return tabbar.children(`.tabrepresentative[uuid="${uuid}"]`).eq(0)
}
function destroyTabRep(uuid) {
    const tab = $(`#tabbar .tabrepresentative[uuid="${uuid}"]`).eq(0)
    tab.css("animation", "tabclosing 0.3s ease-out")
    updateTabSize(true)
    setTimeout(() => {
        tab.remove()
        updateTabBarHidden()
        main.animateView()
    }, 300);
}
//var TabBarHidden = { new: true, old: true }
function updateTabSize(oneless) {
    var size = (!!oneless) ? $("#tabbar").children().length - 1 : $("#tabbar").children().length
    setTimeout(() => {
        $(":root").css("--tabsize", dragdroptab.gettabsize() + "px")
        $(":root").css("--msideflex", size)

    }, 0);
    updateTabsGradient()
    setTimeout(() => {
        updateTabsGradient()
    }, 300);
}
function updateTabBarHidden() {
    const easing = timing.get(0.16, 1, 0.3, 1)
    const lefte = Math.round(-tabbar.width()) + Math.round(tabbar.prop("scrollWidth"))
    const lete = tabbar.scrollLeft()
    tabbar.stop()
    $({ x: 0 }).animate({ x: 1 }, {
        step: function () {
            tabbar.scrollLeft(lete + (easing(this.x) * (lefte - lete)))
        }, duration: 300
    });

    // TabBarHidden.new = ($("#tabbar").children().length <= 1)
    //  if (TabBarHidden.new != TabBarHidden.old) { main.animateView(() => { }); console.log("ANIMATON START") }
    if ($("#tabbar").children().length <= 1) $("#tabbar").addClass("hidden");
    else $("#tabbar").removeClass("hidden");
    //  TabBarHidden.old = TabBarHidden.new
}
function updateTabsGradient() {
    const [boxsize, contentsize, maxscroll, scroll] = [Math.round(tabbar.width()), Math.round(tabbar.prop("scrollWidth")), Math.round(-tabbar.width()) + Math.round(tabbar.prop("scrollWidth")), Math.round(tabbar.scrollLeft())]
    console.log(boxsize, contentsize, maxscroll, scroll)
    const [lsize, rsize] = [(scroll < 100) ? scroll / 2 : 50, ((maxscroll - scroll) < 100) ? (maxscroll - scroll) / 2 : 50]
    tabbar.css("--mask", `linear-gradient(90deg, transparent 0%, white ${lsize}px, white calc(100% - ${rsize}px), transparent 100%)`)
}
var dragdroptab = {
    selectedtab: undefined,
    dragging: false,
    gettabsize: function () {
        const tabs = $("#tabbar").children(".tabrepresentative")
        const [w0, w1] = [tabs.eq(0).width(), tabs.eq(1).width()]
        return (w0 > w1 ? w1 : w0)
    },
    goina: 0,
    prevAll: undefined,
    nextAll: undefined,
    refreshBind: () => {
        $("#tabbar .tabrepresentative").unbind("pointerdown", tabonpointerdown)
        $("#tabbar .tabrepresentative").bind("pointerdown", tabonpointerdown)
        $("#tabbar .tabrepresentative").unbind("click", tabonclick)
        $("#tabbar .tabrepresentative").bind("click", tabonclick)
        $("#tabbar .tabrepresentative").bind("dragstart", onDrag)
        $("#tabbar .tabrepresentative .g-input").unbind()
        $("#tabbar .tabrepresentative .g-inputph").unbind()
        Object.keys(ginputhandler).forEach(element => {
            $("#tabbar .tabrepresentative .g-input").bind(String(element), ginputhandler[element])
        });
        Object.keys(ginputphhandler).forEach(element => {
            $("#tabbar .tabrepresentative .g-inputph").bind(String(element), ginputphhandler[element])
        });
        Object.keys(faviconhandler).forEach(element => {
            $("#tabbar .tabrepresentative .g-favicon").bind(String(element), faviconhandler[element])
        });

    },
    lastscroll: 0
}
function onDrag(e) {
    if (dragdroptab.dragging) e.preventDefault()
    // alert("dsgf")
}
function tabonclick(e) {

}
function tabonpointerdown(e) {
    $(this).children(".active").children(".g-inputph")[0].focusable = $(this).hasClass("selected")
    $(this).removeClass("dragging animate created")
    if (!this.inputactive) {
        this.mousedownpos = e.clientX
        this.mousedownpos2 = e.clientY
        dragdroptab.dragging = false
        dragdroptab.selectedtab = this
        dragdroptab.lastscroll = $("#tabbar").scrollLeft()
    }

    if (menu == "browser") {
        showTabRep($(this).attr("uuid"))

    } else {
        $("#tabsview .tabs").children(`.tab[uuid="${$(this).attr("uuid")}"]`).click()
    }

}
$(window).on("pointerup", function (e) {
    if (dragdroptab.dragging) {
        var selected = dragdroptab.selectedtab

        $(selected).addClass("animate")
        setTimeout(() => {
            $(selected).css("transform", `translateX(${dragdroptab.goina * (dragdroptab.gettabsize() + 10)}px)`)
            setTimeout(() => {
                var index = $()
                var neworder = ""
                if (dragdroptab.goina > 0) {
                    $(dragdroptab.prevAll.get().reverse()).each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })

                    dragdroptab.nextAll.slice(0, dragdroptab.goina).each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })
                    $(selected).prop("style", "")
                    $(selected).removeClass("dragging animate created")
                    neworder += $(selected).prop("outerHTML")
                    dragdroptab.nextAll.slice(dragdroptab.goina).each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })

                } else if (dragdroptab.goina < 0) {
                    $(dragdroptab.prevAll.slice(-dragdroptab.goina).get().reverse()).each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })
                    $(selected).prop("style", "")
                    $(selected).removeClass("dragging animate created")
                    neworder += $(selected).prop("outerHTML")
                    $(dragdroptab.prevAll.slice(0, -dragdroptab.goina).get().reverse()).each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })
                    //$(dragdroptab.selectedtab).prevAll().slice(0, -ina)
                    dragdroptab.nextAll.each(function () {
                        $(this).prop("style", "")
                        $(this).removeClass("dragging animate created")
                        neworder += $(this).prop("outerHTML")
                    })
                } else {

                }
                if (neworder != "") { $("#tabbar").html(neworder); main.temp.tabthumbnails.sort() } else {
                }
                dragdroptab.goina = 0
                $("#tabbar").removeClass("draganim")
                dragdroptab.refreshBind()
            }, 300);
        }, 0);
    }
    dragdroptab.dragging = false
    dragdroptab.selectedtab = undefined
})
function tabDraggedOut() {
    const uuid = $(dragdroptab.selectedtab).attr("uuid")
    destroyTabRep($(dragdroptab.selectedtab).attr("uuid"))
    $(window).trigger("pointerup")
    main.createWindow(function (windowuuid) {
        main.moveTab(uuid, windowuuid);
    })
}
$("#tabbar").scroll(function () {
    updateTabsGradient()
    if (dragdroptab.dragging) onPointerMove(lastevent)
})

$(window).on("pointermove", onPointerMove)
var lastevent
function onPointerMove(e) {
    lastevent = e
    if (dragdroptab.dragging == true) {
        if (Math.abs(e.clientY - dragdroptab.selectedtab.mousedownpos2) > 50) {
            tabDraggedOut()
            return
        }
        $(dragdroptab.selectedtab).css("transform", `translateX(${e.clientX - dragdroptab.selectedtab.mousedownpos + ($("#tabbar").scrollLeft() - dragdroptab.lastscroll)}px)`)
        //console.log(e.clientX - dragdroptab.selectedtab.mousedownpos)
        var uzak = e.clientX - dragdroptab.selectedtab.mousedownpos + ($("#tabbar").scrollLeft() - dragdroptab.lastscroll)
        var ina = Math.floor((uzak / dragdroptab.gettabsize()) * 2)
        ina = Math.floor((ina + 1) / 2)
        dragdroptab.goina = ina
        dragdroptab.prevAll = $(dragdroptab.selectedtab).prevAll()
        dragdroptab.nextAll = $(dragdroptab.selectedtab).nextAll()
        var trsize = dragdroptab.gettabsize()
        trsize = $(dragdroptab.selectedtab).width() + 10
        if (ina == 0) {
            $(dragdroptab.selectedtab).nextAll().css("transform", "")
            $(dragdroptab.selectedtab).prevAll().css("transform", "")

        }
        else if (ina > 0) {
            $(dragdroptab.selectedtab).nextAll().slice(ina).css("transform", "")
            $(dragdroptab.selectedtab).nextAll().slice(0, ina).css("transform", `translateX(${-trsize}px)`)
        } else if (ina < 0) {
            $(dragdroptab.selectedtab).prevAll().slice(-ina).css("transform", "")
            $(dragdroptab.selectedtab).prevAll().slice(0, -ina).css("transform", `translateX(${trsize}px)`)
        }
    }
    if (!dragdroptab.dragging && dragdroptab.selectedtab != undefined) {
        if (Math.abs(e.clientX - dragdroptab.selectedtab.mousedownpos) > 10) {
            dragdroptab.dragging = true
            dragdroptab.selectedtab.mousedownpos = e.clientX
            $(dragdroptab.selectedtab).addClass("dragging")
            $("#tabbar").addClass("draganim")
        } else if (Math.abs(e.clientY - dragdroptab.selectedtab.mousedownpos2) > 50) {
            tabDraggedOut()

            return
        }

    }

}
function showTabRep(uuid, noactivate) {
    $("#tabbar .tabrepresentative").removeClass("clickinside")
    $(`#tabbar .tabrepresentative[uuid="${uuid}"]`).addClass("clickinside")

    $("#tabbar .tabrepresentative").removeClass("selected")
    $(`#tabbar .tabrepresentative[uuid="${uuid}"]`).addClass("selected")
    if (!noactivate) {
        main.showTab(uuid)
        main.temp.activetab = uuid
    }

}
function MENUBARBORDERRADIUSINIT(param) {
    const menu = $(param)
    menu.children("button").each(function (index, element) {
        const elem = $(element)
        elem.append(`<img class="menubaricon" src="../images/${elem.attr("icon")}.png">`)
        elem.attr("icon", "")
        var [leftborder, rightborder] = [false, false]
        const realindex = elem.index()
        const borderradius = 10
        if (index == 0) {
            leftborder = true
            const nextitem = menu.children().eq(realindex + 1).prop("tagName")

            if (nextitem != "BUTTON") {
                rightborder = true
            }
        } else if (index == menu.children("button").length - 1) {
            rightborder = true
            const previtem = menu.children().eq(realindex - 1).prop("tagName")

            if (previtem != "BUTTON") {
                leftborder = true
            }
        } else {
            const [previtem, nextitem] = [menu.children().eq(realindex - 1).prop("tagName"), menu.children().eq(realindex + 1).prop("tagName")]
            if (previtem != "BUTTON") {
                leftborder = true
            }
            if (nextitem != "BUTTON") {
                rightborder = true
            }
        }
        elem.css("border-radius", (leftborder ? borderradius : 0) + "px " + (rightborder ? borderradius : 0) + "px " + (rightborder ? borderradius : 0) + "px " + (leftborder ? borderradius : 0) + "px")

    })
}
MENUBARBORDERRADIUSINIT(".lside")
MENUBARBORDERRADIUSINIT(".rside")


setTimeout(() => {

}, 2000);
function MainEval(eval, callback) {
    const now = Date.now() + Math.round(Math.random() * 100)
    var resultsent = false
    function onResult(event, arg) {
        if (resultsent) return
        resultsent = true
        ipcRenderer.removeListener('result' + now, onResult)
        callback(arg);
    }
    ipcRenderer.on('result' + now, onResult)
    ipcRenderer.send('evaluate', eval.toString(), now)
    return ("sent")
}
function MainEvalRaw(eval, callback) {
    const now = Date.now() + Math.round(Math.random() * 100)
    var resultsent = false
    function onResult(event, arg) {
        if (resultsent) return
        resultsent = true
        ipcRenderer.removeListener('result' + now, onResult)
        callback(arg);
    }
    ipcRenderer.on('result' + now, onResult)
    ipcRenderer.send('evaluateraw', String(eval), now)
    return ("sent")
}
function MainEvalMono(eval, callback) {
    const now = Date.now() + Math.round(Math.random() * 100)
    var resultsent = false
    function onResult(event, arg) {
        if (resultsent) return
        resultsent = true
        ipcRenderer.removeListener('resultmono' + now, onResult)
        callback(arg);
    }
    ipcRenderer.on('resultmono' + now, onResult)
    ipcRenderer.send('evaluatemono', String(String(eval) + "_?").replace(")_?", `, "${now}")`), now)
    return ("sent")
}
const mainoneway = {
    pageTitleUpdated: function (uuid, title, explicit) {
        console.log(`${uuid} changed title to ${title}`)
        getTabRep(uuid).children(".title").children("p.tabtitle").html("")
        getTabRep(uuid).children(".title").children("p.tabtitle").text(title)
    },
    pageURLUpdated: function (uuid, url) {
        console.log(`${uuid} changed url to ${url}`)
        getTabRep(uuid).children(".active").children(".g-input").val(url)
        try {
            var hostname = (new URL(url)).host
            hostname = hostname.startsWith("www.") ? hostname.slice(4) : hostname
            getTabRep(uuid).children(".active").children(".g-inputph").html("")
            getTabRep(uuid).children(".active").children(".g-inputph").text(hostname)

        } catch (error) {
            getTabRep(uuid).children(".active").children(".g-inputph").html("")
            getTabRep(uuid).children(".active").children(".g-inputph").text(url)
        }
    },
    pageFaviconUpdated: function (uuid, data) {
        console.log(`${uuid} changed favicon to ${data}`)
        getTabRep(uuid).children(".g-favicon").children(".favicon").attr("src", data)
    }
}
const main = {
    generateUUID: function (callback) { MainEval(() => { return generateUUID() }, (answer) => { if (typeof callback == "function") callback(answer) }) },
    createWindow: function (callback) { MainEval(() => { return createWindow() }, (answer) => { if (typeof callback == "function") callback(answer) }) },
    destroyWindow: function (uuid, callback) { MainEvalRaw(`destroyWindow("${uuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    createTab: function (callback) { MainEval(() => { return createTab() }, (answer) => { if (typeof callback == "function") callback(answer) }) },
    destroyTab: function (uuid, callback) { MainEvalRaw(`destroyTab("${uuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    closeTab: function (uuid, callback) { MainEvalRaw(`closeTab("${uuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    showTab: function (uuid, callback) { MainEvalRaw(`showTab("${uuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    hideTab: function (uuid, callback) { MainEvalRaw(`hideTab("${uuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    moveTab: function (uuid, windowuuid, callback) { MainEvalRaw(`moveTab("${uuid}","${windowuuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    animateView: function (callback) { MainEvalRaw(`animview("${window.UUID}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    stopRendering: function (windowuuid, callback) { MainEvalRaw(`stopRendering("${windowuuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    startRendering: function (windowuuid, callback) { MainEvalRaw(`startRendering("${windowuuid}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    browser: {
        navigate: function (uuid, url, callback) { MainEvalRaw(`windowcontrol.tabnavigate("${uuid}","${url}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
        captureTab: function (uuid, callback) {
            MainEvalMono(`captureTab("${uuid}")`, (answer) => {
                if (typeof callback == "function") {
                    main.temp.tabthumbnails.nasty[uuid] = answer
                    main.temp.tabthumbnails.sort()
                    callback(answer)
                }
            })
        },
        generateThumbnails: function (thumbnails) {
            const parent = $("#tabsview .tabs").eq(0)
            parent.html("")
            Object.keys(thumbnails).forEach(element => {
                parent.append(`<div class="tab" uuid="${element}" style="--bg:url('${thumbnails[element]}')"></div>`)
            });
            parent.children(".tab").click(function () {
                main.temp.tabthumbnails.selecttab($(this).attr("uuid"))
            })
        }
    },
    window: {
        minimize: function (callback) { MainEvalRaw(`windowcontrol.minimize("${window.UUID}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
        maximize: function (callback) { MainEvalRaw(`windowcontrol.maximize("${window.UUID}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
        close: function (callback) { MainEvalRaw(`windowcontrol.close("${window.UUID}")`, (answer) => { if (typeof callback == "function") callback(answer) }) },
    },
    temp: {
        tabthumbnails: {
            nasty: {}, sorted: {}, sort: () => {
                main.temp.tabthumbnails.sorted = {}
                $("#tabbar").children(".tabrepresentative").each((index, element) => {
                    const uuid = $(element).attr("uuid")
                    main.temp.tabthumbnails.sorted[uuid] = (main.temp.tabthumbnails.nasty[uuid] == undefined) ? "white" : main.temp.tabthumbnails.nasty[uuid]
                });
            }, selecttab: (selectedtab) => {
                const tab = $(`#tabsview .tabs .tab[uuid="${selectedtab}"]`)
                tab.addClass("selected")
                tab.css("transition", "0s")
                tab.css("transform", "zoom(1)");
                setTimeout(() => {
                    tab.css("animation", "")
                    tab.css({ "--tranx": ((browserview.width() * 2 / 5) - tab.offset().left) + "px", "--trany": ((browserview.height() * 2 / 5) - tab.offset().top) + browserview.offset().top + "px" })
                    tab.css("animation", "var(--tabopen)")
                    showTabRep(selectedtab, true)
                    setTimeout(() => {
                        main.showTab(selectedtab)
                        showTabRep(selectedtab)

                        setTimeout(() => {
                            $("#tabsview .tabs").eq(0).html("")
                        }, 50);
                    }, 450);
                    menu = "browser"
                }, 0);

            }, opentabs: () => {
                main.browser.captureTab(main.temp.activetab, (thumbnail) => {
                    main.browser.generateThumbnails(main.temp.tabthumbnails.sorted)
                    const tab = $(`#tabsview .tabs .tab[uuid="${main.temp.activetab}"]`)
                    tab.addClass("selected")
                    setTimeout(() => {
                        tab.removeClass("selected")
                        tab.css("animation", "")

                    }, 480);
                    tab.css("animation", "")
                    tab.css({ "--tranx": ((browserview.width() * 2 / 5) - tab.offset().left) + "px", "--trany": ((browserview.height() * 2 / 5) - tab.offset().top) + browserview.offset().top + "px" })
                    tab.css("animation", "var(--tabclose)")
                    setTimeout(() => {
                        main.stopRendering(UUID)
                    }, 20);
                })
            }
        },
        activetab: "",
    }
}
function RefreshUUID() {
    //ipcRenderer.send('getUUID')
    //return ("sent")

    var resultsent = false
    function onResult(event, arg) {
        if (resultsent) return
        resultsent = true
        ipcRenderer.removeListener('yourUUID', onResult)
        window["UUID"] = arg
    }
    ipcRenderer.on('yourUUID', onResult)
    ipcRenderer.send('getUUID', String(eval))
    return ("sent")
}

/*
try {
    ipcRenderer.on('result', (event, arg) => { console.log("main said: ", arg) })

} catch (error) {

}
*/
$("#g-newtab").click(function () {
    if (test) {
        var a = Date.now()
        createTabRep(a)
        showTabRep(a)
    } else {
        main.createTab(function (tuuid) {
            main.moveTab(tuuid, UUID)
            createTabRep(tuuid)
            showTabRep(tuuid)
            main.browser.navigate(tuuid, "about:newtab")
        })

    }

})
var menu = "browser"
var browserview = $("#browserview")
$("#g-tabs").click(function () {
    if (test) {
    } else {
        if (menu == "browser") {
            main.temp.tabthumbnails.opentabs()
            menu = "tabsview"
        } else if (menu == "tabsview") {
            main.temp.tabthumbnails.selecttab(main.temp.activetab)
            menu = "browser"
        }
        $("body").attr("menu", menu)

    }

})
$("#g-close").click(function () {
    main.window.close()
})
$("#g-max").click(function () {
    main.window.maximize((maximized) => {
        $(this).children("img").attr("src", `../images/${maximized ? "normalize" : "maximize"}.png`)
    })
})
$("#g-min").click(function () {
    main.window.minimize()
})

RefreshUUID()
function isURL(input) {
    return !!String(input).match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi))
}

$(window).on("resize", () => {
    updateTabsGradient()

})