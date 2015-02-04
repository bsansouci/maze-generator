// Version 4
// Uses 3 strips A, B and C across square + random transpose

var seedrandom = require("seedrandom");
if(process.argv.length > 2) Math.random = seedrandom(process.argv[2]);

function map(arr, f) {
  var ret = new Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    ret[i] = f(arr[i]);
  }
  return ret;
}
function filter(arr, f) {
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if(f(arr[i])) ret.push(arr[i]);
  }
  return ret;
}
function slice(arr, start, end) {
  var ret = new Array(end - start);
  for (var i = start; i < end; i++) {
    ret[i] = arr[i];
  }
  return ret;
}
function reduce(arr, f, initial) {
  for (var i = 0; i < arr.length; i++) {
    initial = f(initial, arr[i]);
  }

  return initial;
}
function contains(coll, el, f) {
  return find(coll, el, f) !== null;
}
function find(coll, el, f) {
  var max = coll.length;
  for (var i = 0; i < max; ++i){
    if(f(coll[i], el)) {
      return coll[i];
    }
  }

  return null;
}
function remove(arr, el, f) {
  var max = arr.length;
  var i = 0;
  for (; i < max; i++){
    if(f(arr[i], el)) break;
  }
  arr.splice(i, 1);
}
function heuristicEstimate(p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p1.y);
}
function hashPoint(p) {
  return "" + p.x + "-" + p.y;
}
function comparePoints(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}
function rand(max, min) {
  min = min || 0;
  return Math.floor(Math.random() * (max - min) + min);
}

function randFrom(space) {
  return space[rand(space.length)];
}

function findPath(space, start, end){
  var openSet = [start];
  var closedSet = [];
  var cameFrom = {};
  var gScore = {};
  var fScore = {};
  gScore[hashPoint(start)] = start.weight;

  fScore[hashPoint(start)] = gScore[hashPoint(start)] + heuristicEstimate(start, end);

  while(openSet.length > 0) {
    var cur = openSet[0];
    for(var i = 1; i < openSet.length; i++) {
      if(fScore[hashPoint(openSet[i])] < fScore[hashPoint(cur)]) cur = openSet[i];
    }

    // we've reached the end, we're all goods
    if(comparePoints(cur, end)) {
      return constructPath(cameFrom, end);
    }

    remove(openSet, cur, comparePoints);
    closedSet.push(cur);

    var allNeighbours = findNeighbours(space, cur);
    for (var n in allNeighbours){
      var neighbour = allNeighbours[n];
      if(contains(closedSet, neighbour, comparePoints)) continue;

      var tentativeGScore = gScore[hashPoint(cur)] + neighbour.weight;
      var neighbourHash = hashPoint(neighbour);
      if(!contains(openSet, neighbour, comparePoints) || tentativeGScore < gScore[neighbourHash]) {

        cameFrom[neighbourHash] = cur;
        gScore[neighbourHash] = tentativeGScore;
        fScore[neighbourHash] = gScore[neighbourHash] + heuristicEstimate(neighbour, end);
        if(!contains(openSet, neighbour, comparePoints)) {
          openSet.push(neighbour);
        }
      }
    }
  }

  // We haven't reached the end, it's unreachable
  return [];
}

function findNeighbours(space, p) {
  var arr = [];
  if(p.x + 1 < space.length && space[p.x + 1][p.y].reusable) arr.push(space[p.x + 1][p.y]);
  if(p.x - 1 >= 0 && space[p.x - 1][p.y].reusable) arr.push(space[p.x - 1][p.y]);
  if(p.y + 1 < space[p.x].length && space[p.x][p.y + 1].reusable) arr.push(space[p.x][p.y + 1]);
  if(p.y - 1 >= 0 && space[p.x][p.y - 1].reusable) arr.push(space[p.x][p.y - 1]);

  return arr;
}

function constructPath(cameFrom, end) {
  var cur = end;
  var path = [cur];
  while(cameFrom[hashPoint(cur)] !== undefined) {
    cur = cameFrom[hashPoint(cur)];
    path.push(cur);
  }

  return path.reverse();
}

function getInitialMaze() {
  var space = new Array(30);
  for (var i = 0; i < space.length; i++) {
    space[i] = new Array(30);
    for (var j = 0; j < space[i].length; j++) {
      space[i][j] = {
        x: i,
        y: j,
        west: true,
        east: true,
        north: true,
        south: true,
        reusable: true,
        weight: rand(30)
      };
    }
  }
  return space;
}

