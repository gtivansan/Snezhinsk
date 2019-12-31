var svgNS = "http://www.w3.org/2000/svg";

function addElement(parent, tag, attrs={}, style={}) {
    let elem = document.createElementNS(svgNS, tag);
    setProperties(elem, attrs, style);
    parent.appendChild(elem);
    return elem;
}

function setProperties(elem, attrs={}, style={}) {
    for (let prop in style) {
        elem.style[prop] = style[prop];
    }
    for (let prop in attrs) {
        elem.setAttribute(prop, attrs[prop]);
    }
}

function getCoords(obj) {
    let box = obj.getBoundingClientRect();
    return {
        x: box.left + window.scrollX,
        y: box.top + window.scrollY
    }
}

function getSize(obj) {
    let box = obj.getBoundingClientRect();
    return {
        width: box.width,
        height: box.height
    };
}

function complexMul(a, b) {
    return {
        x: a.x * b.x - a.y * b.y,
        y: a.x * b.y + a.y * b.x
    };
}

function complexSub(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

function complexAdd(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}

function complexNorm(a) {
    return a.x * a.x + a.y * a.y;
}

function complexModule(a) {
    return Math.pow(complexNorm(a), 0.5);
}

function complexAngle(a) {
    let ang = Math.acos(a.x / complexModule(a));
    if (a.y < 0) {
        ang = 2 * Math.PI - ang;
    }
    return ang;
}

function complexDiv(a, b) {
    let bNorm = (b.x * b.x + b.y * b.y);
    let _b = {
        x: b.x / bNorm,
        y: - b.y / bNorm
    }
    return complexMul(a, _b);
}

class DraggablePoint {
    constructor(canvas, parent, position, attrs, style={}) {
        this.canvas = canvas;
        this.parent = parent;
        this.position = position;

        this.node = addElement(parent, "circle", attrs, style);
        this.node.addEventListener("mousedown", (event) => this.mousedown(this, event));
        this.node.ondragstart = function() {
            return false;
        };
        this.moveTo(this.position);
    }

    mousedown(_this, event) {
        _this.startMousePosition = {
            x: event.pageX, 
            y: event.pageY
        };
        _this.startPointPosition = _this.position;
        document.body.setAttribute("onselectstart", "return false");
        document.body.style["user-select"]="none";

        let mousemoveHandler =  (event) => _this.mousemove(_this, event);
        document.addEventListener("mousemove", mousemoveHandler);        
        document.addEventListener("mouseup", (event) => _this.mouseup(_this, event, mousemoveHandler), {once: true});

        this.node.dispatchEvent(new CustomEvent("draggablepoint-dragstart", {
            bubbles: true,
            detail: this.position
        }));

        return false;
    }

    mouseup(_this, event, mousemoveHandler) {
        document.removeEventListener("mousemove", mousemoveHandler);
        document.body.removeAttribute("onselectstart");
        document.body.style["user-select"]="";

        this.node.dispatchEvent(new CustomEvent("draggablepoint-dragend", {
            bubbles: true,
            detail: this.position
        }));
    }

    mousemove(_this, event) {
        let mouseShift = {
            x: event.pageX - _this.startMousePosition.x, 
            y: event.pageY - _this.startMousePosition.y
        };
        let newPointPosition = {
            x: _this.startPointPosition.x + mouseShift.x,
            y: _this.startPointPosition.y + mouseShift.y
        };


        _this.moveTo(newPointPosition);
    }

    positionModifier(position) {
        let modifiedPosition = position;
        return modifiedPosition;
    }

    moveTo(position) {
        this.position = this.positionModifier(position);
        // console.log(this.positionModifier, this.positionModifier({x: 10, y: 10}))
        setProperties(this.node, 
            {
                cx: this.position.x,
                cy: this.position.y
            })
        this.node.dispatchEvent(new CustomEvent("draggablepoint-move", {
            bubbles: true,
            detail: this.position
        }));
    }
}

class ToolChain {
    constructor(id, toolCanvas, masksContainer) {
        this.name = "toolChain"
        this.canvas = toolCanvas;
        this.masksContainer = masksContainer;
        this.id = id;

        this.isActive = true;
        this.isFinished = false;
        this.r = 10;
        this.points = [];

        this.shells = {};
        this.shells.root = addElement(this.canvas, "g", {id: `root_${this.id}`});
        this.shells.segments = addElement(this.shells.root, "g", {id: `segments_${this.id}`});
        this.shells.points = addElement(this.shells.root, "g", {id: `points_${this.id}`});

        let _this = this;
        this.mousedownHandler = (event) => {
            if (event.target.tagName != "circle" && event.which == 1 && _this.isActive) {
                _this.addPoint({
                    x: event.pageX - getCoords(_this.canvas).x, 
                    y: event.pageY - getCoords(_this.canvas).y
                });
            }
        }
        this.canvas.addEventListener("mousedown", this.mousedownHandler);
    }

    positionModifier() {
        let _this = this;
        return function(position) {
            return {
                x: Math.min(getSize(_this.canvas).width - _this.r, Math.max(_this.r, position.x)), 
                y: Math.min(getSize(_this.canvas).height - _this.r, Math.max(_this.r, position.y))
            }
        }
    }

    addPoint(position) {
        position = this.positionModifier()(position);
        let point = new DraggablePoint(this.canvas, this.shells.points, position, {r: this.r}, {fill: "#4e4e4e"})
        point.positionModifier = this.positionModifier();

        this.points.push(point);

        if (this.points.length >= 2) {
            let prePoint = this.points[this.points.length - 2];
            let segment = addElement(this.shells.segments, "line", {
                x2: point.position.x,
                y2: point.position.y,
                x1: prePoint.position.x,
                y1: prePoint.position.y,
                stroke: "grey"
            });
            point.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x2: event.detail.x, y2: event.detail.y}));
            prePoint.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x1: event.detail.x, y1: event.detail.y}));
        } else {
            let _this = this;
            point.node.addEventListener("mousedown", (event) => {

            // if (_this.points.length >= 3) 
            // {
            let point = _this.points[0];
            let prePoint = _this.points[_this.points.length - 1];
            let segment = addElement(_this.shells.segments, "line", {
                x2: point.position.x,
                y2: point.position.y,
                x1: prePoint.position.x,
                y1: prePoint.position.y,
                stroke: "grey"
            });
            point.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x2: event.detail.x, y2: event.detail.y}));
            prePoint.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x1: event.detail.x, y1: event.detail.y}));
            _this.canvas.removeEventListener("mousedown", _this.mousedownHandler);
            _this.createMask();
            _this.isFinished = true;
            _this.canvas.dispatchEvent(new CustomEvent("toolchain-end", {detail: {id: _this.id}}));
            // }

            }, {once: true});
        }
    }

    calcPath() {
        let path = "";
        for (let point of this.points) {
            path += `L ${point.position.x} ${point.position.y} `
        }
        path = "M" + path.substr(1);
        return path; 
    }

    createMask() {
        let _this = this;
        let pathElem = addElement(this.masksContainer, "path", {d: this.calcPath()});
        this.pathElem = pathElem;
        for (let point of this.points) {
            point.node.addEventListener("draggablepoint-move", (event) => {
                setProperties(pathElem, {d: _this.calcPath()});
            })
        }
    }

    deactivate() {
        this.isActive = false;
        this.shells.root.setAttribute("visibility", "hidden");
    }

    activate() {
        this.isActive = true;
        this.shells.root.setAttribute("visibility", "visible");
    }

    delete() {
        this.canvas.removeEventListener("mousedown", this.mousedownHandler);
        if (this.pathElem) {this.masksContainer.removeChild(this.pathElem);}
        this.canvas.removeChild(this.shells.root);
    }
}

