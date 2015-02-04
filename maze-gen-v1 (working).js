var seedrandom = require("seedrandom");
if(process.argv.length > 2) Math.random = seedrandom(process.argv[2]);

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
  // console.log("findPath: End is unreachable for", start, end);
  return [];
}

// space: Point[][]
// p: Point
// return: Point[]
function findNeighbours(space, p) {
  var arr = [];
  if(p.x + 1 < space.length && space[p.x + 1][p.y].reusable) arr.push(space[p.x + 1][p.y]);
  if(p.x - 1 >= 0 && space[p.x - 1][p.y].reusable) arr.push(space[p.x - 1][p.y]);
  if(p.y + 1 < space[p.x].length && space[p.x][p.y + 1].reusable) arr.push(space[p.x][p.y + 1]);
  if(p.y - 1 >= 0 && space[p.x][p.y - 1].reusable) arr.push(space[p.x][p.y - 1]);

  return arr;
}

// end: Point
function constructPath(cameFrom, end) {
  var cur = end;
  var path = [cur];
  while(cameFrom[hashPoint(cur)] !== undefined) {
    cur = cameFrom[hashPoint(cur)];
    path.push(cur);
  }

  return path.reverse();
}

function partial(fn) {
  var slice = Array.prototype.slice;
  var stored_args = slice.call(arguments, 1);
  return function () {
    var new_args = slice.call(arguments);
    var args = stored_args.concat(new_args);
    return fn.apply(null, args);
  };
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
        weight: Math.floor(Math.random() * 30)
      };
    }
  }
  return space;
}

function removeWalls(space, x, y) {
  var args = Array.prototype.slice.call(arguments, 3);
  var cell = space[x][y];
  for (var i = 0; i < args.length; i++) {
    if(cell.hasOwnProperty(args[i])) cell[args[i]] = false;

    if(args[i] === "north" && y - 1 >= 0) space[x][y - 1].south = false;
    if(args[i] === "south" && y + 1 < space[x].length) space[x][y + 1].north = false;
    if(args[i] === "east" && x + 1 < space.length) space[x + 1][y].west = false;
    if(args[i] === "west" && x - 1 >= 0) space[x - 1][y].east = false;
  }

  return cell;
}

function rand(max, min) {
  min = min || 0;
  return Math.floor(Math.random() * (max - min) + min);
}

function randFrom(space) {
  return space[rand(space.length)];
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

  roomCells[0][0] = removeWalls(space, topLeftX, topLeftY, "east", "south");
  roomCells[0][0].reusable = false;
  roomCells[1][0] = removeWalls(space, topLeftX + 1, topLeftY, "east", "south", "west");
  roomCells[2][0] = removeWalls(space, topLeftX + 2, topLeftY, "south", "west");
  roomCells[2][0].reusable = false;

  roomCells[0][1] = removeWalls(space, topLeftX, topLeftY + 1, "north", "east", "south");
  roomCells[1][1] = removeWalls(space, topLeftX + 1, topLeftY + 1, "north", "east", "south", "west");
  // This is to avoid having paths go through rooms
  roomCells[1][1].reusable = false;
  roomCells[2][1] = removeWalls(space, topLeftX + 2, topLeftY + 1, "south", "west", "north");

  roomCells[0][2] = removeWalls(space, topLeftX, topLeftY + 2, "north", "east");
  roomCells[0][2].reusable = false;
  roomCells[1][2] = removeWalls(space, topLeftX + 1, topLeftY + 2, "west", "north", "east");
  roomCells[2][2] = removeWalls(space, topLeftX + 2, topLeftY + 2, "west", "north");
  roomCells[2][2].reusable = false;

  return {
    cells: roomCells
  };
}