function removeWalls(space, x, y, arr) {
  var cell = space[x][y];
  for (var i = 0; i < arr.length; i++) {
    if(cell.hasOwnProperty(arr[i])) cell[arr[i]] = false;

    if(arr[i] === "north" && y - 1 >= 0) space[x][y - 1].south = false;
    if(arr[i] === "south" && y + 1 < space[x].length) space[x][y + 1].north = false;
    if(arr[i] === "east" && x + 1 < space.length) space[x + 1][y].west = false;
    if(arr[i] === "west" && x - 1 >= 0) space[x - 1][y].east = false;
  }

  return cell;
}

function doesCollide(space, topLeftX, topLeftY, size) {
  for (var x = topLeftX; x < topLeftX + size; x++) {
    for (var y = topLeftY; y < topLeftY + size; y++) {
      if(!space[x][y].reusable) return true;
    }
  }

  return false;
}

function addRoomAt(space, topLeftX, topLeftY) {
  if(doesCollide(space, topLeftX, topLeftY, 3)) return null;

  var roomCells = new Array(3);
  for (var i = 0; i < roomCells.length; i++) {
    roomCells[i] = new Array(3);
  }

  roomCells[0][0] = removeWalls(space, topLeftX, topLeftY, ["east", "south"]);
  roomCells[0][0].reusable = false;
  roomCells[1][0] = removeWalls(space, topLeftX + 1, topLeftY, ["east", "south", "west"]);
  roomCells[2][0] = removeWalls(space, topLeftX + 2, topLeftY, ["south", "west"]);
  roomCells[2][0].reusable = false;

  roomCells[0][1] = removeWalls(space, topLeftX, topLeftY + 1, ["north", "east", "south"]);
  roomCells[1][1] = removeWalls(space, topLeftX + 1, topLeftY + 1, ["north", "east", "south", "west"]);
  // This is to avoid having paths go through rooms
  roomCells[1][1].reusable = false;
  roomCells[2][1] = removeWalls(space, topLeftX + 2, topLeftY + 1, ["south", "west", "north"]);

  roomCells[0][2] = removeWalls(space, topLeftX, topLeftY + 2, ["north", "east"]);
  roomCells[0][2].reusable = false;
  roomCells[1][2] = removeWalls(space, topLeftX + 1, topLeftY + 2, ["west", "north", "east"]);
  roomCells[2][2] = removeWalls(space, topLeftX + 2, topLeftY + 2, ["west", "north"]);
  roomCells[2][2].reusable = false;

  return {
    cells: roomCells
  };
}

function addRoom(space, x, y, width, height) {
  var minX = x / 2 + 1;
  var minY = y / 2 + 1;
  var maxX = Math.floor((x + width) / 2 - 1);
  var maxY = Math.floor((y + height) / 2 - 1);

  var room = addRoomAt(space,
              rand(maxX, minX) * 2,
              rand(maxY, minY) * 2);
  var i = 0;
  while(i < 100 && !room) {
    // console.log("Generating new room...", i);
    room = addRoomAt(space,
            rand(maxX, minX) * 2,
            rand(maxY, minY) * 2);
    i++;
  }

  return room;
}

function drawSpace(space) {
  for (var y = 0; y < space[0].length; y++) {
    var top = "";
    var mid = "";
    for (var x = 0; x < space.length; x++) {
      if(space[x][y].west) mid += "|  ";
      else mid += "   ";
      if(x === space.length - 1) {
        if(space[x][y].east) mid += "|";
        else mid += " ";
      }

      if(space[x][y].north) top += "+--";
      else top += "   ";
    }
    console.log(top+"\n"+mid);
  }
  var bot = "";
  for (var y = 0; y < space[0].length; y++) {
    bot += "+--";
  }
  console.log(bot);
}

function linkCells(cell1, cell2) {
  if(Math.abs(cell1.x - cell2.x) + Math.abs(cell1.y - cell2.y) > 1) return console.error("Error, linking two cells in diagonal");

  if(cell1.x - cell2.x > 0) {
    cell1.west = false;
    cell2.east = false;
  } else if (cell1.x - cell2.x < 0) {
    cell1.east = false;
    cell2.west = false;
  } else {
    if(cell1.y - cell2.y > 0) {
      cell1.north = false;
      cell2.south = false;
    } else {
      cell1.south = false;
      cell2.north = false;
    }
  }
}
function digNonBlockingPath(path) {
  if(path.length === 0) return;

  for (var i = 1; i < path.length; i++) {
    linkCells(path[i - 1], path[i]);
  }
}

