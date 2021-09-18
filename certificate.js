import VirtualCanvas from "./virtualCanvas.js";
import { map as objectMap } from "./_object.js";
export default function Certificate(src, { height = null, width = null }) {
    this.vC = new VirtualCanvas(null, null, src);
    this.mount = function (element) {
        const mount = () => {
            this.vC.resizeToImageOverlay({ width: width, height: height });
            this.vC.mount(element);
        }
        if (this.vC.imageOverlay == null)
            this.vC.onImageOverlayInitialized = mount
        else
            mount();
    }
    this.markers = {};
    this.addMarker = function (id) {
        let i = this.vC.addBox()
        this.markers[id] = i;
        let box = this.vC.getBox(i);
        let p = document.createElement("p");
        p.innerHTML = id;
        let div = document.createElement("div");
        Object.assign(div.style, {
            display: "flex",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
        });
        div.appendChild(p);
        box.append(div);
    }
    this.getMarkerGeometry = function (id) {
        return this.vC.getScaledBoxRect(this.markers[id]);
    }
    this.getAllMarkerGeometry = function () {
        return objectMap(this.markers, (v, k) => {
            return this.getMarkerGeometry(k);
        })
    }
}
