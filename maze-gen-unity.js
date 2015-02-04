//#pragma strict

function Start () {

}

function Update () {

}

// Version 4
// Uses 3 strips A, B and C across square + random transpose

function map(arr, f) {
  var ret = new Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    ret[i] = f(arr[i]);
  }
  return ret;
}
function filter(arr, f) {
  var ret = new Array();
  for (var i = 0; i < arr.length; i++) {
    if(f(arr[i])) ret.Push(arr[i]);
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
  arr.RemoveAt(i);
}
function heuristicEstimate(p1, p2) {
  return Mathf.Abs(p1['x'] - p2['x']) + Mathf.Abs(p1['y'] - p1['y']);
}
function hashPoint(p) {
  return "" + p['x'] + "-" + p['y'];
}
function comparePoints(p1, p2) {
  return p1['x'] === p2['x'] && p1['y'] === p2['y'];
}
function rand(max, min) {
  return Mathf.Floor(Random.value * (max - min) + min);
}

function randFrom(space) {
  return space[rand(space.length, 0)];
}

function findPath(space, start, end){
  var openSet = new Array();
  openSet.Push(start);
  var closedSet = new Array();
  var cameFrom = {};
  var gScore = {};
  var fScore = {};
  gScore[hashPoint(start)] = start['weight'];

  fScore[hashPoint(start)] = gScore[hashPoint(start)] + heuristicEstimate(start, end);
  Debug.LogError("Start + End = " + start['x'] + "-" + start['y'] + " " + end['x'] + "-" + end['y']);
  var iii = 400;
  while(openSet.length > 0 && --iii) {
//    return new Array();
    var cur = openSet[0];
    for(var i = 1; i < openSet.length; i++) {
      if(fScore[hashPoint(openSet[i])] < fScore[hashPoint(cur)]) cur = openSet[i];
    }

    // we've reached the end, we're all goods
    if(comparePoints(cur, end)) {
      return constructPath(cameFrom, end);
    }

    remove(openSet, cur, comparePoints);
    closedSet.Push(cur);

    var allNeighbours = findNeighbours(space, cur);
    for (i = 0;i<allNeighbours.length;i++){
      var neighbour = allNeighbours[i];
      if(contains(closedSet, neighbour, comparePoints)) continue;

      var tentativeGScore = gScore[hashPoint(cur)] + neighbour['weight'];
      var neighbourHash = hashPoint(neighbour);

      if(!contains(openSet, neighbour, comparePoints) ||
          tentativeGScore < gScore[neighbourHash]) {
        cameFrom[neighbourHash] = cur;
        gScore[neighbourHash] = tentativeGScore;
        fScore[neighbourHash] = gScore[neighbourHash] + heuristicEstimate(neighbour, end);
        if(!contains(openSet, neighbour, comparePoints)) {
          openSet.Push(neighbour);
        }
      }
    }
  }

  // We haven't reached the end, it's unreachable
  return new Array();
}

function findNeighbours(space, p) {
  var arr = new Array();
  if(p['x'] + 1 < space.length && space[p['x'] + 1][p['y']]['reusable']) arr.Push(space[p['x'] + 1][p['y']]);
  if(p['x'] - 1 >= 0 && space[p['x'] - 1][p['y']]['reusable']) arr.Push(space[p['x'] - 1][p['y']]);
  if(p['y'] + 1 < space[p['x']].length && space[p['x']][p['y'] + 1]['reusable']) arr.Push(space[p['x']][p['y'] + 1]);
  if(p['y'] - 1 >= 0 && space[p['x']][p['y'] - 1]['reusable']) arr.Push(space[p['x']][p['y'] - 1]);

  return arr;
}

function constructPath(cameFrom, end) {
  var cur = end;
  var path = new Array();
  path.Push(cur);
  while(cameFrom[hashPoint(cur)] != null) {
    cur = cameFrom[hashPoint(cur)];
    path.Push(cur);
  }

  var ret = new Array();
  for (var i = path.length - 1; i >= 0; i--) {
    ret.Push(path[i]);
  }

  return ret;
}

function getInitialMaze() {
  var space = new Array();
  for (var i = 0; i < 30; i++) {
    space.Push(new Array());
    for (var j = 0; j < 30; j++) {
      space[i].Push({
        'x': i,
        'y': j,
        'west': true,
        'east': true,
        'north': true,
        'south': true,
        'reusable': true,
        'weight': rand(30, 0)
      });
    }
  }
  return space;
}

function removeWalls(space, x, y, arr) {
  var cell = space[x][y];
  for (var i = 0; i < arr.length; i++) {
    cell[arr[i]] = false;

    if(arr[i] === "north" && y - 1 >= 0) space[x][y - 1]['south'] = false;
    if(arr[i] === "south" && y + 1 < space[x].length) space[x][y + 1]['north'] = false;
    if(arr[i] === "east" && x + 1 < space.length) space[x + 1][y]['west'] = false;
    if(arr[i] === "west" && x - 1 >= 0) space[x - 1][y]['east'] = false;
  }

  return cell;
}

function doesCollide(space, topLeftX, topLeftY, size) {
  for (var x = topLeftX; x < topLeftX + size; x++) {
    for (var y = topLeftY; y < topLeftY + size; y++) {
      if(!space[x][y]['reusable']) return true;
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
  roomCells[0][0]['reusable'] = false;
  roomCells[1][0] = removeWalls(space, topLeftX + 1, topLeftY, ["east", "south", "west"]);
  roomCells[2][0] = removeWalls(space, topLeftX + 2, topLeftY, ["south", "west"]);
  roomCells[2][0]['reusable'] = false;

  roomCells[0][1] = removeWalls(space, topLeftX, topLeftY + 1, ["north", "east", "south"]);
  roomCells[1][1] = removeWalls(space, topLeftX + 1, topLeftY + 1, ["north", "east", "south", "west"]);
  // This is to avoid having paths go through rooms
  roomCells[1][1]['reusable'] = false;
  roomCells[2][1] = removeWalls(space, topLeftX + 2, topLeftY + 1, ["south", "west", "north"]);

  roomCells[0][2] = removeWalls(space, topLeftX, topLeftY + 2, ["north", "east"]);
  roomCells[0][2]['reusable'] = false;
  roomCells[1][2] = removeWalls(space, topLeftX + 1, topLeftY + 2, ["west", "north", "east"]);
  roomCells[2][2] = removeWalls(space, topLeftX + 2, topLeftY + 2, ["west", "north"]);
  roomCells[2][2]['reusable'] = false;

  return {
    'cells': roomCells
  };
}

function addRoom(space, x, y, width, height) {
  var minX = x / 2 + 1;
  var minY = y / 2 + 1;
  var maxX = Mathf.Floor((x + width) / 2 - 1);
  var maxY = Mathf.Floor((y + height) / 2 - 1);
  // Debug.LogError(minX +" "+maxX +" "+minY +" "+maxY);
  var room = addRoomAt(space,
              rand(maxX, minX) * 2,
              rand(maxY, minY) * 2);
  var i = 0;
  while(i < 100 && !room) {
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
      if(space[x][y]['west']) mid += "|  ";
      else mid += "   ";
      if(x == space.length - 1) {
        if(space[x][y]['east']) mid += "|";
        else mid += " ";
      }

      if(space[x][y]['north']) top += "+--";
      else top += "   ";
    }
    Debug.Log(top+"\n"+mid);
  }
  var bot = "";
  for (y = 0; y < space[0].length; y++) {
    bot += "+--";
  }
  Debug.Log(bot);
}

function linkCells(cell1, cell2) {
  if(Mathf.Abs(cell1['x'] - cell2['x']) + Mathf.Abs(cell1['y'] - cell2['y']) > 1) {
    return;
  }

  if(cell1['x'] - cell2['x'] > 0) {
    cell1['west'] = false;
    cell2['east'] = false;
  } else if (cell1['x'] - cell2['x'] < 0) {
    cell1['east'] = false;
    cell2['west'] = false;
  } else {
    if(cell1['y'] - cell2['y'] > 0) {
      cell1['north'] = false;
      cell2['south'] = false;
    } else {
      cell1['south'] = false;
      cell2['north'] = false;
    }
  }
}
function digNonBlockingPath(path) {
  if(path.length == 0) return;

  for (var i = 1; i < path.length; i++) {
    linkCells(path[i - 1], path[i]);
  }
}

function digBlockingPath(path) {
  if(path.length == 0) return;

  for (var i = 1; i < path.length; i++) {
    linkCells(path[i - 1], path[i]);
    path[i]['reusable'] = false;
  }
  path[0]['reusable'] = false;
}

function shuffle(arr : Array) {
  for (var i = arr.length - 1; i > 0; i--) {
      var r = rand(i, 0);
      var tmp = arr[i];
      arr[i] = arr[r];
      arr[r] = tmp;
  }

  return arr;
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
    return {
      'adjacencyList': Array(),
      'id': ++id,
      'type': type,
      'room': null,
      'region': null
    };
  };

  var link = function(n1, n2) {
    n1['adjacencyList'].Push(n2);
    n2['adjacencyList'].Push(n1);
  };

  var startNode = Node("start");
  var exitNode = Node("exit");

  var primary1 = Node("primary");
  var secondary1 = Node("secondary");
  link(primary1, secondary1);

  var primary2 = Node("primary");
  var secondary2 = Node("secondary");
  link(primary2, secondary2);

  var primary3 = Node("primary");
  var secondary3 = Node("secondary");
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
    'startNode': startNode,
    'exitNode': exitNode,
    'primaryRooms': [primary1, primary2, primary3],
    'secondaryRooms': [secondary1, secondary2, secondary3]
  };
}