function digBlockingPath(path) {
  if(path.length === 0) return;

  for (var i = 1; i < path.length; i++) {
    linkCells(path[i - 1], path[i]);
    path[i].reusable = false;
  }
  path[0].reusable = false;
}

function shuffle(coll){
  for(var j, x, i = coll.length; i; j = Math.floor(Math.random() * i), x = coll[--i], coll[i] = coll[j], coll[j] = x);
  return coll;
}

// Needs to generate a graph with 8 rooms
// start -> has one south entrance, and then from 1 to 3 more entrances.
// primary rooms -> have between 2 to 4 entrances
// secondary rooms -> have 1 entrance (linked to their corresponding primary
// room)
// last secondary room is an exception -> it is linked to the exit room
// exit room have two entrances: one north and another that's random
//
// Total:
// - N = we need 1 to 3 edges from start to primary rooms
// - we need 4 - N more edges between primary rooms
function generateMazeGraph() {
  var id = 0;
  var Node = function(type) {
    this.adjacencyList = [];
    this.id = ++id;
    this.type = type;
    this.room = null;
    this.region = null;
  };

  var link = function(n1, n2) {
    n1.adjacencyList.push(n2);
    n2.adjacencyList.push(n1);
  };

  var startNode = new Node("start");
  var exitNode = new Node("exit");

  var primary1 = new Node("primary");
  var secondary1 = new Node("secondary");
  link(primary1, secondary1);

  var primary2 = new Node("primary");
  var secondary2 = new Node("secondary");
  link(primary2, secondary2);

  var primary3 = new Node("primary");
  var secondary3 = new Node("secondary");
  link(primary3, secondary3);

  ///////////////// New Code starts here
  var N = rand(3, 1);
  var possibleRooms = shuffle([primary1, primary2, primary3]);
  map(slice(possibleRooms, 0, N), function(val) {
    link(startNode, val);
  });

  link(primary3, primary2);
  link(primary2, primary1);
  link(secondary1, exitNode);

  return {
    startNode: startNode,
    exitNode: exitNode,
    primaryRooms: [primary1, primary2, primary3],
    secondaryRooms: [secondary1, secondary2, secondary3]
  };
}

function checkMazeGraph(start, exit) {
  var stack = [start];
  var alreadyVisited = {};
  while(stack.length > 0) {
    var cur = stack.pop();
    if(alreadyVisited[cur.id]) continue;

    if(cur === exit) return true;
    alreadyVisited[cur.id] = true;
    stack = cur.adjacencyList.concat(stack);
  }

  return false;
}

function getRoomAt(space, x, y) {
  if(x + 2 >= space.length || y + 2 >= space[x].length) return null;

  return {
    cells: [[space[x][y], space[x][y + 1], space[x][y + 2]],
            [space[x + 1][y], space[x + 1][y + 1], space[x + 1][y + 2]],
            [space[x + 2][y], space[x + 2][y + 1], space[x + 2][y + 2]]]
  };
}

function createMazeFromGraph(space, curNode, cameFrom) {
  if(curNode.room) return curNode.room;

  var room = null;
  if(curNode.type === "start") {
    room = getRoomAt(space, 27, 27);
    if(!room) return console.error("Create the start room first!");
  } else if (curNode.type === "exit") {
    room = getRoomAt(space, 0, 0);
    if(!room) return console.error("Create the exit room first!");
  } else {
    room = addRoom(space, curNode.region.x, curNode.region.y, curNode.region.width, curNode.region.height);
  }

  if(!room) {
    drawSpace(space);
    return console.error("Couldn't generate a new room");
  }

  curNode.room = room;
  var withoutRepeats = filter(curNode.adjacencyList, function(v) {
    return v !== cameFrom;
  });
  for (var i = 0; i < withoutRepeats.length; i++) {
    var neighbourNode = withoutRepeats[i];
    var neighbourRoom = createMazeFromGraph(space, neighbourNode, curNode);

    // Propagate the error...
    if(!neighbourRoom) return null;

    // They are set to not reusable by default (to avoid having paths going
    // through rooms)
    room.cells[1][1].reusable = true;
    neighbourRoom.cells[1][1].reusable = true;
    var p = findPath(space, room.cells[1][1], neighbourRoom.cells[1][1]);
    if(p.length === 0) {
      // console.log("Path with length 0 --->", p.length, room.cells[1][1], neighbourRoom.cells[1][1]);
      room.cells[1][1].reusable = false;
      neighbourRoom.cells[1][1].reusable = false;
      return null;
    }
    if(neighbourNode.type === 'primary') {
      digNonBlockingPath(p);
      room.cells[1][1].reusable = false;
      neighbourRoom.cells[1][1].reusable = false;
    } else {
      digBlockingPath(p);
    }
  }

  return room;
}

