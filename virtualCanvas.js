import interact from 'https://cdn.interactjs.io/v1.9.20/interactjs/index.js';
import { filter as objectFilter, map as objectMap } from './_object.js';
let VirtualCanvas = (function () {
    function Element(type, style) {
        this.element = document.createElement(type);
        Object.assign(this.element.style, style);
        this.permittedStyles = null;
        this._x = this.element.offsetLeft;
        this._y = this.element.offsetTop;
        Object.defineProperties(this, {
            height: {
                get: function () {
                    return this.element.getBoundingClientRect().height;
                },
                set: function (height) {
                    this.element.style.height = height;
                }
            },
            width: {
                get: function () {
                    return this.element.getBoundingClientRect().width;
                },
                set: function (width) {
                    this.element.style.width = width;
                }
            },
            x: {
                get: function () {
                    //     return this.element.offsetLeft;
                    return this._x;
                },
                set: function (x) {
                    this._x = Math.round(x);
                    this.element.style.left = this._x + "px";

                }
            },
            y: {
                get: function () {
                    //    return this.element.offsetTop;
                    return this._y;
                },
                set: function (y) {
                    this._y = Math.round(y);
                    this.element.style.top = this._y + "px";
                }
            }
        });
        this.getRect = function () {
            return {
                x: this.x,
                y: this.y,
                height: this.height,
                width: this.width
            }
        }
        this.appendOn = function (element) {
            if (!(element instanceof HTMLElement))
                throw new Error("Arguments must be HTMLElement");
            element.append(this.element);
        }
        this.append = function (element) {
            if (!(element instanceof HTMLElement))
                throw new Error("Arguments must be HTMLElement");
            this.element.append(element);
        }
        this.updateStyle = function (style) {
            let st = Array.isArray(this.permittedStyles) ? objectFilter(style, (val, k) => this.permittedStyles.includes(k)) : style;
            Object.assign(this.element.style, st);
        }
        this.resize = function (size) {
            if (typeof size !== "object")
                throw new Error("Size should be a object");
            size.width && (this.element.style.width = size.width + "px");
            size.height && (this.element.style.height = size.height + "px");
        };
        this.enableDrag = function () {
            const _this = this;
            interact(this.element).draggable({
                listeners: {
                    start(event) {
                    },
                    move(event) {
                        _this.x += event.dx;
                        _this.y += event.dy;

                    },
                },
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ]
            })
        }
        this.disableDrag = function () {
            interact(this.element).draggable(false);
        }
        this.isDraggable = function () {
            return interact(this.element).draggable();
        }
        this.enableResize = function () {
            const _this = this;
            interact(this.element)
                .resizable({
                    edges: { top: true, left: true, bottom: true, right: true },
                    listeners: {
                        move: function (event) {
                            _this.width = event.rect.width;
                            _this.height = event.rect.height;
                            _this.x += event.deltaRect.left;
                            _this.y += event.deltaRect.top;
                        }
                    },
                    modifiers: [
                        interact.modifiers.restrictSize({
                            min: { width: 10, height: 10 },
                        })
                    ]
                })
        }
        this.disableResize = function () {
            interact(this.element).resizable(false);
        }
        this.isResizable = function () {
            return interact(this.element).resizable();
        }

    }
    function VirtualCanvas(size, style, imageOverlay) {
        Element.call(this, "div", {
            position: "relative",
            backgroundColor: style?.backgroundColor,
            width: size?.width ?? 100 + "px",
            height: size?.height ?? 100 + "px",
            overflow: "hidden"
        });
        this.permittedStyles = ["backgroundColor"];
        this.boxes = [];
        this.imageOverlay = null;
        this.addBox = function () {
            let box = new Box();
            box.updateStyle({ zIndex: this.boxes.length + 1 });
            box.enableDrag();
            box.enableResize();
            box.appendOn(this.element);
            return this.boxes.push(box) - 1;
        }
        this.getBox = function (index) {
            if (typeof index !== "number")
                throw new Error("index should be a number");
            return (index < 0 && index > this.boxes.length) ? null : this.boxes[index];
        }
        this.getBoxRect = function (index) {
            let box = this.getBox(index);
            if (box)
                return box.getRect();
        }
        this.getScaledBoxRect = function (index) {
            let box = this.getBox(index);
            if (box)
                return this.getScaledRect(box);
        }
        this.getScaledRect = function (Element) {
            return objectMap(Element.getRect(), (v, k) => {
                return Math.round((k == "width" || k == "x") ? v * this.imageOverlay.yFactor : v * this.imageOverlay.xFactor);
            })
        }
        this.onImageOverlayInitialized_ = () => { };
        Object.defineProperties(this, {
            onImageOverlayInitialized: {
                set: function (func) {
                    if (typeof func === "function")
                        this.onImageOverlayInitialized_ = func;
                },
            },
        });
        this.setimageOverlay = function (src) {
            this.imageOverlay = null;
            if (src)
                initializeImage(src)
                    .then((img) => {
                        this.imageOverlay = img;
                        this.onImageOverlayInitialized_();
                        this.append(img.element);
                        this.imageOverlayResize("fit");
                    })
                    .catch((e) => {
                        console.error("Cannot set imageOverlay");
                        console.error(e);
                    });

        };
        this.imageOverlayResize = function (mode) {
            if (mode === "fit") {
                this.imageOverlay.resize({ width: this.width, height: this.height });
            }
        };
        this.resizeToImageOverlay = function ({
            width = null,
            height = null,
        } = {}) {
            let size;
            if (width) {
                size = {
                    width: width,
                    height: Math.round(width / this.imageOverlay.aspectRatio),
                };
            } else if (height) {
                size = {
                    width: Math.round(height * this.imageOverlay.aspectRatio),
                    height: height,
                };
            } else {
                size = {
                    width: this.imageOverlay.width,
                    height: this.imageOverlay.height,
                };
            }
            this.imageOverlay.resize(size);
            this.resize(size);
        };
        this.mount = function (element) {
            this.appendOn(element);
        };
        if (typeof imageOverlay === "string")
            this.setimageOverlay(imageOverlay);
    }
    //Box
    function Box(style) {
        this.permittedStyles = ["height", "width", "backgroundColor", "zIndex"]
        Element.call(this, "div", {
            position: "absolute",
            backgroundColor: "rgba(0,0,0,0.5)",
            width: "100px",
            height: "50px",
            touchAction: "none",
            boxSizing: "border-box",
            overflow: "hidden"
        });
        if (style) {
            let st = {};
            style.height && (st.height = style.height);
            style.width && (st.width = style.width);
            style.zIndex && (st.zIndex = style.zIndex);
            this.updateStyle(st);
        }

    }

    //Image
    function Image_(src) {
        Element.call(this, "img", {
            position: "absolute",
            zIndex: -1
        });
        this.element.src = src;
        this.show = function () {
            this.updateStyle({ visibility: "visible" });
        };
        this.hide = function () {
            this.updateStyle({ visibility: "hidden" });
        };
    }
    Object.defineProperties(Image_.prototype, {
        aspectRatio: {
            get: function () {
                return this.element.naturalWidth / this.element.naturalHeight;
            }

        },
        xFactor: {
            get: function () {
                return this.element.naturalHeight / this.height
            }
        },
        yFactor: {
            get: function () {
                return this.element.naturalWidth / this.width;
            }
        }
    });
    async function initializeImage(imageSrc) {
        return new Promise((res, rej) => {
            let img = new Image_(imageSrc);
            img.element.addEventListener(
                "load",
                (e) => {
                    img.naturalHeight = e.target.naturalHeight;
                    img.naturalWidth = e.target.naturalWidth;
                    res(img);
                },
                { once: true }
            );
            img.element.addEventListener(
                "error",
                (e) => {
                    rej(e);
                },
                { once: true }
            );
        });

    }
    return VirtualCanvas;
})();
export default VirtualCanvas;