function checkMazeGraph(start, exit) {
 var stack = new Array();
 stack.Push(start);
 var alreadyVisited = {};
 while(stack.length > 0) {
   var cur = stack.pop();
   if(alreadyVisited[cur['id']]) continue;

   if(cur === exit) return true;
   alreadyVisited[cur['id']] = true;
   stack = cur['adjacencyList'].concat(stack);
 }

 return false;
}

function getRoomAt(space, x, y) {
  if(x + 2 >= space.length || y + 2 >= space[x].length) return null;

  return {
    'cells': [[space[x][y], space[x][y + 1], space[x][y + 2]],
            [space[x + 1][y], space[x + 1][y + 1], space[x + 1][y + 2]],
            [space[x + 2][y], space[x + 2][y + 1], space[x + 2][y + 2]]]
  };
}

function createMazeFromGraph(space: System.Object, curNode: Boo.Lang.Hash, cameFrom: Boo.Lang.Hash): Boo.Lang.Hash {
  if(curNode['room']) return curNode['room'];

  Debug.LogError("blabla2");
  var room = null;
  if(curNode['type'] === "start") {
    room = getRoomAt(space, 27, 27);
    Debug.LogError("blabla3");
    if(!room) return null;
  } else if (curNode['type'] === "exit") {
    room = getRoomAt(space, 0, 0);
    Debug.LogError("blabla4");
    if(!room) return null;
  } else {
    room = addRoom(space, curNode['region']['x'], curNode['region']['y'], curNode['region']['width'], curNode['region']['height']);
  }
  Debug.LogError("blabla5");
  if(!room) {
    Debug.LogError("No room");
    // drawSpace(space);
    return null;
  }
  Debug.LogError("blabla6");
  curNode['room'] = room;
  var withoutRepeats = filter(curNode['adjacencyList'], function(v) {
    return v !== cameFrom;
  });
  Debug.LogError("blabla7");
  for (var i = 0; i < withoutRepeats.length; i++) {
    var neighbourNode = withoutRepeats[i];
    var neighbourRoom = createMazeFromGraph(space, neighbourNode, curNode);
    Debug.LogError("blabla8");
    // Propagate the error...
    if(!neighbourRoom) {
      Debug.LogError('No neighbour');
      return null;
    }

    // They are set to not reusable by default (to avoid having paths going
    // through rooms)
    room['cells'][1][1]['reusable'] = true;
    neighbourRoom['cells'][1][1]['reusable'] = true;
    Debug.LogError("blabla9");
    var p = findPath(space, room['cells'][1][1], neighbourRoom['cells'][1][1]);
    Debug.LogError("blabla10");
    if(p.length == 0) {
      Debug.LogError('Path of length 0');
      room['cells'][1][1]['reusable'] = false;
      neighbourRoom['cells'][1][1]['reusable'] = false;
      return null;
    }

    if(neighbourNode['type'] === 'primary') {
      digNonBlockingPath(p);
      room['cells'][1][1]['reusable'] = false;
      neighbourRoom['cells'][1][1]['reusable'] = false;
    } else {
      digBlockingPath(p);
    }
  }

  return room;
}

