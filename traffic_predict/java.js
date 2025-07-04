const nodes = { A: ["B", "C", "G"], B: ["A", "D", "E"], C: ["A", "F", "G"], D: ["B", "H"], E: ["B", "F", "I"], F: ["C", "E", "J"], G: ["A", "C", "K"], H: ["D", "I"], I: ["E", "H", "J"], J: ["F", "I", "L"], K: ["G", "L"], L: ["J", "K"] };
let edges = { "A-B": 400, "A-C": 200, "A-G": 600, "B-D": 500, "B-E": 1000, "C-F": 300, "C-G": 400, "E-F": 100, "D-H": 700, "E-I": 600, "F-J": 800, "G-K": 500, "H-I": 200, "I-J": 300, "J-L": 400, "K-L": 200 };
let blockedRoads = [];
let congestedRoads = [];
let trafficUpdateInterval;
let trafficUpdatesActive = true;

function toggleTrafficUpdates() {
    trafficUpdatesActive = !trafficUpdatesActive;
    document.getElementById("traffic-toggle").textContent = 
        trafficUpdatesActive ? "Pause Traffic Updates" : "Resume Traffic Updates";

    if (trafficUpdatesActive) {
        startTrafficUpdates();
    } else {
        clearInterval(trafficUpdateInterval);
    }
}

function startTrafficUpdates() {
    clearInterval(trafficUpdateInterval);
    trafficUpdateInterval = setInterval(updateTraffic, 9000);
}

function updateTraffic() {
    congestedRoads = [];
    let congestionDetected = false;

    Object.keys(edges).forEach(edge => {
        let baseTime = (Math.floor(Math.random() * 10) + 1) * 100;
        let congestionFactor = Math.random() > 0.7 ? 2 : 1;

        if (congestionFactor > 1) {
            congestedRoads.push(edge);
            congestionDetected = true;
        }

        edges[edge] = baseTime * congestionFactor;
    });

    if (congestionDetected) {
        document.getElementById("alert-popup").style.display = "block";
        document.getElementById("alert-sound").play();
        setTimeout(() => {
            document.getElementById("alert-popup").style.display = "none";
        }, 3000);
    } else {
        document.getElementById("alert-popup").style.display = "none";
    }

    drawGraph();
}

class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({element, priority});
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

function dijkstra(start, end) {
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    for (const node in nodes) {
        distances[node] = node === start ? 0 : Infinity;
        pq.enqueue(node, distances[node]);
    }

    while (!pq.isEmpty()) {
        const current = pq.dequeue();
        if (current === end) break;

        for (const neighbor of nodes[current]) {
            const edge = `${current}-${neighbor}`;
            const reverseEdge = `${neighbor}-${current}`;

            if (blockedRoads.includes(edge) || blockedRoads.includes(reverseEdge)) {
                continue;
            }

            const weight = edges[edge] || edges[reverseEdge];
            if (!weight) continue;

            const newDist = distances[current] + weight;

            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                previous[neighbor] = current;
                pq.enqueue(neighbor, newDist);
            }
        }
    }

    const path = [];
    let current = end;

    while (current !== undefined) {
        path.unshift(current);
        current = previous[current];
    }

    return {
        path: path[0] === start ? path : [],
        totalDistance: distances[end]
    };
}

