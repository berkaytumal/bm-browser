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
function createTabRep(uuid) {
    $("#tabbar").stop
    tabbar.append(`<div class="tabrepresentative created" uuid="${uuid}"><p class="tabtitle">New Tab</p></div>`)
    dragdroptab.refreshBind()
    updateTabBarHidden()
    main.animateView()
    updateTabSize()
    //$("#tabbar").animate({ scrollLeft: $(`.tabrepresentative[uuid="${uuid}"]`).position().left }, 300);

}
function destroyTabRep(uuid) {
    const tab = $(`#tabbar .tabrepresentative[uuid="${uuid}"]`).eq(0)
    tab.css("animation", "tabclosing 0.3s ease-out")
    setTimeout(() => {
        tab.remove()
        updateTabBarHidden()
        main.animateView()
    }, 300);
}
//var TabBarHidden = { new: true, old: true }
function updateTabSize() {
    setTimeout(() => {
        $(":root").css("--tabsize", dragdroptab.gettabsize() + "px")
    }, 0);

}
function updateTabBarHidden() {
    // TabBarHidden.new = ($("#tabbar").children().length <= 1)
    //  if (TabBarHidden.new != TabBarHidden.old) { main.animateView(() => { }); console.log("ANIMATON START") }
    if ($("#tabbar").children().length <= 1) $("#tabbar").addClass("hidden");
    else $("#tabbar").removeClass("hidden");
    //  TabBarHidden.old = TabBarHidden.new
}
var dragdroptab = {
    selectedtab: undefined,
    dragging: false,
    gettabsize: function () {
        var ans = $("#tabbar").width() / $("#tabbar").children(".tabrepresentative").length;
        return (ans > 100) ? ans : 100
    },
    goina: 0,
    prevAll: undefined,
    nextAll: undefined,
    refreshBind: () => {
        $("#tabbar .tabrepresentative").unbind("pointerdown", tabOnClick)
        $("#tabbar .tabrepresentative").bind("pointerdown", tabOnClick)
        $("#tabbar .tabrepresentative").bind("dragstart", onDrag)
    },
    lastscroll: 0
}
function onDrag(e) {
    if (dragdroptab.dragging) e.preventDefault()
    // alert("dsgf")
}
function tabOnClick(e) {
    $(this).removeClass("dragging animate created")
    this.mousedownpos = e.clientX
    this.mousedownpos2 = e.clientY
    dragdroptab.dragging = false
    dragdroptab.selectedtab = this
    dragdroptab.lastscroll = $("#tabbar").scrollLeft()
    showTabRep($(this).attr("uuid"))
}
$(window).on("pointerup", function (e) {
    if (dragdroptab.dragging) {
        var selected = dragdroptab.selectedtab

        $(selected).addClass("animate")
        setTimeout(() => {
            $(selected).css("transform", `translateX(${dragdroptab.goina * dragdroptab.gettabsize()}px)`)
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
                        //console.log($(this).prop("outerHTML"))
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
                if (neworder != "") { $("#tabbar").html(neworder); main.temp.tabthumbnails.sort() }
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
        if (ina == 0) {
            $(dragdroptab.selectedtab).nextAll().css("transform", "")
            $(dragdroptab.selectedtab).prevAll().css("transform", "")

        }
        else if (ina > 0) {
            $(dragdroptab.selectedtab).nextAll().slice(ina).css("transform", "")
            $(dragdroptab.selectedtab).nextAll().slice(0, ina).css("transform", `translateX(${-dragdroptab.gettabsize()}px)`)
        } else if (ina < 0) {
            $(dragdroptab.selectedtab).prevAll().slice(-ina).css("transform", "")
            $(dragdroptab.selectedtab).prevAll().slice(0, -ina).css("transform", `translateX(${dragdroptab.gettabsize()}px)`)
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
function showTabRep(uuid) {
    $("#tabbar .tabrepresentative").removeClass("selected")
    $(`#tabbar .tabrepresentative[uuid="${uuid}"]`).addClass("selected")
    main.showTab(uuid)
    main.temp.activetab = uuid

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
                sorted = {}
                $("#tabbar").children(".tabrepresentative").each((index, element) => {
                    const uuid = $(element).attr("uuid")
                    main.temp.tabthumbnails.sorted[uuid] = (main.temp.tabthumbnails.nasty[uuid] == undefined) ? "white" : main.temp.tabthumbnails.nasty[uuid]
                });
            }, selecttab: (selectedtab) => {
                const tab = $(`#tabsview .tabs .tab[uuid="${selectedtab}"]`)
                tab.css("transition", "0s")
                tab.css("transform", "zoom(1)");
                setTimeout(() => {
                    tab.css("animation", "")
                    tab.css({ "--tranx": ((browserview.width() * 2 / 5) - tab.offset().left) + "px", "--trany": ((browserview.height() * 2 / 5) - tab.offset().top) + browserview.offset().top + "px" })
                    tab.css("animation", "var(--tabopen)")
                    setTimeout(() => {
                        showTabRep(selectedtab)
                        //main.startRendering(UUID)
                    }, 450);
                    menu = "browser"
                }, 0);

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
            main.browser.navigate(tuuid, "https://www.google.com")
        })

    }

})
var menu = "browser"
var browserview = $("#browserview")
$("#g-tabs").click(function () {
    if (test) {
    } else {
        if (menu == "browser") {
            main.browser.captureTab(main.temp.activetab, (thumbnail) => {
                main.browser.generateThumbnails(main.temp.tabthumbnails.sorted)
                const tab = $(`#tabsview .tabs .tab[uuid="${main.temp.activetab}"]`)
                tab.css("animation", "")
                tab.css({ "--tranx": ((browserview.width() * 2 / 5) - tab.offset().left) + "px", "--trany": ((browserview.height() * 2 / 5) - tab.offset().top) + browserview.offset().top + "px" })
                tab.css("animation", "var(--tabclose)")
                setTimeout(() => {
                    main.stopRendering(UUID)
                }, 20);
            })
            menu = "tabsview"
        } else if (menu == "tabsview") {
            try {
                const tab = $(`#tabsview .tabs .tab[uuid="${main.temp.activetab}"]`)
                tab.css("animation", "")
                tab.css({ "--tranx": ((browserview.width() * 2 / 5) - tab.offset().left) + "px", "--trany": ((browserview.height() * 2 / 5) - tab.offset().top) + browserview.offset().top + "px" })
                tab.css("animation", "var(--tabopen)")
                setTimeout(() => {
                    main.startRendering(UUID)
                }, 450);
                menu = "browser"
            } catch (error) {
                main.startRendering(UUID)
                menu = "browser"
            }

        }

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
$("#g-input").on("keydown", function (e) {
    if (e.keyCode == 13) {
        main.browser.navigate(main.temp.activetab, $(this).val())
    }
})
$("#g-input").on("focus", function (e) {
    $("#g-inputph").removeClass("notfocus")
})
$("#g-input").on("blur", function (e) {
    $("#g-inputph").addClass("notfocus")

})
RefreshUUID()
function isURL(input) {
    return String(input).match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi))
}