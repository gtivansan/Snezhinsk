let toolsCanvas = document.getElementById("tools");
let flakerawCanvas = document.getElementById("flakeraw");
let masksContainer = document.getElementById("masksContainer");
let layersBar = document.getElementById("layersBar");
let layersFooter = document.getElementById("layersFooter");
let readyButton = document.getElementById("ready");
let readyPopup = document.getElementById("readyPopup");
let readyCloseButton = document.getElementById("readyPopupClose");
let readyPopupWindow = document.getElementById("readyPopupWindow");
let readyPopupBack = document.getElementById("readyPopupBack");
let inputSignature = document.getElementById("inputSignature");

let tools = {};
let activeLayerId = 0;
let toolsCounter = 0;

layersFooter.addEventListener("click", addLayer);
readyButton.addEventListener("click", showReadyPopup);
readyCloseButton.addEventListener("click", hideReadyPopup);
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
    tools[toolsCounter] = new ToolChain(toolsCounter, toolsCanvas, masksContainer);
    activateLayer(toolsCounter);
    toolsCounter += 1;
}

function activateLayer(id) {
    let activeLayer = document.getElementById("layer_" + activeLayerId);
    if (activeLayer) {activeLayer.classList.remove("layer-active");}
    let newActiveLayer = document.getElementById("layer_" + id)
    newActiveLayer.classList.add("layer-active");
    if (tools[activeLayerId]) {tools[activeLayerId].deactivate();}
    activeLayerId = id;
    tools[activeLayerId].activate();
}

function deleteLayer(id) {
    tools[id].delete();
    delete tools[id];
    if (activeLayerId == id) {
        let newId = Object.keys(tools)[0];
        if (newId) {activateLayer(newId);}
        console.log(newId);
    }
    let layer = document.getElementById("layer_" + id);
    layersBar.removeChild(layer);     
}

function showReadyPopup() {
    readyPopup.style.display = "";
    readyPopupWindow.classList.add("popup-window-animated");
    readyPopupBack.classList.add("popup-back-animated");
}

function hideReadyPopup() {
    readyPopupWindow.classList.remove("popup-window-animated");
    readyPopupBack.classList.remove("popup-back-animated");
    setTimeout(function() {
        readyPopupWindow.classList.add("popup-window-reverse-animated");
        readyPopupBack.classList.add("popup-back-reverse-animated");
    }, 1);
    setTimeout(function() {
        readyPopup.style.display = "none";
        readyPopupWindow.classList.remove("popup-window-reverse-animated");
        readyPopupBack.classList.remove("popup-back-reverse-animated");
    }, 700)
}

async function submit(signature) {
    let flakeSVG = masksContainer.innerHTML;
    let formData = new FormData();
    formData.append("signature", signature);
    formData.append("snowflake", flakeSVG);
    let sendObject = {
        method: "POST",
        body: formData
    };
    await fetch("send_flake", sendObject).then(submitSuccess).catch(err => submitError());
}

function submitSuccess() {

}

function submitError() {
}