function drawGraph(path = []) {
    const canvas = document.getElementById("map");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const positions = { A: [100, 200], B: [200, 100], C: [200, 300], D: [300, 50], E: [300, 200], F: [300, 350], G: [100, 50], H: [400, 50], I: [400, 200], J: [400, 350], K: [100, 350], L: [500, 200] };

    for (let edge in edges) {
        let [n1, n2] = edge.split("-");
        if (!blockedRoads.includes(edge) && !blockedRoads.includes(`${n2}-${n1}`)) {
            ctx.beginPath();
            ctx.moveTo(...positions[n1]);
            ctx.lineTo(...positions[n2]);

            if (congestedRoads.includes(edge) || congestedRoads.includes(`${n2}-${n1}`)) {
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = 8;
            } else {
                ctx.strokeStyle = "#aaa";
                ctx.lineWidth = 5;
            }

            ctx.stroke();

            let midX = (positions[n1][0] + positions[n2][0]) / 2;
            let midY = (positions[n1][1] + positions[n2][1]) / 2;
            let timeMin = (edges[edge] || edges[`${n2}-${n1}`]) / 1000 * 60 / 30;
            ctx.fillStyle = "red";
            ctx.font = "bold 10px Arial";
            ctx.fillText(`${timeMin.toFixed(1)} min`, midX - 15, midY - 10);
        }
    }

    for (let node in positions) {
        ctx.beginPath();
        ctx.arc(...positions[node], 20, 0, Math.PI * 2);
        ctx.fillStyle = "purple";
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText(node, positions[node][0] - 5, positions[node][1] + 5);
    }

    if (path.length < 2) return;

    let step = 0, posIndex = 0;
    const speed = 0.006;
    const trail = [];
    let blinkState = true;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let edge in edges) {
            let [n1, n2] = edge.split("-");
            if (!blockedRoads.includes(edge) && !blockedRoads.includes(`${n2}-${n1}`)) {
                ctx.beginPath();
                ctx.moveTo(...positions[n1]);
                ctx.lineTo(...positions[n2]);

                if (congestedRoads.includes(edge) || congestedRoads.includes(`${n2}-${n1}`)) {
                    ctx.strokeStyle = "#ff0000";
                    ctx.lineWidth = 8;
                } else {
                    ctx.strokeStyle = "#aaa";
                    ctx.lineWidth = 5;
                }

                ctx.stroke();

                let midX = (positions[n1][0] + positions[n2][0]) / 2;
                let midY = (positions[n1][1] + positions[n2][1]) / 2;
                let timeMin = (edges[edge] || edges[`${n2}-${n1}`]) / 1000 * 60 / 30;
                ctx.fillStyle = "red";
                ctx.font = "bold 10px Arial";
                ctx.fillText(`${timeMin.toFixed(1)} min`, midX - 15, midY - 10);
            }
        }

        for (let node in positions) {
            ctx.beginPath();
            ctx.arc(...positions[node], 20, 0, Math.PI * 2);
            ctx.fillStyle = "purple";
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Arial";
            ctx.fillText(node, positions[node][0] - 5, positions[node][1] + 5);
        }

        for (let i = 0; i < trail.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(...trail[i]);
            ctx.lineTo(...trail[i + 1]);
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        if (posIndex >= path.length - 1) {
            alert("Shortest path found");
            return;
        }

        const start = positions[path[posIndex]];
        const end = positions[path[posIndex + 1]];

        const x = start[0] + (end[0] - start[0]) * step;
        const y = start[1] + (end[1] - start[1]) * step;
        trail.push([x, y]);

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = blinkState ? "blue" : "cyan";
        ctx.fill();

        blinkState = !blinkState;

        step += speed;
        if (step >= 1) {
            step = 0;
            posIndex++;
        }
        requestAnimationFrame(animate);
    }
    animate();
}

function findRoute() {
    const start = document.getElementById("start")?.value || "";
    const end = document.getElementById("end")?.value || "";

    document.getElementById("top-popup").innerText = `Current Location: ${start} | Destination: ${end}`;

    let result = dijkstra(start, end);
    let distanceInKm = result.totalDistance / 1000;
    let estimatedTime = distanceInKm / 0.5 * 60;

    document.getElementById("bottom-popup").innerText = `Distance: ${distanceInKm.toFixed(2)} km | Time: ${estimatedTime.toFixed(1)} mins`;

    drawGraph(result.path);
}

window.onload = function () {
    startTrafficUpdates();
    findRoute();
};
