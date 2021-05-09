function makediv(classes = "") {
    var temp = document.createElement("div");
    temp.className = classes;
    return temp;
}

var config = document.getElementById("rules");
var step_forward = document.getElementById("step_forward");
var step_back = document.getElementById("step_back");
var initial_state = document.getElementById("initial");

initial_state.value = '1101001';
var start_state = parseInt(initial_state.value, 2);
var state_size = initial_state.value.length;
var rule = 110;
var rules = [];
var rules_div = document.getElementById("rules");
var rule_input = document.getElementById("rule_num")

function makeNode(id, bgcolor = "grey") {
    return {
        id : id,
        image : {
            selected : renderNode(id, bgcolor, true),
            unselected : renderNode(id, bgcolor)
        }
    };
}

var nodes = new vis.DataSet([ makeNode(start_state) ]);
var edges = new vis.DataSet([]);
var edgeMap = new Map();

function renderNode(id, bgcolor, selected = false) {
    const padding = 3;
    const square_size = 25;
    var w = square_size * state_size + 2 * padding;
    var h = square_size + 2 * padding;
    var background = bgcolor;
    if (selected) {
        background = "brown";
    }

    var content =
        `<rect x="0" y="0" width="${w}" height="${h}" fill="${background}"/>`;
    for (var i = 0; i < state_size; i++) {
        var color = "black";
        if (id & (1 << state_size - 1 - i)) {
            color = "white"
        }
        content +=
            `<rect x="${padding + square_size * i + 1}" y="${padding + 1}"
        width="${square_size - 2}" height="${square_size - 2}" fill="${
                color}"/>`;
    }
    var svg = `<svg width="${w}" height="${h}"
    xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

var container = document.getElementById('playground');
var options = {
    nodes : {shape : 'image', mass : 4},
    edges : {arrows : 'to', chosen : false}
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
        result |= (!!((1 << ((left << 2) | (center << 1) | right)) & rule))
                  << i;
    }
    return result;
}

function computePrevious(id) {
    var result = [];
    for (var i = 0; i < 2 ** state_size; i++) {
        if (computeNext(i) == id) {
            result.push(i);
        }
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
    if (!nodes.get(next)) {
        nodes.add(makeNode(next));
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

step_back.onclick = () => {
    var sel = network.getSelectedNodes();
    if (sel.length == 0) {
        return;
    }
    var id = sel[0];
    var predecessors = computePrevious(id)
    if (predecessors.length) {
        nodes.update(makeNode(id, '#306396'));
    }
    else {
        nodes.update(makeNode(id, 'green'));
    }
    predecessors.forEach(prev => {
        if (!nodes.get(prev)) {
            nodes.add(makeNode(prev));
        }
        if (!edgeMap.has(prev)) {
            edgeMap.set(prev, new Set([ id ]));
            edges.add({from : prev, to : id});
        } else if (!edgeMap.get(prev).has(id)) {
            edgeMap.get(prev).add(id);
            edges.add({from : prev, to : id});
        }
    });
    network.unselectAll();
};

function reset() {
    edgeMap = new Map();
    nodes = new vis.DataSet([ makeNode(start_state) ]);
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

update_rule(110);