function flatten(arr) {
  return reduce(arr, function(acc, x) {
    return acc.concat(x);
  }, []);
}

function blockRoom(room) {
  room.cells[0][0].reusable = false;
  room.cells[1][0].reusable = false;
  room.cells[2][0].reusable = false;

  room.cells[0][1].reusable = false;
  room.cells[1][1].reusable = false;
  room.cells[2][1].reusable = false;

  room.cells[0][2].reusable = false;
  room.cells[1][2].reusable = false;
  room.cells[2][2].reusable = false;
}

function addRandomPaths(mazeGraph, space, complexity) {
  blockRoom(mazeGraph.startNode.room);
  blockRoom(mazeGraph.exitNode.room);
  map(mazeGraph.primaryRooms, function(x){blockRoom(x.room);});
  map(mazeGraph.secondaryRooms, function(x){blockRoom(x.room);});

  var possibleCells = shuffle(filter(flatten(space), function(x) {return x.reusable;}));

  var totalTries = rand(complexity * 10, complexity * 2);
  while(totalTries--) {
    var cell1 = possibleCells[rand(possibleCells.length)];
    var cell2 = possibleCells[rand(possibleCells.length)];
    var p = findPath(space, cell1, cell2);
    digNonBlockingPath(p);
  }
}

function getSecondary(room) {
  return filter(room.adjacencyList, function(x) {
    return x.type === "secondary";
  })[0];
}

// Divide the square into 3
// bound those regions with walls
// add rooms within this bounded regions
// link primary and secondary rooms with the walls dividing the space
// remove the walls dividing the space
// link primary rooms together + start + add randomPaths
function addRegionsToGraph(space, mazeGraph) {
  var slices = 3;
  var height = Math.floor(space[0].length / slices);
  for (var i = 0; i < slices; i++) {
    mazeGraph.primaryRooms[i].region = {
      x: 0,
      y: height * i,
      width: space.length,
      height: height
    };
    getSecondary(mazeGraph.primaryRooms[i]).region = mazeGraph.primaryRooms[i].region;
  }
}

function transpose(space) {
  for (var i = 0; i < space.length; i++) {
    for (var j = 0; j < i; j++) {
      var tmp = space[i][j];
      space[i][j] = space[j][i];
      space[i][j] = tmp;
    }
  }
}

function generateMaze() {
  var space = getInitialMaze();
  // Generate a graph of the paths from start to end through primary rooms
  var mazeGraph = generateMazeGraph();
  // Check if there's a path from start to exit
  var allGood = checkMazeGraph(mazeGraph.startNode, mazeGraph.exitNode);
  if(!allGood) return console.error("Error: mazeGraph, can't go from startNode to exist");

  // Add regions to rooms (set A, B and C)
  addRegionsToGraph(space, mazeGraph);

  // Add start and exit rooms before anything
  addRoomAt(space, 27, 27);
  addRoomAt(space, 0, 0);

  // DFS to add the rooms within the regions
  allGood = createMazeFromGraph(space, mazeGraph.startNode, null);
  if(!allGood) return null;

  // Transpose for more variety
  if(Math.random() < 0.5) transpose(space);

  // Increased variety by add complexity
  addRandomPaths(mazeGraph, space, 10);

  return {
    space: space,
    mazeGraph: mazeGraph
  };
}

var express = require('express');
var app = express();

app.get('/', function(req, res){
  console.log("Got request");
  var start = Date.now();
  var maze = null;
  while(Date.now() - start < 3000) {
    maze = generateMaze();
    if(maze) break;
  }

  drawSpace(maze.space);
  res.json({space: maze.space});
});

app.listen(3000);