class ToolBezier {
    constructor(id, toolCanvas, masksContainer) {
        this.name="toolBezier";
        this.canvas = toolCanvas;
        this.masksContainer = masksContainer;
        this.id = id;

        this.isActive = true;
        this.isFinished = false;
        this.r = 10;
        this.cr = 6;
        this.points = [];
        this.controlPoints = [];

        this.shells = {};
        this.shells.root = addElement(this.canvas, "g", {id: `root_${this.id}`});
        this.shells.paths = addElement(this.shells.root, "g", {id: `paths_${this.id}`});
        this.shells.points = addElement(this.shells.root, "g", {id: `points_${this.id}`});

        let _this = this;
        this.mousedownHandler = (event) => {
            if (event.target.tagName != "circle" && event.which == 1 && _this.isActive) {
                _this.addPoint({
                    x: event.pageX - getCoords(_this.canvas).x, 
                    y: event.pageY - getCoords(_this.canvas).y
                });
            }
        }
        this.canvas.addEventListener("mousedown", this.mousedownHandler);
    }

    positionModifier() {
        let _this = this;
        return function(position) {
            return {
                x: Math.min(getSize(_this.canvas).width - _this.r, Math.max(_this.r, position.x)), 
                y: Math.min(getSize(_this.canvas).height - _this.r, Math.max(_this.r, position.y))
            }
        }
    }

