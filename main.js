function makediv(classes = "") {
    var temp = document.createElement("div");
    temp.className = classes;
    return temp;
}

var config = document.getElementById("rules");
var step_forward = document.getElementById("step_forward");
var step_back = document.getElementById("step_back");
var initial_state = document.getElementById("initial");

initial_state.value = '0010111010';
// initial_state.value = '00100';
var start_state = parseInt(initial_state.value, 2);
var state_size = initial_state.value.length;
var rule = 110;
var rules = [];
var rules_div = document.getElementById("rules");
var rule_input = document.getElementById("rule_num")

var nodeSet = new Set([ start_state ]);
var edgeMap = new Map();
var nodes = new vis.DataSet([ {id : start_state} ]);
var edges = new vis.DataSet([]);

const padding = 5;
const square_size = 25;

function makeSVG(id){
    var content = "";
}

function render({ctx, id, x, y, state : {selected, hover}, style, label}) {
    return {
        drawNode() {
            let cx = (padding + square_size * state_size) / 2.0;
            let cy = (padding + square_size) / 2.0;
            // console.log(selected, hover, label, x, y);
            if (selected) {
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.ellipse(cx, cy, cx + 30, cy + 30, 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
            ctx.fillStyle = 'pink';
            ctx.fillRect(0, 0, 2 * padding + square_size * state_size,
                         2 * padding + square_size);
            for (var i = 0; i < state_size; ++i) {
                ctx.strokeRect(padding + square_size * i, padding + 0,
                               square_size, square_size);
                if (id & (1 << state_size - 1 - i)) {
                    ctx.fillStyle = 'white';
                } else {
                    ctx.fillStyle = 'black';
                }
                ctx.fillRect(padding + square_size * i, padding, square_size,
                             square_size);
            }
        },
        nodeDimensions : {
            width : 2 * padding + square_size * state_size,
            height : 2 * padding + square_size
        },
    };
}

var container = document.getElementById('playground');
var options = {
    nodes : {shape : 'custom', ctxRenderer : render, physics: true, mass: 1},
    edges : {arrows : 'to'}
};
var network =
    new vis.Network(container, {nodes : nodes, edges : edges}, options);

network.selectNodes([ start_state ]);

function computeNext(id) {
    var result = 0
    for (var i = 0; i < state_size; i++) {
        var left = !!(id & (1 << i + 1));
        var center = !!(id & (1 << i));
        var right = !!(id & (1 << i - 1));
        // console.log(i, left, center, right, (left << 2 | center << 1 | right),
        //             !!((1 << ((left << 2) | (center << 1) | right)) & rule));
        result |= (!!((1 << ((left << 2) | (center << 1) | right)) & rule))
                  << i;
    }
    return result;
}

step_forward.onclick = () => {
    var sel = network.getSelectedNodes();
    if (sel.length == 0) {
        return;
    }
    var id = sel[0];
    var next = computeNext(id);
    // console.log(id.toString(2), '->', next.toString(2));
    if (!nodeSet.has(next)) {
        nodes.add({id : next});
        nodeSet.add(next);
    }
    if (!edgeMap.has(id)) {
        edgeMap.set(id, new Set([ next ]));
        edges.add({from : id, to : next});
    } else if (!edgeMap.get(id).has(next)) {
        edgeMap.get(id).add(next);
        edges.add({from : id, to : next});
    }
    network.selectNodes([ next ]);
};

step_back.onclick = () => { console.log("TODO"); };

function reset() {
    nodeSet = new Set([ start_state ]);
    edgeMap = new Map();
    nodes = new vis.DataSet([ {id : start_state} ]);
    edges = new vis.DataSet([]);
    network.setData({nodes : nodes, edges : edges});
    network.selectNodes([ start_state ]);
}

function update_rule(newrule) {
    rule = newrule;
    for (var i = 0; i < 8; i++) {
        if (rule & (1 << 7 - i)) {
            rules[i].classList = "alive rule_button";
        } else {
            rules[i].classList = "dead rule_button";
        }
    }
    rule_input.value = newrule;
    reset();
}

rule_input.oninput = () => update_rule(rule_input.value);
initial_state.oninput = () => {
    start_state = parseInt(initial_state.value, 2);
    state_size = initial_state.value.length;
    reset();
};

for (var i = 0; i < 8; i++) {
    var current = makediv("rule");
    var ruleset = makediv("ruleset");
    var btn = makediv();
    for (var j = 0; j < 3; j++) {
        var box = makediv("square");
        if ((1 << 2 - j) & i) {
            box.classList.add("dead")
        } else {
            box.classList.add("alive")
        }
        ruleset.appendChild(box);
    }
    let index = i;
    btn.addEventListener("click", () => update_rule(rule ^ (1 << 7 - index)));

    rules.push(btn);
    current.appendChild(ruleset);
    current.appendChild(btn);
    rules_div.appendChild(current);
}
console.log(nodes);

update_rule(110);
