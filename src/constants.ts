import { LevelConfig, Direction, CommandType, Obstacle, ObstacleType, Language } from './types';

export const TRANSLATIONS = {
  km: {
    title: "រ៉ូបូកូនខ្មែរ (ROBOT BRAINIAC)",
    subtitle: "ដំណើរផ្សងព្រេងរបស់រ៉ូបូឆ្លាត",
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
    crashDetail: "ប្រយ័ត្នឧបសគ្គ! ព្យាយាមរកផ្លូវផ្សេង។",
    outOfBounds: "ចេញក្រៅផ្លូវហើយ!",
    outOfBoundsDetail: "រ៉ូបូដើរចេញពីតារាងហើយ។ សូមពិនិត្យមើលឡើងវិញ។",
    incomplete: "មិនទាន់ដល់គោលដៅទេ!",
    incompleteDetail: "រ៉ូបូទៅមិនដល់គោលដៅទេ។ សូមបន្ថែមបញ្ជាទៀត!",
    help: "ជំនួយ (AI)",
    loading: "កំពុងដំណើរការ...",
    preparingResult: "កំពុងរៀបចំលទ្ធផល...",
    save: "រក្សាទុក",
    load: "ផ្ទុកទិន្នន័យ",
    saveSuccess: "ការរក្សាទុកបានជោគជ័យ!",
    loadSuccess: "ការផ្ទុកទិន្នន័យបានជោគជ័យ!",
    noSaveFound: "មិនមានទិន្នន័យរក្សាទុកទេ",
    tutorialBtn: "រៀនលេង (Tutorial)",
    total: "សរុប",
    level: "កម្រិត",
    custom: "វិញ្ញាសាពិសេស",
    poweredBy: "ឧបត្ថម្ភដោយ",
    rightsReserved: "រក្សាសិទ្ធិគ្រប់យ៉ាង",
    undo: "ត្រឡប់ក្រោយ",
    redo: "ទៅមុខ",
    delete: "លុប",
    walk: "ដើរ (Walk)",
    jump: "លោត (Jump)",
    start: "ចំណុចចាប់ផ្តើម",
    goal: "គោលដៅ",
    successMsg: "អ្នកបានបញ្ចប់កម្រិតនេះដោយជោគជ័យ!",
    commandsUsed: "បញ្ជាដែលបានប្រើ",
    fewerCommands: "ប្រើបញ្ជាកាន់តែតិច បានផ្កាយកាន់តែច្រើន!",
    replay: "លេងម្តងទៀត",
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
    obstacles: {
        rock: "ថ្ម",
        water: "ទឹក",
        wall: "ជញ្ជាំង",
        fire: "ភ្លើង",
        forest: "ព្រៃ",
        mud: "ភក់",
        obstacle: "ឧបសគ្គ"
    },
    levelDesc: {
        forest: "ដើរឆ្លងកាត់ព្រៃ",
        water: "លោតរំលងទឹក",
        dungeon: "ប្រយ័ត្នជញ្ជាំងនិងភក់",
        fire: "គ្រោះថ្នាក់! ភ្នំភ្លើង",
        mix: "ការប្រកួតចុងក្រោយ"
    }
  },
  en: {
    title: "ROBOT BRAINIAC",
    subtitle: "Smart Robot Adventures",
    play: "Start Game",
    generateLevel: "Generate Level (AI)",
    levels: "Levels",
    instructions: "Commands",
    workspace: "Workspace",
    run: "Run Code",
    reset: "Reset",
    clear: "Clear All",
    nextLevel: "Next Level",
    tryAgain: "Try Again",
    victory: "Success!",
    crash: "Oh no! Crashed!",
    crashDetail: "Watch out for obstacles! Try a different path.",
    outOfBounds: "Out of bounds!",
    outOfBoundsDetail: "The robot left the grid. Check your steps.",
    incomplete: "Not at goal yet!",
    incompleteDetail: "The robot didn't reach the goal. Add more commands!",
    help: "AI Hint",
    loading: "Thinking...",
    preparingResult: "Preparing results...",
    save: "Save",
    load: "Load",
    saveSuccess: "Saved successfully!",
    loadSuccess: "Loaded successfully!",
    noSaveFound: "No save data found",
    tutorialBtn: "Tutorial",
    total: "Total",
    level: "LEVEL",
    custom: "CUSTOM",
    poweredBy: "POWERED BY",
    rightsReserved: "All rights reserved.",
    undo: "Undo",
    redo: "Redo",
    delete: "Delete",
    walk: "Walk",
    jump: "Jump",
    start: "Start",
    goal: "Goal",
    successMsg: "You completed this level successfully!",
    commandsUsed: "Commands Used",
    fewerCommands: "Use fewer commands to get more stars!",
    replay: "Replay",
    tutorial: {
      welcome: "Hi! I'm Robo. Let's learn to code!",
      step1: "Click 'Walk Right' to approach the rock.",
      step2: "A rock! Click 'Jump Right' to jump over it.",
      step3: "Made it! Click 'Walk Up' to head to the flag.",
      step4: "Almost there! Click 'Walk Up' again.",
      step5: "Ready! Click 'Run Code' to watch me go.",
      completed: "Awesome! You are great at this.",
    },
    commands: {
      [CommandType.Up]: "Walk Up",
      [CommandType.Down]: "Walk Down",
      [CommandType.Left]: "Walk Left",
      [CommandType.Right]: "Walk Right",
      [CommandType.JumpUp]: "Jump Up",
      [CommandType.JumpDown]: "Jump Down",
      [CommandType.JumpLeft]: "Jump Left",
      [CommandType.JumpRight]: "Jump Right",
    },
    obstacles: {
        rock: "Rock",
        water: "Water",
        wall: "Wall",
        fire: "Fire",
        forest: "Forest",
        mud: "Mud",
        obstacle: "Obstacle"
    },
    levelDesc: {
        forest: "Walk through the forest",
        water: "Jump over water",
        dungeon: "Dungeon maze",
        fire: "Volcano danger!",
        mix: "Final Challenge"
    }
  }
};