    createPoint(position, attrs, style) {
        position = this.positionModifier()(position);
        let point = new DraggablePoint(this.canvas, this.shells.points, position, attrs, style)
        point.positionModifier = this.positionModifier();
        return point;
    }

    createPath(point, prePoint) {
        let position = point.position;
        let prePosition = prePoint.position;
        let ctrlPositin1 = {x: (prePosition.x * 2 + position.x) / 3,
                            y: (prePosition.y * 2 + position.y) / 3};
        let ctrlPositin2 = {x: (prePosition.x + position.x * 2) / 3,
                            y: (prePosition.y + position.y * 2) / 3};
        let ctrlPoint1 = this.createPoint(ctrlPositin1, {r: this.cr}, {fill: "#4e4e4e"});
        let ctrlPoint2 = this.createPoint(ctrlPositin2, {r: this.cr}, {fill: "#4e4e4e"});
        this.controlPoints.push(ctrlPoint1);
        this.controlPoints.push(ctrlPoint2);
        function pathStr(pp, cp1, cp2, p) {
            return `M ${pp.x} ${pp.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p.x} ${p.y}`;
        }
        let path = addElement(this.shells.paths, "path", {
            d: pathStr(prePosition, ctrlPositin1, ctrlPositin2, position),
            stroke: "grey",
            fill: "transparent"
        })
        function pMoveHandler() {
            let p = point.startPointPosition;
            let pp = prePoint.position;
            let np = point.position;
            let cp1 = ctrlPoint1._startPointPosition;
            let cp2 = ctrlPoint2._startPointPosition;
            let gomotet = complexDiv(complexSub(np, pp), complexSub(p, pp));
            let ncp1 = complexAdd(pp, complexMul(complexSub(cp1, pp), gomotet));
            let ncp2 = complexAdd(pp, complexMul(complexSub(cp2, pp), gomotet));
            ctrlPoint1.moveTo(ncp1);
            ctrlPoint2.moveTo(ncp2);
            setProperties(path, {d: pathStr(prePoint.position, ctrlPoint1.position, 
                ctrlPoint2.position, point.position)})
        }
        function ppMoveHandler() {
            let p = point.position;
            let pp = prePoint.startPointPosition;
            let npp = prePoint.position;
            let cp1 = ctrlPoint1._startPointPosition;
            let cp2 = ctrlPoint2._startPointPosition;
            let gomotet = complexDiv(complexSub(npp, p), complexSub(pp, p));
            let ncp1 = complexAdd(p, complexMul(complexSub(cp1, p), gomotet));
            let ncp2 = complexAdd(p, complexMul(complexSub(cp2, p), gomotet));
            ctrlPoint1.moveTo(ncp1);
            ctrlPoint2.moveTo(ncp2);
            setProperties(path, {d: pathStr(prePoint.position, ctrlPoint1.position, 
                ctrlPoint2.position, point.position)})
        }
        function ctrlMoveHandler() {
            setProperties(path, {d: pathStr(prePoint.position, ctrlPoint1.position, 
                ctrlPoint2.position, point.position)})
        }
        point.node.addEventListener("draggablepoint-move", pMoveHandler);
        point.node.addEventListener("draggablepoint-dragstart", () => {
            ctrlPoint1._startPointPosition = ctrlPoint1.position;
            ctrlPoint2._startPointPosition = ctrlPoint2.position;
        })
        prePoint.node.addEventListener("draggablepoint-move", ppMoveHandler);
        prePoint.node.addEventListener("draggablepoint-dragstart", () => {
            ctrlPoint1._startPointPosition = ctrlPoint1.position;
            ctrlPoint2._startPointPosition = ctrlPoint2.position;
        })
        ctrlPoint1.node.addEventListener("draggablepoint-move", ctrlMoveHandler);
        ctrlPoint2.node.addEventListener("draggablepoint-move", ctrlMoveHandler);
    }

