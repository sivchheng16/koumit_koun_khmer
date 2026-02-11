import { LevelConfig, Direction, CommandType, Obstacle, ObstacleType } from './types';

export const TRANSLATIONS = {
  title: "គំនិតកូនខ្មែរ (Koumnit Koun Khmer)",
  subtitle: "រៀនសរសេរកូដជាមួយមនុស្សយន្ត",
  play: "ចាប់ផ្តើមលេង",
  generateLevel: "បង្កើតវិញ្ញាសាថ្មី (AI)",
  levels: "កម្រិត",
  instructions: "បញ្ជា",
  workspace: "កន្លែងរៀបចំកូដ",
  run: "ដំណើរការ",
  reset: "ចាប់ផ្តើមឡើងវិញ",
  clear: "លុបទាំងអស់",
  nextLevel: "កម្រិតបន្ទាប់",
  tryAgain: "ព្យាយាមម្តងទៀត",
  victory: "ជោគជ័យ!",
  crash: "អូ! បុកហើយ!",
  outOfBounds: "ចេញក្រៅផ្លូវហើយ!",
  help: "ជំនួយ (AI)",
  loading: "កំពុងដំណើរការ...",
  save: "រក្សាទុក",
  load: "ផ្ទុកទិន្នន័យ",
  saveSuccess: "ការរក្សាទុកបានជោគជ័យ!",
  loadSuccess: "ការផ្ទុកទិន្នន័យបានជោគជ័យ!",
  noSaveFound: "មិនមានទិន្នន័យរក្សាទុកទេ",
  tutorialBtn: "រៀនលេង (Tutorial)",
  tutorial: {
    welcome: "សួស្តី! ខ្ញុំឈ្មោះ រ៉ូបូ។ តោះរៀនលេងទាំងអស់គ្នា!",
    step1: "ចុច 'ដើរទៅស្តាំ' ដើម្បីទៅជិតថ្ម។",
    step2: "មានថ្ម! ចុច 'លោតទៅស្តាំ' ដើម្បីរំលងវា។",
    step3: "ឆ្លងផុតហើយ! ចុច 'ដើរទៅលើ' ដើម្បីទៅរកទង់ជាតិ។",
    step4: "ជិតដល់ហើយ! ចុច 'ដើរទៅលើ' ម្តងទៀត។",
    step5: "រួចរាល់! ចុច 'ដំណើរការ' ដើម្បីមើលខ្ញុំដើរ។",
    completed: "អស្ចារ្យ! អ្នកពូកែណាស់។",
  },
  commands: {
    [CommandType.Up]: "ដើរទៅលើ",
    [CommandType.Down]: "ដើរទៅក្រោម",
    [CommandType.Left]: "ដើរទៅឆ្វេង",
    [CommandType.Right]: "ដើរទៅស្តាំ",
    [CommandType.JumpUp]: "លោតទៅលើ",
    [CommandType.JumpDown]: "លោតទៅក្រោម",
    [CommandType.JumpLeft]: "លោតទៅឆ្វេង",
    [CommandType.JumpRight]: "លោតទៅស្តាំ",
  },
  aiHintPrompt: "សូមជួយណែនាំក្មេងអាយុ ៧ ឆ្នាំជាភាសាខ្មែរ ដើម្បីដោះស្រាយល្បែងនេះ។",
  aiLevelPrompt: "បង្កើត level ហ្គេម grid ថ្មីមួយជា JSON ។",
};

export const COLORS = {
  primary: "bg-blue-500",
  secondary: "bg-orange-400",
  success: "bg-green-500",
  danger: "bg-red-500",
  background: "bg-blue-50",
};

// --- Tutorial Level ---
export const TUTORIAL_LEVEL: LevelConfig = {
    id: 0,
    name: "ការហ្វឹកហាត់ (Tutorial)",
    gridSize: 5,
    start: { x: 0, y: 2 },
    startDirection: Direction.East,
    goal: { x: 3, y: 0 },
    obstacles: [{ x: 2, y: 2, description: "ថ្ម (Rock)", type: 'rock' }],
    description: "Learn the basic movements.",
    tutorialSteps: [
        {
            message: TRANSLATIONS.tutorial.step1,
            trigger: 'add_block',
            requiredBlock: CommandType.Right,
            highlightElementId: 'btn-right'
        },
        {
            message: TRANSLATIONS.tutorial.step2,
            trigger: 'add_block',
            requiredBlock: CommandType.JumpRight,
            highlightElementId: 'btn-jump-right'
        },
        {
            message: TRANSLATIONS.tutorial.step3,
            trigger: 'add_block',
            requiredBlock: CommandType.Up,
            highlightElementId: 'btn-up'
        },
        {
            message: TRANSLATIONS.tutorial.step4,
            trigger: 'add_block',
            requiredBlock: CommandType.Up,
            highlightElementId: 'btn-up'
        },
        {
            message: TRANSLATIONS.tutorial.step5,
            trigger: 'click_run',
            highlightElementId: 'btn-run'
        }
    ]
};