function flatten(arr) {
  return reduce(arr, function(acc, x) {
    return acc.concat(x);
  }, new Array());
}

function blockRoom(room) {
  room['cells'][0][0]['reusable'] = false;
  room['cells'][1][0]['reusable'] = false;
  room['cells'][2][0]['reusable'] = false;

  room['cells'][0][1]['reusable'] = false;
  room['cells'][1][1]['reusable'] = false;
  room['cells'][2][1]['reusable'] = false;

  room['cells'][0][2]['reusable'] = false;
  room['cells'][1][2]['reusable'] = false;
  room['cells'][2][2]['reusable'] = false;
}

function addRandomPaths(mazeGraph, space, complexity) {
  blockRoom(mazeGraph['startNode']['room']);
  blockRoom(mazeGraph['exitNode']['room']);
  map(mazeGraph['primaryRooms'], function(x){blockRoom(x['room']);});
  map(mazeGraph['secondaryRooms'], function(x){blockRoom(x['room']);});

  var possibleCells = shuffle(filter(flatten(space), function(x) {return x['reusable'];}));

  var totalTries = rand(complexity * 10, complexity * 2);
  while(totalTries--) {
    var cell1 = possibleCells[rand(possibleCells.length, 0)];
    var cell2 = possibleCells[rand(possibleCells.length, 0)];
    var p = findPath(space, cell1, cell2);
    digNonBlockingPath(p);
  }
}