    addPoint(position) {
        let point = this.createPoint(position, {r: this.r}, {fill: "#4e4e4e"});
        this.points.push(point);

        if (this.points.length >= 2) {
            let prePoint = this.points[this.points.length - 2];
            this.createPath(point, prePoint);
        } else {
            let _this = this;
            point.node.addEventListener("mousedown", (event) => {

            // if (_this.points.length >= 3) 
            // {
            let point = _this.points[0];
            let prePoint = _this.points[_this.points.length - 1];
            _this.createPath(point, prePoint)
            _this.canvas.removeEventListener("mousedown", _this.mousedownHandler);
            _this.createMask();
            _this.isFinished = true;
            _this.canvas.dispatchEvent(new CustomEvent("toolbezier-end", {detail: {id: _this.id}}));
            // }

            }, {once: true});
        }
    }

    calcPath() {
        let path = ""
        for (let i = 0; i < this.points.length; i++) {
            let cp1 = this.controlPoints[2 * i].position;
            let cp2 = this.controlPoints[2 * i + 1].position;
            let p = this.points[(i + 1) % this.points.length].position;
            path += `C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p.x} ${p.y}`
        }
        return `M ${this.points[0].position.x} ${this.points[0].position.y} ` + path;
    }

    createMask() {
        let _this = this;
        let pathElem = addElement(this.masksContainer, "path", {d: this.calcPath()});
        this.pathElem = pathElem;
        for (let point of this.points) {
            point.node.addEventListener("draggablepoint-move", (event) => {
                setProperties(pathElem, {d: _this.calcPath()});
            })
        }
        for (let point of this.controlPoints) {
            point.node.addEventListener("draggablepoint-move", (event) => {
                setProperties(pathElem, {d: _this.calcPath()});
            })
        }
    }

    deactivate() {
        this.isActive = false;
        this.shells.root.setAttribute("visibility", "hidden");
    }

    activate() {
        this.isActive = true;
        this.shells.root.setAttribute("visibility", "visible");
    }

    delete() {
        this.canvas.removeEventListener("mousedown", this.mousedownHandler);
        if (this.pathElem) {this.masksContainer.removeChild(this.pathElem);}
        this.canvas.removeChild(this.shells.root);
    }
}

