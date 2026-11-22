// Shadow Vault — the three heists.
// One job: the maps, the patrol routes and the flavour text for each level.
//
// Map legend (every row is exactly 24 tiles wide, 16 rows tall):
//   #  wall (blocks movement and sight)
//   .  open floor
//   ,  shadow zone (dark floor: you are hard to spot while standing in it)
//   B  bush (hiding spot: you can stand inside it, guards barely see you)
//   C  crate (cover: blocks movement and sight, hide behind it)
//   E  exit (reach it unseen to clear the level)
//   S  data shard (optional collectible, +250 score each)
//   P  player start
//   G  guard spawn (patrol waypoints are listed per level, in tile coords)

export const LEVELS = [
  {
    name: 'Level 1 — The Vault Door',
    brief:
      'Two guards walk the halls. Learn their patrol, slip between the crates, and reach the green exit. Grab the shards if you dare.',
    parTime: 75,
    map: [
      '########################',
      '#......#........#.....E#',
      '#..S...#...C....#......#',
      '#......#........#..B...#',
      '#..C...#...S....#......#',
      '#......###.###..#......#',
      '#......................#',
      '#.####....####....####.#',
      '#......................#',
      '#..B....#....C....#....#',
      '#......#........#..S...#',
      '#..C...#...B....#......#',
      '#......#........#......#',
      '#......#....C...#......#',
      '#P.....#........#......#',
      '########################',
    ],
    guards: [
      { waypoints: [[5, 6], [18, 6]], pause: 1.2 },
      { waypoints: [[18, 8], [5, 8]], pause: 1.2 },
    ],
  },
  {
    name: 'Level 2 — The Gallery of Eyes',
    brief:
      'Three guards, longer sightlines and darker corners. Shadow zones (dark floor) and bushes hide you — a running step will give you away.',
    parTime: 110,
    map: [
      '########################',
      '#E....#,,,,,,,#....S...#',
      '#.....#,,,,,,,#........#',
      '#..C..#,,,,,,,#...B....#',
      '#.....#,,,,,,,#........#',
      '#..S..####.####...C....#',
      '#......................#',
      '###.####....####....####',
      '#......................#',
      '#....C....#......#..S..#',
      '#........#..B...#......#',
      '#..B.....#......#...C..#',
      '#........#......#......#',
      '#....S...#..C...#..B...#',
      '#P.......#......#......#',
      '########################',
    ],
    guards: [
      { waypoints: [[3, 6], [20, 6]], pause: 0.9 },
      { waypoints: [[20, 8], [3, 8]], pause: 0.9 },
      { waypoints: [[11, 9], [11, 12], [15, 12], [15, 9]], pause: 0.7 },
    ],
  },
  {
    name: 'Level 3 — The Heart of the Vault',
    brief:
      'Four guards, crossing patrols, almost no safe ground. Move only when the cones turn away. The vault core is yours if you stay unseen.',
    parTime: 150,
    map: [
      '########################',
      '#....#.....,,,,,#.....E#',
      '#.S..#.....,,,,,#..S...#',
      '#....#.....,,,,,#......#',
      '#.C..###.###,###..B....#',
      '#....#........#........#',
      '#.B..#...C....#...C....#',
      '#....####..####..####..#',
      '#......................#',
      '#..C....#....C....#..S.#',
      '#......#........#......#',
      '#..B...#...B....#..C...#',
      '#......#........#......#',
      '#..S...#....C...#..B...#',
      '#P.....#........#......#',
      '########################',
    ],
    guards: [
      { waypoints: [[4, 8], [19, 8]], pause: 0.8 },
      { waypoints: [[7, 5], [13, 5]], pause: 0.8 },
      { waypoints: [[10, 10], [10, 13]], pause: 0.6 },
      { waypoints: [[20, 10], [20, 13]], pause: 0.6 },
    ],
  },
];