function getSecondary(room) {
  for (var i = 0; i < room['adjacencyList'].length; i++) {
    if(room['adjacencyList'][i]['type'] === "secondary") return room['adjacencyList'][i];
  }
  return null;
}

// Divide the square into 3
// bound those regions with walls
// add rooms within this bounded regions
// link primary and secondary rooms with the walls dividing the space
// remove the walls dividing the space
// link primary rooms together + start + add randomPaths
function addRegionsToGraph(space, mazeGraph) {
  var height = Mathf.Floor(space[0].length / 3);
  for (var i = 0; i < 3; i++) {
    mazeGraph['primaryRooms'][i]['region'] = {
      'x': 0,
      'y': height * i,
      'width': space.length,
      'height': height
    };
    getSecondary(mazeGraph['primaryRooms'][i])['region'] = mazeGraph['primaryRooms'][i]['region'];
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

function generateMaze2() {
  Debug.LogError("test1");
  var space = getInitialMaze();
  Debug.LogError("test2");
  // Generate a graph of the paths from start to end through primary rooms
  var mazeGraph = generateMazeGraph();
  Debug.LogError("test3");
  // Check if there's a path from start to exit
//  var allGood = checkMazeGraph(mazeGraph.startNode, mazeGraph.exitNode);
//  if(!allGood) return;

  // Add regions to rooms (set A, B and C)
  addRegionsToGraph(space, mazeGraph);
  Debug.LogError("test4");
  // Add start and exit rooms before anything
  addRoomAt(space, 27, 27);
  Debug.LogError("test5");
  addRoomAt(space, 0, 0);
  Debug.LogError("test6");

  // DFS to add the rooms within the regions
  var allGood2 = createMazeFromGraph(space, mazeGraph['startNode'], {});
  Debug.LogError("test7");
  if(allGood2 === null) return null;
  Debug.LogError("test8");

  // Transpose for more variety
  if(Random.value < 0.5) transpose(space);
  Debug.LogError("test9");
  // Increased variety by add complexity
  addRandomPaths(mazeGraph, space, 10);
  Debug.LogError("test10");
  return {
    space: space,
    mazeGraph: mazeGraph
  };
}

function getTime() {
  var t = new System.DateTime(1970, 1, 1, 0, 0, 0, System.DateTimeKind.Utc);
  return System.Convert.ToInt64((System.DateTime.UtcNow - t).TotalSeconds);
}

// var start = getTime();

 var maze = null;
// var iii=3;
//  while(iii--) {
//  Debug.LogError("penis"+iii);
   maze = generateMaze2();
//    if(maze) break;
//  }
Debug.LogError(maze);
// drawSpace(maze.space);



// function Start () {
//   gameObject.renderer.material.color = Color.red;
//   generateMaze2();
// }

// function Update () {
//   transform.Rotate(new Vector3(15,30,45)*Time.deltaTime);
// }