class ToolStencil {
    constructor(id, toolCanvas, masksContainer, stencil) {
        this.canvas = toolCanvas;
        this.masksContainer = masksContainer;
        this.id = id;
        this.stencil = stencil;

        this.isActive = true;
        this.isFinished = false;
        this.action = "";
        this.translate = {x:0, y:0};
        this.scale = 1;
        this.rotate = 0;

        this.shells = {};
        this.shells.root = addElement(this.canvas, "g", {id: `root_${this.id}`});

        let _this = this;
        this.mousedownHandler = (event) => {
            console.log(this.id)
            _this.addStencil({
                x: event.pageX - getCoords(_this.canvas).x, 
                y: event.pageY - getCoords(_this.canvas).y
            });
            this.isFinished = true;
        }
        this.canvas.addEventListener("mousedown", this.mousedownHandler, {once: true});

        this.handler = (event) => this.mousedown(this, event)
        this.canvas.addEventListener("mousedown", this.handler);
    }

    mousedown(_this, event) {
        _this.startMousePosition = {
            x: event.pageX - getCoords(_this.canvas).x, 
            y: event.pageY - getCoords(_this.canvas).y
        }; 
        _this.startTranslate = _this.translate;
        _this.startRotate = _this.rotate;
        _this.startScale = _this.scale;

        document.body.setAttribute("onselectstart", "return false");
        document.body.style["user-select"]="none";

        let mousemoveHandler =  (event) => _this.mousemove(_this, event);
        document.addEventListener("mousemove", mousemoveHandler);        
        document.addEventListener("mouseup", (event) => _this.mouseup(_this, event, mousemoveHandler), {once: true});
    }

    mouseup(_this, event, mousemoveHandler) {
        document.removeEventListener("mousemove", mousemoveHandler);
        document.body.removeAttribute("onselectstart");
        document.body.style["user-select"]="";

    }

    mousemove(_this, event) {
        let mousePosition = {
            x: event.pageX - getCoords(_this.canvas).x,
            y: event.pageY - getCoords(_this.canvas).y
        }
        let mouseShift = complexSub(mousePosition, this.startMousePosition);

        if (this.action == "translate") {
            this.actionTranslate(mouseShift);
        }
        if (this.action == "rotate") {
            let angle = complexAngle(complexDiv(complexSub(mousePosition, this.translate),
                complexSub(this.startMousePosition, this.translate)));
            this.actionRotate(angle * 180 / Math.PI);
        }
        if (this.action == "scale") {
            let k = complexModule(complexSub(mousePosition, this.translate)) / 
                complexModule(complexSub(this.startMousePosition, this.translate));
            this.actionScale(k);
        }
    }

    addStencil(position) {
        this.elemTranslate = addElement(this.masksContainer, "g");
        this.elemRotate = addElement(this.elemTranslate, "g");
        this.elemScale = addElement(this.elemRotate, "g");
        this.elemScale.innerHTML = this.stencil;

        this.elemVisTranslate = addElement(this.shells.root, "g");
        this.elemVisRotate = addElement(this.elemVisTranslate, "g");
        this.elemVisScale = addElement(this.elemVisRotate, "g");
        this.elemVisScale.innerHTML = this.stencil;
        this.elemVisTranslate.setAttribute("fill", "transparent");
        this.elemVisTranslate.setAttribute("stroke", "grey");
        this.elemVisTranslate.setAttribute("stroke-width", 1);
        this.elemVisTranslate.setAttribute("stroke-dasharray", 4);

        this.doTranslate(position);
    }

    changeAction(action) {
        this.action = action;
    }

    doTranslate(vector) {
        let newTranslate = {
            x: this.translate.x + vector.x,
            y: this.translate.y + vector.y
        }
        this.translate = newTranslate;
        this.elemTranslate.setAttribute("transform", `translate(${newTranslate.x}, ${newTranslate.y})`);
        this.elemVisTranslate.setAttribute("transform", `translate(${newTranslate.x}, ${newTranslate.y})`);
    }

    doRotate(angle) {
        let newRotate = angle + this.rotate;
        this.rotate = newRotate;
        this.elemRotate.setAttribute("transform", `rotate(${newRotate})`);
        this.elemVisRotate.setAttribute("transform", `rotate(${newRotate})`);
    }