export const COLORS = {
  primary: "bg-blue-500",
  secondary: "bg-orange-400",
  success: "bg-green-500",
  danger: "bg-red-500",
  background: "bg-blue-50",
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

// --- Dynamic Level Generation ---

export const getTutorialLevel = (lang: Language): LevelConfig => {
    const t = TRANSLATIONS[lang];
    return {
        id: 0,
        name: lang === 'km' ? "ការហ្វឹកហាត់ (Tutorial)" : "Training (Tutorial)",
        gridSize: 5,
        start: { x: 0, y: 2 },
        startDirection: Direction.East,
        goal: { x: 3, y: 0 },
        obstacles: [{ x: 2, y: 2, description: t.obstacles.rock, type: 'rock' }],
        description: t.tutorial.welcome,
        tutorialSteps: [
            {
                message: t.tutorial.step1,
                trigger: 'add_block',
                requiredBlock: CommandType.Right,
                highlightElementId: 'btn-right'
            },
            {
                message: t.tutorial.step2,
                trigger: 'add_block',
                requiredBlock: CommandType.JumpRight,
                highlightElementId: 'btn-jump-right'
            },
            {
                message: t.tutorial.step3,
                trigger: 'add_block',
                requiredBlock: CommandType.Up,
                highlightElementId: 'btn-up'
            },
            {
                message: t.tutorial.step4,
                trigger: 'add_block',
                requiredBlock: CommandType.Up,
                highlightElementId: 'btn-up'
            },
            {
                message: t.tutorial.step5,
                trigger: 'click_run',
                highlightElementId: 'btn-run'
            }
        ]
    };
};

export const getInitialLevels = (lang: Language): LevelConfig[] => {
  const t = TRANSLATIONS[lang];
  const levels: LevelConfig[] = [];

  for (let i = 1; i <= 100; i++) {
    // Unique seed for every level ensures different layouts but consistent across languages
    const rng = new RNG(i * 1234567 + 890123); 
    
    // 1. Difficulty Scaling
    const gridSize = Math.min(8, 5 + Math.floor((i - 1) / 15));
    const difficulty = Math.min(1, i / 100); 

    // Theme Rotation
    let theme: 'forest' | 'water' | 'dungeon' | 'fire' | 'mix' = 'forest';
    if (i > 20 && i <= 40) theme = 'water';
    else if (i > 40 && i <= 60) theme = 'dungeon';
    else if (i > 60 && i <= 80) theme = 'fire';
    else if (i > 80) theme = 'mix';

    // 2. Start & Goal Placement
    let start = { x: 0, y: 0 };
    let goal = { x: gridSize - 1, y: gridSize - 1 };
    
    const strategy = i % 5; 

    if (i <= 5) {
        start = { x: 0, y: rng.range(0, gridSize-1) };
        goal = { x: gridSize-1, y: rng.range(0, gridSize-1) };
    } else {
        switch(strategy) {
            case 0: // Diagonal Corners
                const corners = [{x:0, y:0}, {x:gridSize-1, y:0}, {x:0, y:gridSize-1}, {x:gridSize-1, y:gridSize-1}];
                const startIdx = rng.range(0, 3);
                start = corners[startIdx];
                goal = corners[3 - startIdx];
                break;
            case 1: // Vertical
                const topToBottom = rng.bool();
                start = { x: rng.range(0, gridSize-1), y: topToBottom ? 0 : gridSize-1 };
                goal = { x: rng.range(0, gridSize-1), y: topToBottom ? gridSize-1 : 0 };
                break;
            case 2: // Horizontal
                const leftToRight = rng.bool();
                start = { x: leftToRight ? 0 : gridSize-1, y: rng.range(0, gridSize-1) };
                goal = { x: leftToRight ? gridSize-1 : 0, y: rng.range(0, gridSize-1) };
                break;
            case 3: // Perimeter
                const getPerimeterPoint = () => rng.bool() ? { x: rng.bool() ? 0 : gridSize-1, y: rng.range(0, gridSize-1) } : { x: rng.range(0, gridSize-1), y: rng.bool() ? 0 : gridSize-1 };
                start = getPerimeterPoint();
                let attempts = 0;
                do { goal = getPerimeterPoint(); attempts++; } while ((Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y) < gridSize/2) && attempts < 10);
                break;
            case 4: // Scattered
                let attempts2 = 0;
                do {
                    start = { x: rng.range(0, gridSize - 1), y: rng.range(0, gridSize - 1) };
                    goal = { x: rng.range(0, gridSize - 1), y: rng.range(0, gridSize - 1) };
                    attempts2++;
                } while ((Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y) < gridSize - 1) && attempts2 < 20);
                break;
        }
    }

    // Smart Start Direction
    let startDirection = Direction.East;
    const dx = goal.x - start.x;
    const dy = goal.y - start.y;
    if (Math.abs(dx) >= Math.abs(dy)) startDirection = dx > 0 ? Direction.East : Direction.West;
    else startDirection = dy > 0 ? Direction.South : Direction.North;

    // 3. Path Generation
    const path: {x: number, y: number}[] = [];
    let curr = { ...start };
    path.push(curr);
    
    const manhattanDist = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
    const targetLength = Math.floor(manhattanDist * (1 + difficulty * 0.8)); 

    let attempts = 0;
    while ((curr.x !== goal.x || curr.y !== goal.y) && attempts < 500) {
        attempts++;
        const neighbors = [
            { x: curr.x + 1, y: curr.y }, { x: curr.x - 1, y: curr.y },
            { x: curr.x, y: curr.y + 1 }, { x: curr.x, y: curr.y - 1 }
        ].filter(p => p.x >= 0 && p.x < gridSize && p.y >= 0 && p.y < gridSize);

        let validMoves = neighbors.filter(n => !path.some(p => p.x === n.x && p.y === n.y));
        if (validMoves.length === 0) break; 

        validMoves.sort((a, b) => {
            const distA = Math.abs(a.x - goal.x) + Math.abs(a.y - goal.y);
            const distB = Math.abs(b.x - goal.x) + Math.abs(b.y - goal.y);
            const distanceFactor = (distA - distB);
            if (path.length < targetLength) return distanceFactor * -0.5 + (rng.next() - 0.5) * 2;
            else return distanceFactor + (rng.next() - 0.5) * 0.5;
        });

        curr = validMoves[0];
        path.push(curr);
        if (curr.x === goal.x && curr.y === goal.y) break;
    }

    // Safety L-path
    if (path[path.length-1].x !== goal.x || path[path.length-1].y !== goal.y) {
        path.length = 0;
        let cx = start.x, cy = start.y;
        path.push({x:cx, y:cy});
        while(cx !== goal.x) { cx += (cx < goal.x) ? 1 : -1; path.push({x:cx, y:cy}); }
        while(cy !== goal.y) { cy += (cy < goal.y) ? 1 : -1; path.push({x:cx, y:cy}); }
    }

    // 4. Obstacle Placement
    const obstacles: Obstacle[] = [];
    const addObstacle = (x: number, y: number, isJumpable: boolean) => {
        if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) return;
        if (obstacles.some(o => o.x === x && o.y === y)) return;

        let type: ObstacleType = 'rock';
        let desc = t.obstacles.rock;

        if (theme === 'water') { type = 'water'; desc = t.obstacles.water; }
        else if (theme === 'dungeon') { type = 'wall'; desc = t.obstacles.wall; }
        else if (theme === 'fire') { type = 'fire'; desc = t.obstacles.fire; }
        else if (theme === 'mix') {
            const pick = rng.pick(['rock', 'water', 'wall', 'fire', 'mud']);
            type = pick as ObstacleType;
            // @ts-ignore
            desc = t.obstacles[pick] || t.obstacles.obstacle;
        } else { 
            type = rng.pick(['rock', 'forest']) as ObstacleType;
            desc = type === 'rock' ? t.obstacles.rock : t.obstacles.forest;
        }

        if (isJumpable) {
             if (theme === 'forest') { type = 'rock'; }
             if (theme === 'dungeon') { type = 'mud'; desc = t.obstacles.mud; }
        }
        
        obstacles.push({ x, y, type, description: desc });
    };

    // Fill corridors
    const density = 0.2 + (difficulty * 0.6);
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const onPath = path.some(p => p.x === x && p.y === y);
            if (!onPath) {
                if (rng.bool(density)) addObstacle(x, y, false);
            }
        }
    }

    // Add jumps
    if (i > 10) {
        for (let k = 0; k < path.length - 2; k++) {
            const p1 = path[k], p2 = path[k+1], p3 = path[k+2];
            const isStraight = (p1.x === p3.x && Math.abs(p1.y - p3.y) === 2) || (p1.y === p3.y && Math.abs(p1.x - p3.x) === 2);
            if (isStraight && rng.bool(0.3 + (difficulty * 0.3))) addObstacle(p2.x, p2.y, true);
        }
    }

    // Level Info
    let name = `${t.level} ${i}`;
    let description = "";
    // @ts-ignore
    description = t.levelDesc[theme] || t.levelDesc.forest;

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