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
    }
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

        let mousemoveHandler =  (event) => _this.mousemove(_this, event);
        document.addEventListener("mousemove", mousemoveHandler);        
        document.addEventListener("mouseup", (event) => _this.mouseup(_this, event, mousemoveHandler), {once: true});

        this.node.dispatchEvent(new CustomEvent("draggablepoint-dragstart", {
            bubbles: true,
            detail: this.position
        }));
    }

    mouseup(_this, event, mousemoveHandler) {
        document.removeEventListener("mousemove", mousemoveHandler);

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
        this.canvas = toolCanvas;
        this.masksContainer = masksContainer;
        this.id = id;

        this.isDrag = false;
        this.r = 10
        this.points = [];

        this.shells = {};
        this.shells.root = addElement(this.canvas, "g", {id: `root_${this.id}`});
        this.shells.points = addElement(this.shells.root, "g", {id: `points_${this.id}`});
        this.shells.segments = addElement(this.shells.root, "g", {id: `segments_${this.id}`});

        let _this = this;
        this.mousedownHandler = (event) => {
            if (!_this.isDrag) {
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
        let point = new DraggablePoint(this.canvas, this.shells.points, position, {r: this.r})
        point.node.addEventListener("draggablepoint-dragstart", (event) => this.isDrag += 1);
        point.node.addEventListener("draggablepoint-dragend", (event) => this.isDrag -= 1);
        point.positionModifier = this.positionModifier();

        this.points.push(point);

        if (this.points.length >= 2) {
            let prePoint = this.points[this.points.length - 2];
            let segment = addElement(this.shells.segments, "line", {
                x2: point.position.x,
                y2: point.position.y,
                x1: prePoint.position.x,
                y1: prePoint.position.y,
                stroke: "black"
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
                stroke: "black"
            });
            point.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x2: event.detail.x, y2: event.detail.y}));
            prePoint.node.addEventListener("draggablepoint-move", 
                (event) => setProperties(segment, {x1: event.detail.x, y1: event.detail.y}));
            _this.canvas.removeEventListener("mousedown", _this.mousedownHandler);
            _this.createMask();
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
        for (let point of this.points) {
            point.node.addEventListener("draggablepoint-move", (event) => {
                setProperties(pathElem, {d: _this.calcPath()});
            })
        }
    }

    hide() {
        this.shells.root.setAttribute("visibility", "hidden");
    }

    show() {
        this.shells.root.setAttribute("visibility", "visible");
    }
}