// --- Seeded Random Number Generator for Deterministic Levels ---
class RNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  
  // Linear Congruential Generator (LCG)
  next() {
    // Parameters ensuring good distribution
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  
  range(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1) + min);
  }
  
  bool(chance: number = 0.5) {
    return this.next() < chance;
  }
  
  pick<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }
}

// --- Level Generation Logic ---

const generateLevels = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];

  for (let i = 1; i <= 100; i++) {
    // Unique seed for every level ensures different layouts
    const rng = new RNG(i * 1234567 + 890123); 
    
    // 1. Difficulty Scaling
    // Grid Size: Increases significantly
    let gridSize = 5;
    if (i > 10) gridSize = 6;
    if (i > 30) gridSize = 7;
    if (i > 60) gridSize = 8;
    if (i > 85) gridSize = 9;

    // Difficulty factor (0.0 to 1.0)
    const difficulty = Math.min(1, i / 100); 

    // Theme Rotation: 5 distinct biomes
    let theme: 'forest' | 'water' | 'dungeon' | 'fire' | 'mix' = 'forest';
    if (i > 20 && i <= 40) theme = 'water';
    else if (i > 40 && i <= 60) theme = 'dungeon';
    else if (i > 60 && i <= 80) theme = 'fire';
    else if (i > 80) theme = 'mix';

    // 2. Start & Goal Placement
    // Easy: Closer. Hard: Corners.
    let start = { x: 0, y: 0 };
    let goal = { x: gridSize - 1, y: gridSize - 1 };
    
    if (i <= 5) {
        start = { x: 0, y: rng.range(0, gridSize-1) };
        goal = { x: gridSize-1, y: rng.range(0, gridSize-1) };
    } else {
        // Randomize corners/edges
        const corners = [
            {x:0, y:0}, {x:gridSize-1, y:0}, 
            {x:0, y:gridSize-1}, {x:gridSize-1, y:gridSize-1}
        ];
        const startIdx = rng.range(0, 3);
        start = corners[startIdx];
        // Goal is the opposite corner or random other corner
        goal = corners[(startIdx + 2) % 4]; 
    }

    const startDirection = rng.pick([Direction.East, Direction.South]); 

    // 3. Path Generation (The "Solution")
    // Use a Random Walk that biases towards the goal but allows deviation based on difficulty.
    const path: {x: number, y: number}[] = [];
    let curr = { ...start };
    path.push(curr);
    
    // Target Path Length:
    // Easy: Direct path (Manhattan distance)
    // Hard: Manhattan distance + extra steps (winding)
    const manhattanDist = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
    const targetLength = Math.floor(manhattanDist * (1 + difficulty * 0.8)); 

    let attempts = 0;
    while ((curr.x !== goal.x || curr.y !== goal.y) && attempts < 500) {
        attempts++;
        const neighbors = [
            { x: curr.x + 1, y: curr.y },
            { x: curr.x - 1, y: curr.y },
            { x: curr.x, y: curr.y + 1 },
            { x: curr.x, y: curr.y - 1 }
        ].filter(p => p.x >= 0 && p.x < gridSize && p.y >= 0 && p.y < gridSize);

        // Filter valid moves (not visited)
        let validMoves = neighbors.filter(n => !path.some(p => p.x === n.x && p.y === n.y));

        // Dead end? Backtrack (simplified: just restart loop logic or break)
        if (validMoves.length === 0) {
            break; 
        }

        // Weighting
        validMoves.sort((a, b) => {
            const distA = Math.abs(a.x - goal.x) + Math.abs(a.y - goal.y);
            const distB = Math.abs(b.x - goal.x) + Math.abs(b.y - goal.y);
            
            // If path is too short, prefer moves that DON'T decrease distance too fast (or random)
            // If path is long enough, prefer goal
            const distanceFactor = (distA - distB);
            
            if (path.length < targetLength) {
                // High randomness, slight bias AWAY from goal to wind around
                return distanceFactor * -0.5 + (rng.next() - 0.5) * 2;
            } else {
                // Strong bias to goal
                return distanceFactor + (rng.next() - 0.5) * 0.5;
            }
        });

        // Pick best
        curr = validMoves[0];
        path.push(curr);
        if (curr.x === goal.x && curr.y === goal.y) break;
    }

    // Safety: If path didn't finish (dead end loop), force a direct L-shape path to ensure playability
    if (path[path.length-1].x !== goal.x || path[path.length-1].y !== goal.y) {
        path.length = 0; // clear
        // Simple L path
        let cx = start.x, cy = start.y;
        path.push({x:cx, y:cy});
        // Move X
        while(cx !== goal.x) {
            cx += (cx < goal.x) ? 1 : -1;
            path.push({x:cx, y:cy});
        }
        // Move Y
        while(cy !== goal.y) {
            cy += (cy < goal.y) ? 1 : -1;
            path.push({x:cx, y:cy});
        }
    }

    // 4. Obstacle Placement
    const obstacles: Obstacle[] = [];
    const addObstacle = (x: number, y: number, isJumpable: boolean) => {
        if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) return;
        if (obstacles.some(o => o.x === x && o.y === y)) return;

        let type: ObstacleType = 'rock';
        let desc = "ថ្ម (Rock)";

        if (theme === 'water') { type = 'water'; desc = "ទឹក (Water)"; }
        else if (theme === 'dungeon') { type = 'wall'; desc = "ជញ្ជាំង (Wall)"; }
        else if (theme === 'fire') { type = 'fire'; desc = "ភ្លើង (Fire)"; }
        else if (theme === 'mix') {
            type = rng.pick(['rock', 'water', 'wall', 'fire', 'mud']);
            desc = "ឧបសគ្គ (Obstacle)";
        } else { 
            // Forest
            type = rng.pick(['rock', 'forest']);
            desc = type === 'rock' ? "ថ្ម (Rock)" : "ព្រៃ (Forest)";
        }

        if (isJumpable) {
            // Ensure jumpable types
             if (theme === 'forest') { type = 'rock'; }
             if (theme === 'dungeon') { type = 'mud'; desc = "ភក់ (Mud)"; }
        }
        
        obstacles.push({ x, y, type, description: desc });
    };

    // A. Fill non-path area (Corridors)
    // Increase density with difficulty to narrow the playing field (Maze-like)
    const density = 0.2 + (difficulty * 0.6); // 0.2 to 0.8
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const onPath = path.some(p => p.x === x && p.y === y);
            if (!onPath) {
                if (rng.bool(density)) {
                    addObstacle(x, y, false);
                }
            }
        }
    }

    // B. Create Jumps (Obstacles ON the path)
    const allowJumps = i > 10;
    if (allowJumps) {
        // Iterate path to find straight lines
        for (let k = 0; k < path.length - 2; k++) {
            const p1 = path[k];
            const p2 = path[k+1];
            const p3 = path[k+2];
            
            // Check for straight line
            const isStraight = (p1.x === p3.x && Math.abs(p1.y - p3.y) === 2) || 
                               (p1.y === p3.y && Math.abs(p1.x - p3.x) === 2);
            
            if (isStraight) {
                // High difficulty -> more forced jumps
                if (rng.bool(0.3 + (difficulty * 0.3))) {
                     addObstacle(p2.x, p2.y, true);
                }
            }
        }
    }

    // Level Info
    let name = `កម្រិត ${i}`;
    let description = "";
    switch(theme) {
        case 'forest': description = "ដើរឆ្លងកាត់ព្រៃ (Forest Walk)"; break;
        case 'water': description = "លោតរំលងទឹក (Jump over Water)"; break;
        case 'dungeon': description = "ប្រយ័ត្នជញ្ជាំងនិងភក់ (Dungeon Maze)"; break;
        case 'fire': description = "គ្រោះថ្នាក់! ភ្នំភ្លើង (Volcano Danger)"; break;
        case 'mix': description = "ការប្រកួតចុងក្រោយ (Final Challenge)"; break;
    }

    levels.push({
      id: i,
      name,
      gridSize,
      start,
      startDirection,
      goal,
      obstacles,
      description
    });
  }

  return levels;
};

export const INITIAL_LEVELS = generateLevels();