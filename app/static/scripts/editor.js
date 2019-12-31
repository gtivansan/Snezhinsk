let toolsCanvas = document.getElementById("tools");
let flakerawCanvas = document.getElementById("flakeraw");
let masksContainer = document.getElementById("masksContainer");
let layersBar = document.getElementById("layersBar");
let layersFooter = document.getElementById("layersFooter");

let readyButton = document.getElementById("ready");
let readyPopup = document.getElementById("readyPopup");
let readyPopupWindow = document.getElementById("readyPopupWindow");
let readyPopupBack = document.getElementById("readyPopupBack");
let inputSignature = document.getElementById("inputSignature");

let toolDict = {
    "toolChain": ToolChain,
    "toolBezier": ToolBezier,
    "stencilStar": StencilStar,
    "stencilChristmasTree": StencilChristmasTree,
    "stencilCircle": StencilCircle,
    "stencilSnowflake": StencilSnowflake
}

let tools = {};
let activeLayerId = 0;
let activeTool = ToolChain;
let activeToolName = "toolChain";
let toolsCounter = 0;

layersFooter.addEventListener("click", addLayer);
readyButton.addEventListener("click", showReadyPopup);
readyPopupBack.addEventListener("click", hideReadyPopup);
submitButton.addEventListener('click', () => submit(inputSignature.value));

addLayer();

function layerOnclick(id, event) {
    let layer = document.getElementById("layer_" + id);
    if (["use", "svg"].includes(event.target.tagName)) {
        deleteLayer(id);
    } else {
        activateLayer(id);
    }
}

function addLayer() {
    if (tools[activeLayerId] && tools[activeLayerId].action) {
        elem = document.querySelector(`#${activeToolName} .${tools[activeLayerId].action}`)
        if (elem) {
            elem.classList.remove("active");
        }
    }
    if (tools[activeLayerId]) {
        tools[activeLayerId].deactivate();
    }
    let layer = document.createElement("div");
    layer.setAttribute("class", "layer");
    layer.setAttribute("id", "layer_" + toolsCounter);
    let layerId = document.createElement("span");
    layerId.setAttribute("class", "layer-id");
    layerId.innerText = toolsCounter + 1;
    let layerDel = document.createElementNS(svgNS, "svg");
    layerDel.setAttribute("width", "35");
    layerDel.setAttribute("height", "35");
    layerDel.setAttribute("class", "layer-del");
    let use = document.createElementNS(svgNS, "use");
    use.setAttribute("href", "#trashIcon");
    use.setAttribute("overflow", "visible");
    layer.appendChild(layerId);
    layer.appendChild(layerDel);
    layerDel.appendChild(use);
    let id = toolsCounter;
    layer.addEventListener("click", (event) => layerOnclick(id, event));
    layersFooter.before(layer);
    tools[toolsCounter] = new activeTool(toolsCounter, toolsCanvas, masksContainer);
    activateLayer(toolsCounter);
    toolsCounter += 1;
}

function activateLayer(id) {
    let activeLayer = document.getElementById("layer_" + activeLayerId);
    if (activeLayer) {
        activeLayer.classList.remove("layer-active");
        document.querySelector(`#${activeToolName}`).classList.remove("tool-active");
    }
    if (tools[activeLayerId] && tools[activeLayerId].action) {
        elem = document.querySelector(`#${activeToolName} .${tools[activeLayerId].action}`)
        if (elem) {
            elem.classList.remove("active");
        }
    }
    let newActiveLayer = document.getElementById("layer_" + id)
    newActiveLayer.classList.add("layer-active");
    if (tools[activeLayerId]) {tools[activeLayerId].deactivate();}
    activeLayerId = id;
    tools[activeLayerId].activate();
    activeToolName = tools[activeLayerId].name;
    activeTool = toolDict[activeToolName];
    document.querySelector(`#${activeToolName}`).classList.add("tool-active");
    if (tools[activeLayerId].action) {
        document.querySelector(`#${activeToolName} .${tools[activeLayerId].action}`).classList.add("active");
    }
}

function deleteLayer(id) {
    if (activeLayerId == id) {
        let newId = Object.keys(tools)[0];
        if (newId) {activateLayer(newId);}
        console.log(newId);
    }
    tools[id].delete();
    delete tools[id];
    let layer = document.getElementById("layer_" + id);
    layersBar.removeChild(layer);     
}

