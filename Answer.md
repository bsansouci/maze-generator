Given the large number of constraints on how the maze is to be constructed, the best way to ensure that we obtain a random and interesting maze is to generate the rooms first and connect them as specified in the instructions, guaranteeing the creation of proper paths from start to finish. This enables us to avoid having to randomly restart because the maze is unfeasible.

Prim's algorithm was considered for the maze creation but the addition of 3x3 rooms complicated the prospects of this option. As such, a path finding algorithm A* is used instead to connect rooms placed in random areas. We assign random weight to the cells at the start to ensure we have random paths between each room.

We first only generate a path from the start to the finish. After, we add the random rooms and trace paths to them with the use of a DFS. Given that the rooms are perfectly interconnected, we do not need to preoccupy ourselves with the order in which the projectiles spawn in each secondary room. 

Paths between primary and secondary rooms are marked as reusable or unreusable to prevent possible openings that would allow access to secondary rooms without having passed through a primary room first. 

A BFS can check the validity of the solution and if necessary, the algorithm will automaticaly regenerate to create a valid solution if there are too many path collisions.