function addRoom(space) {
  var room = addRoomAt(space,
              rand(Math.floor((space.length - 2) / 2), 2) * 2,
              rand(Math.floor((space[0].length - 2) / 2), 2) * 2);
  var i = 0;
  while(i < 100 && !room) {
    // console.log("Generating new room...", i);
    room = addRoomAt(space,
            rand(Math.floor((space.length - 2) / 2), 2) * 2,
            rand(Math.floor((space[0].length - 2) / 2), 2) * 2);
    i++;
  }
  if(i === 99) return console.error("ERROR GENERATING PRIMARY ROOM");

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

function getRandomPointsToLink(space) {
  var availablePoints = [];
  for (var x = 0; x < space.length; x++) {
    for (var y = 0; y < space[x].length; y++) {
      if(space[x][y].reusable) availablePoints.push(space[x][y]);
    }
  }

  var end = rand(30, 6);
  shuffle(availablePoints);
  return availablePoints.slice(0, end);
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

  var N = rand(3, 1);
  var possibleRooms = shuffle([primary1, primary2, primary3]);
  // console.log("linking", N, "rooms to start");
  var linkToStart = partial(link, startNode);
  possibleRooms.slice(0, N).map(linkToStart);

  possibleRooms = shuffle([primary1, primary2, primary3]);
  var rest = 4 - N;
  for (var i = 0; i < rest; i++) {
    var cur = possibleRooms.pop();
    link(cur, possibleRooms[0]);
    // console.log('Link 1', cur, possibleRooms[0]);
    // Little hack to link one more if you can
    // (so you can do primary1 -> primary2 and primary1 -> primary3)
    if(i + 1 < rest) {
      link(cur, possibleRooms[1]);
      // console.log('Link 2', cur, possibleRooms[1]);
      i++;
    }
  }

  possibleRooms = shuffle([secondary1, secondary2, secondary3]);
  link(randFrom(possibleRooms), exitNode);

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

    // console.log("=====================>",cur);
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
    room = getRoomAt(space, 13, 27);
    if(!room) return console.error("Create the start room first!");
  } else if (curNode.type === "exit") {
    room = getRoomAt(space, 13, 0);
    if(!room) return console.error("Create the exit room first!");
  } else {
    room = addRoom(space);
  }

  if(!room) {
    drawSpace(space);
    return console.error("Couldn't generate a new room");
  }

  curNode.room = room;
  var withoutRepeats = curNode.adjacencyList.filter(function(v) {
    return v !== cameFrom;
  });
  for (var i = 0; i < withoutRepeats.length; i++) {
    var neighbour = createMazeFromGraph(space, withoutRepeats[i], curNode);

    // Propagate the error...
    if(!neighbour) return null;

    // They are set to not reusable by default (to avoid having paths going
    // through rooms)
    room.cells[1][1].reusable = true;
    neighbour.cells[1][1].reusable = true;
    var p = findPath(space, room.cells[1][1], neighbour.cells[1][1]);
    if(p.length === 0) {
      // console.log("Path with length 0 --->", p.length, room.cells[1][1], neighbour.cells[1][1]);
      room.cells[1][1].reusable = false;
      neighbour.cells[1][1].reusable = false;
      return null;
    }
    digBlockingPath(p);
    // if(withoutRepeats[i].type === 'primary') {
    //   console.log("Ignored primary");
    //   // digNonBlockingPath(p);
    //   room.cells[1][1].reusable = false;
    //   neighbour.cells[1][1].reusable = false;
    // } else {
    //   digBlockingPath(p);
    // }
  }

  return room;
}

function generateMaze2(rec) {
  if(rec <= 0) return null;

  var mazeGraph = generateMazeGraph();
  var space = getInitialMaze();
  var allGood = checkMazeGraph(mazeGraph.startNode, mazeGraph.exitNode);
  if(!allGood) return console.error("Error: mazeGraph, can't go from startNode to exist");

  // Add start and exit rooms before anything
  addRoomAt(space, 13, 27);
  addRoomAt(space, 13, 0);

  allGood = createMazeFromGraph(space, mazeGraph.startNode, null);
  if(!allGood) return generateMaze2(rec - 1);

  return {
    space: space,
    mazeGraph: mazeGraph
  };
}

var randomFunc = Math.random;
var start = Date.now();
var maze = null;
while(Date.now() - start < 2500) {
  maze = generateMaze2(1);
  if(maze) break;
}

if(!maze) {
  Math.random = randomFunc;
  var r = randFrom([ 'gftadsqehojnbkp', 'sbeqholcijradg', 'qsojacdehgtnpmlri', 'sbglmrta', 'jiemtkshcolapf', 'aorqgchtne', 'psielqfajkmntordgb', 'ielhmjtbgfacq', 'oahdgqplfbckeir' ]);
  console.log("Couldn't generate a maze that worked out. Generating using seed", r);
  Math.random = seedrandom(r);
  var start = Date.now();
  var maze = null;
  while(Date.now() - start < 2500) {
    maze = generateMaze2(1);
    if(maze) break;
  }
}
// here there's a valid maze (guaranteed)

drawSpace(maze.space);


// var goodSeeds = [];
// var letters = ['a', 'b', 'c', 'd', 'e','f', 'g', 'h', 's', 't', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'];
// var str = "";
// while(goodSeeds.length < 25) {
//   Math.random = randomFunc;
//   str = shuffle(letters).slice(0, rand(letters.length, 4)).join('');
//   var t = Date.now();
//   Math.random = seedrandom(str);
//   while(Date.now() - t < rand(2000, 1000)) {
//     var maze = generateMaze2(1);
//     if(maze) {
//       console.log("Found good seed", str);
//       goodSeeds.push(str);
//       break;
//     }
//   }
// }
// console.log(goodSeeds);