    doScale(k) {
        let newScale = k * this.scale;
        this.scale = newScale;
        this.elemScale.setAttribute("transform", `scale(${newScale})`);
        this.elemVisScale.setAttribute("transform", `scale(${newScale})`);
    }

    actionTranslate(mouseShift) {
        if (this.isActive) {
            this.translate = this.startTranslate;
            this.doTranslate(mouseShift);
        }
    }

    actionRotate(angle) {
        if (this.isActive) {
            this.rotate = this.startRotate;
            this.doRotate(angle);
        }
    }

    actionScale(k) {
        if (this.isActive) {
            this.scale = this.startScale;
            this.doScale(k);
        }
    }

    deactivate() {
        this.isActive = false;
        this.shells.root.setAttribute("visibility", "hidden");
        if (!this.isFinished) {
            console.log("yyy", this.id)
            this.canvas.removeEventListener("mousedown", this.mousedownHandler);
        }
    }

    activate() {
        this.isActive = true;
        this.shells.root.setAttribute("visibility", "visible");
        if (!this.isFinished) {
            this.canvas.addEventListener("mousedown", this.mousedownHandler, {once: true});
        }
    }

    delete() {
        if (this.isFinished) {
            this.masksContainer.removeChild(this.elemTranslate);
        }
        this.canvas.removeChild(this.shells.root);
        this.canvas.removeEventListener("mousedown", this.mousedownHandler);
        this.canvas.removeEventListener("mousedown", this.handler);
    }
}

class StencilStar extends ToolStencil {
    constructor(id, toolCanvas, masksContainer) {
        console.log("KEK");
        let stensil = `
            <path d="M -80 0 L -20 20 L 0 80 L 20 20 L 80 0 L 20 -20 L 0 -80 L -20 -20 Z"/>
        `
        super(id, toolCanvas, masksContainer, stensil);
        this.name = "stencilStar";
    }
}

class StencilChristmasTree extends ToolStencil {
    constructor(id, toolCanvas, masksContainer) {
        let stensil = `
            <path d="M 5 54 L 5 40 L 40 40 L 14 18 L 28 18 L 14 -2 L 20 -2 L 0 -48 
                    L -20 -2 L -14 -2 L -28 18 L -14 18 L -40 40 L -5 40 L -5 54 Z "/>
        `
        super(id, toolCanvas, masksContainer, stensil);
        this.name = "stencilChristmasTree";
    }
}

class StencilCircle extends ToolStencil {
    constructor(id, toolCanvas, masksContainer) {
        let stensil = `
            <circle cx="0" cy="0" r="80"/>
        `
        super(id, toolCanvas, masksContainer, stensil);
        this.name = "stencilCircle";
    }
}


class StencilSnowflake extends ToolStencil {
    constructor(id, toolCanvas, masksContainer) {
        let stensil = `
            <path d="M 11 80 L 11 60 L 26 68 L 33 55 L 12 42 L 12 13 L 35 27 L 35 53 L 50 54
            L 50 37 L 68 47 L 74 33 L 59 24 L 73 14 L 67 3 L 43 15 L 19 1 L 43 -14 
            L 65 -2 L 74 -15 L 60 -22 L 75 -33 L 69 -46 L 50 -36 L 50 -54 L 36 -54
            L 36 -27 L 12 -13 L 12 -43 L 34 -55 L 26 -68 L 12 -60 L 11 -80

            L -1 -80 L -2 -60 L -16 -68 L -24 -55 L -2 -43 L -2 -13 L -26 -27
            L -26 -54 L -40 -54 L -40 -36 L -59 -46 L -65 -33 L -50 -22 L -64 -15 L -55 -2
            L -33 -14 L -9 1 L -33 15 L -57 3 L -63 14 L -49 24 L -64 33 L -58 47 L -40 37
            L -40 54 L -25 53 L -25 27 L -2 13 L -2 42 L -23 55 L -16 68 L -1 60 L -1 80 Z">
        `
        super(id, toolCanvas, masksContainer, stensil);
        this.name = "stencilSnowflake";
    }
}