function animate({timing, draw, duration, then}) {
    // Taken from http://learn.javascript.ru
    let start = performance.now();
    requestAnimationFrame(function animate(time) {
        // timeFraction изменяется от 0 до 1
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        // вычисление текущего состояния анимации
        let progress = timing(timeFraction);

        draw(progress); // отрисовать её

        if (timeFraction < 1) {
          requestAnimationFrame(animate);
        } else {
            if (then) {then();}
        }
    });
}

function linear(timeFraction) {
    return timeFraction;
}

function reverse(timing) {
    return function(timeFraction) {
        return timing(1 - timeFraction);
    }
}

function popupDraw(popupWindow, popupBack) {
    return function(progress) {
        if (progress > 0.5) {
            popupWindow.style.top = `${-20 * (2 - progress * 2)}px`;
            popupWindow.style.opacity = 2 * progress - 1;
        }
        if (progress < 0.5) {
            popupWindow.style.opacity = 0;
            popupBack.style.opacity = 2 * progress;
        }
    }
}

function showPopup(popup, popupWindow, popupBack) {
    popup.style.display = "";
    animate({
        timing: linear,
        draw: popupDraw(popupWindow, popupBack),
        duration: 300,
    });
}

function hidePopup(popup, popupWindow, popupBack) {
    animate({
        timing: reverse(linear),
        draw: popupDraw(popupWindow, popupBack),
        duration: 300,
        then: () => {popup.style.display = "none";}
    });
}

function showReadyPopup() {
    showPopup(readyPopup, readyPopupWindow, readyPopupBack);
}

function hideReadyPopup() {
    hidePopup(readyPopup, readyPopupWindow, readyPopupBack);
}

let successPopup = document.getElementById("successPopup");
let successPopupWindow = document.getElementById("successPopupWindow");
let successPopupBack = document.getElementById("successPopupBack");
let successCloseButton = document.getElementById("successPopupClose");
function showSuccessPopup() {
    showPopup(successPopup, successPopupWindow, successPopupBack);
}
function hideSuccessPopup() {
    hidePopup(successPopup, successPopupWindow, successPopupBack)
}

let errorPopup = document.getElementById("errorPopup");
let errorPopupWindow = document.getElementById("errorPopupWindow");
let errorPopupBack = document.getElementById("errorPopupBack");
let errorCloseButton = document.getElementById("errorPopupClose");
function showErrorPopup() {
    showPopup(errorPopup, errorPopupWindow, errorPopupBack);
}
function hideErrorPopup() {
    hidePopup(errorPopup, errorPopupWindow, errorPopupBack)
}


async function submit(signature) {
    console.log("submit")
    let flakeSVG = masksContainer.innerHTML;
    let formData = new FormData();
    formData.append("signature", signature);
    formData.append("snowflake", flakeSVG);
    let sendObject = {
        method: "POST",
        body: formData
    };
    await fetch("sendSnowflake", sendObject).then(submitSuccess).catch(err => submitError());
}

function submitSuccess() {
    hideReadyPopup();
    showSuccessPopup();
}

function submitError() {
    hideReadyPopup();
    showErrorPopup();
}

function makeActiveTool(toolName) {
    let tool = toolDict[toolName];
    if (tools[activeLayerId].action) {
        document.querySelector(`#${activeToolName} .${tools[activeLayerId].action}`).classList.remove("active");
    }
    let toolElem = document.getElementById(activeToolName);
    toolElem.classList.remove("tool-active");
    activeTool = tool;
    activeToolName = toolName;
    toolElem = document.getElementById(activeToolName);
    toolElem.classList.add("tool-active");
    if (!tools[activeLayerId]) {
        addLayer()
    } else if (tools[activeLayerId].isFinished) {
        addLayer()
    } else {
        tools[activeLayerId].delete();
        delete tools[activeLayerId];
        tools[activeLayerId] = new tool(activeLayerId, toolsCanvas, masksContainer)
    }
    if (tools[activeLayerId].action) {
        document.querySelector(`#${activeToolName} .${tools[activeLayerId].action}`).classList.add("active");
    }
}

function changeAction(action) {
    let tool = tools[activeLayerId];
    if (tool.action) {
        document.querySelector(`#${activeToolName} .${tool.action}`).classList.remove("active");
    }
    tools[activeLayerId].changeAction(action);
    document.querySelector(`#${activeToolName} .${tool.action}`).classList.add("active");
}