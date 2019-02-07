const app = require('express')();


// Takes a (list of objects, and a string) containing the path to the value you want to sort by, and returns a sorted list of objects
/*
sortObjectsByValue(
    [
        {A: {B: {C: "val2"}}},
        {A: {B: {C: "val1"}}},
    ],
    "A.B.C",
);

*/
exports.sortObjectsByValue = (list, val_path) => {
    const drill = (obj, val_path) => val_path.split('.').reduce((o, v) => o[v], obj);
    return list.sort((a, b) => drill(a, val_path).localeCompare(drill(b, val_path)));
}