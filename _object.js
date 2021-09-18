let filter = (obj, predicate) => {
    return Object.keys(obj).filter((key) => predicate(obj[key], key, obj)).reduce((acc, k) => {
        acc[k] = obj[k];
        return acc;
    }, {});
}
let map = (obj, cb) => {
    return Object.entries(obj).reduce((acc, [k, v]) => {
        acc[k] = cb(v, k, obj);
        return acc;
    }, {});;
}
let mapKey = (obj, cb) => {
    return Object.entries(obj).reduce((acc, [k, v]) => {
        acc[cb(k, obj)] = v;
        return acc;
    }, {});;
}
export { filter, map, mapKey };
