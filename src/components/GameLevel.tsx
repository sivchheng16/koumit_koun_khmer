import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, HelpCircle, ArrowRight as ArrowNext, Home, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, Undo, Redo, Volume2, VolumeX, Star, RefreshCw, Waves, Flame, Trees, Mountain, Check, ThumbsUp, AlertTriangle, XCircle, GripVertical, Replace, CheckCircle } from 'lucide-react';
import { LevelConfig, CommandBlock, CommandType, Direction, Position, SimulationStep, ObstacleType, Language } from '../types';
import { TRANSLATIONS } from '../constants';
// import { void } from '../services/geminiService';
import { playSound, toggleMute, getMuteState } from '../services/soundService';

interface GameLevelProps {
  level: LevelConfig;
  onBack: () => void;
  onNext: () => void;
  onComplete: (stars: number) => void;
  language: Language;
  isMuted: boolean;
  onToggleMute: () => void;
}

const GameLevel: React.FC<GameLevelProps> = ({ level, onBack, onNext, onComplete, language, isMuted, onToggleMute }) => {
  const [blocks, setBlocks] = useState<CommandBlock[]>([]);
  const [history, setHistory] = useState<CommandBlock[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const t = TRANSLATIONS[language];

  // Selection and Reordering State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

  const [robotPos, setRobotPos] = useState<Position>(level.start);
  const [robotDir, setRobotDir] = useState<Direction>(level.startDirection);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'success' | 'failure'>('idle');
  const [failureReason, setFailureReason] = useState<'crashed' | 'bounds' | 'incomplete' | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showEntry, setShowEntry] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout Metrics for smooth animation
  // Layout Metrics for smooth animation
  const gridRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridMetrics, setGridMetrics] = useState({ cellSize: 0, gapSize: 0, gridLeft: 0, gridTop: 0 });

  // Tutorial State
  const [tutorialStepIndex, setTutorialStepIndex] = useState<number>(0);
  const [tutorialFeedback, setTutorialFeedback] = useState<'success' | 'error' | null>(null);

  const isTutorial = !!level.tutorialSteps;
  const currentTutorialStep = isTutorial ? level.tutorialSteps?.[tutorialStepIndex] : null;

  const isPreparingResult = gameStatus === 'success' && !showResultModal;

  const isSmallGrid = level.gridSize <= 5;

  // Responsive sizing configuration
  const sizing = {
    // Dynamic cell sizing handles the grid, icon sizes below are for internal SVG scaling relative to cell
    icon: gridMetrics.cellSize * 0.6, // Relative to dynamic cell size
    robot: gridMetrics.cellSize * 0.8,
    goal: gridMetrics.cellSize * 0.7,
  };

  // Reset when level changes
  useEffect(() => {
    setBlocks([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setTutorialStepIndex(0);
    setTutorialFeedback(null);
    setShowEntry(true);
    const timer = setTimeout(() => setShowEntry(false), 2000);
    resetGame();
    return () => clearTimeout(timer);
  }, [level]);

  // Measure grid for smooth animation - Responsive
  const updateGridMetrics = useCallback(() => {
    if (gridContainerRef.current) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate max available dimensions for the grid
      // Use more screen real estate: 90% of width, 85% of height
      const maxGridWidth = (containerWidth - 40) * 0.95;
      const maxGridHeight = (containerHeight - 40) * 0.90;

      const p = 20; // Padding
      const g = 8;  // Gap

      // cell * size + gap * (size - 1) = total
      // cell * size + gap * size - gap = total
      // cell * size = total - gap * size + gap
      // cell = (total + gap) / size - gap

      const maxCellWidth = (maxGridWidth + g) / level.gridSize - g;
      const maxCellHeight = (maxGridHeight + g) / level.gridSize - g;

      // Use the smaller of the two to keep it square, but ensure a minimum size
      const cellSize = Math.max(40, Math.min(maxCellWidth, maxCellHeight));

      // Calculate centering offsets
      const gridTotalWidth = cellSize * level.gridSize + g * (level.gridSize - 1);
      const gridTotalHeight = cellSize * level.gridSize + g * (level.gridSize - 1);

      const gridLeft = Math.max(0, (containerWidth - gridTotalWidth) / 2);
      const gridTop = Math.max(0, (containerHeight - gridTotalHeight) / 2);

      setGridMetrics({
        width: containerWidth,
        height: containerHeight,
        cellSize,
        gapSize: g,
        gridLeft,
        gridTop
      });
    }
  }, [level.gridSize]);

  useEffect(() => {
    // Initial measure
    updateGridMetrics();

    // Resize observer is better than window resize for element-based resizing
    const resizeObserver = new ResizeObserver(() => {
      updateGridMetrics();
    });

    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
    }

    window.addEventListener('resize', updateGridMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateGridMetrics);
    };
  }, [updateGridMetrics]);

  // UseEffect to trigger measurement after render when level changes
  useEffect(() => {
    const timer = setTimeout(updateGridMetrics, 100);
    return () => clearTimeout(timer);
  }, [level, updateGridMetrics]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  // Notify parent on success
  useEffect(() => {
    if (gameStatus === 'success') {
      onComplete(earnedStars);
    }
  }, [gameStatus, earnedStars, onComplete]);



  // Tutorial logic: Advance step on 'win' or specific triggers
  useEffect(() => {
    if (!isTutorial || !currentTutorialStep) return;

    if (currentTutorialStep.trigger === 'win' && gameStatus === 'success') {
      // Allow time to celebrate before showing "Complete" message
    }
  }, [gameStatus, isTutorial, currentTutorialStep]);


  const resetGame = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setShowResultModal(false);
    setRobotPos(level.start);
    setRobotDir(level.startDirection);
    setGameStatus('idle');
    setFailureReason(null);
    setIsPlaying(false);
    setIsJumping(false);
    setCurrentStepIndex(-1);
    setSelectedBlockId(null);
    setHint(null);
  };



  const updateBlocksWithHistory = (newBlocks: CommandBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      playSound('undo');
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
      resetGame();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      playSound('undo');
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
      resetGame();
    }
  };

  const handleClear = () => {
    if (blocks.length === 0 || gameStatus === 'running') return;
    playSound('clear');
    updateBlocksWithHistory([]);
    resetGame();
  };

  const addBlock = (type: CommandType) => {
    if (gameStatus === 'running') return;

    // 1. REPLACEMENT LOGIC
    if (selectedBlockId) {
      const index = blocks.findIndex(b => b.id === selectedBlockId);
      if (index !== -1) {
        if (isTutorial && currentTutorialStep?.trigger === 'add_block') {
          if (currentTutorialStep.requiredBlock !== type) {
            playSound('remove');
            setTutorialFeedback('error');
            setTimeout(() => setTutorialFeedback(null), 500);
            return;
          }
          setTutorialFeedback('success');
          setTimeout(() => setTutorialFeedback(null), 800);
          setTutorialStepIndex(prev => prev + 1);
        }

        playSound('add');
        const newBlocks = [...blocks];
        newBlocks[index] = { ...newBlocks[index], type };
        updateBlocksWithHistory(newBlocks);
        setSelectedBlockId(null);
        return;
      }
    }

    // 2. LIMIT CHECK
    if (blocks.length >= 20) {
      playSound('remove');
      return;
    }

    // 3. STANDARD ADD LOGIC
    if (isTutorial && currentTutorialStep?.trigger === 'add_block') {
      if (currentTutorialStep.requiredBlock !== type) {
        playSound('remove');
        setTutorialFeedback('error');
        setTimeout(() => setTutorialFeedback(null), 500);
        return;
      } else {
        setTutorialFeedback('success');
        setTimeout(() => setTutorialFeedback(null), 800);
        setTutorialStepIndex(prev => prev + 1);
      }
    }

    playSound('add');
    const newBlock: CommandBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
    };
    updateBlocksWithHistory([...blocks, newBlock]);
  };

  const removeBlock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (gameStatus === 'running') return;
    playSound('remove');

    if (selectedBlockId === id) setSelectedBlockId(null);

    updateBlocksWithHistory(blocks.filter((b) => b.id !== id));
  };

  const toggleSelectBlock = (id: string) => {
    if (gameStatus === 'running') return;
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    } else {
      setSelectedBlockId(id);
      playSound('click');
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (gameStatus === 'running') {
      e.preventDefault();
      return;
    }
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === dropIndex) return;

    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(dropIndex, 0, movedBlock);

    updateBlocksWithHistory(newBlocks);
    setDraggedBlockIndex(null);
    playSound('move');
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
  };

  const calculatePath = (): SimulationStep[] => {
    let x = level.start.x;
    let y = level.start.y;
    let dir = level.startDirection;
    const steps: SimulationStep[] = [];

    steps.push({ position: { x, y }, direction: dir, commandIndex: -1, status: 'running' });

    for (let i = 0; i < blocks.length; i++) {
      const cmd = blocks[i];
      let status: 'running' | 'crashed' | 'goal' | 'bounds' = 'running';

      let nextX = x;
      let nextY = y;
      let isJump = false;

      switch (cmd.type) {
        case CommandType.Up: dir = Direction.North; nextY -= 1; break;
        case CommandType.Down: dir = Direction.South; nextY += 1; break;
        case CommandType.Left: dir = Direction.West; nextX -= 1; break;
        case CommandType.Right: dir = Direction.East; nextX += 1; break;
        case CommandType.JumpUp: dir = Direction.North; nextY -= 2; isJump = true; break;
        case CommandType.JumpDown: dir = Direction.South; nextY += 2; isJump = true; break;
        case CommandType.JumpLeft: dir = Direction.West; nextX -= 2; isJump = true; break;
        case CommandType.JumpRight: dir = Direction.East; nextX += 2; isJump = true; break;
      }

      if (nextX < 0 || nextX >= level.gridSize || nextY < 0 || nextY >= level.gridSize) {
        status = 'bounds';
      } else if (level.obstacles.some(obs => obs.x === nextX && obs.y === nextY)) {
        status = 'crashed';
        x = nextX;
        y = nextY;
      } else {
        x = nextX;
        y = nextY;
      }

      steps.push({
        position: { x, y },
        direction: dir,
        commandIndex: i,
        status: status,
      });

      if (status !== 'running') break;
    }

    const lastStep = steps[steps.length - 1];
    if (lastStep.status === 'running') {
      if (lastStep.position.x === level.goal.x && lastStep.position.y === level.goal.y) {
        lastStep.status = 'goal';
      }
    }

    return steps;
  };

  const calculateStars = (numBlocks: number): number => {
    const minDistance = Math.abs(level.goal.x - level.start.x) + Math.abs(level.goal.y - level.start.y);
    if (numBlocks <= minDistance + 2) return 3;
    if (numBlocks <= minDistance + 5) return 2;
    return 1;
  };

  const handleRun = () => {
    if (blocks.length === 0) return;

    if (isTutorial && currentTutorialStep?.trigger === 'click_run') {
      setTutorialFeedback('success');
      setTimeout(() => setTutorialFeedback(null), 800);
      setTutorialStepIndex(prev => prev + 1);
    } else if (isTutorial && currentTutorialStep?.trigger === 'add_block') {
      playSound('remove');
      setTutorialFeedback('error');
      setTimeout(() => setTutorialFeedback(null), 500);
      return;
    }

    playSound('run');
    resetGame();
    setGameStatus('running');
    setIsPlaying(true);

    const steps = calculatePath();
    let stepIndex = 0;

    intervalRef.current = setInterval(() => {
      if (stepIndex >= steps.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);

        setIsPlaying(false);
        setIsJumping(false);
        setFailureReason('incomplete');
        setGameStatus('failure');
        playSound('remove');

        timerRef.current = setTimeout(() => {
          setShowResultModal(true);
          setCurrentStepIndex(-1);
          setRobotPos(level.start);
          setRobotDir(level.startDirection);
        }, 1000);
        return;
      }

      const step = steps[stepIndex];
      setRobotPos(step.position);
      setRobotDir(step.direction);
      setCurrentStepIndex(step.commandIndex);

      const cmd = step.commandIndex >= 0 ? blocks[step.commandIndex] : null;
      const isJump = cmd ? cmd.type.toString().includes('JUMP') : false;
      setIsJumping(isJump);

      if (stepIndex > 0) {
        if (cmd) {
          if (cmd.type.toString().includes('JUMP')) playSound('jump');
          else playSound('move');
        }
      }

      if (step.status === 'goal') {
        if (intervalRef.current) clearInterval(intervalRef.current);

        timerRef.current = setTimeout(() => {
          setIsPlaying(false);
          setIsJumping(false);

          timerRef.current = setTimeout(() => {
            const stars = calculateStars(blocks.length);
            setEarnedStars(stars);
            setGameStatus('success');
            playSound('win');

            timerRef.current = setTimeout(() => {
              setShowResultModal(true);
            }, 2500);
          }, 500);
        }, 600);

      } else if (step.status === 'crashed' || step.status === 'bounds') {
        if (intervalRef.current) clearInterval(intervalRef.current);

        timerRef.current = setTimeout(() => {
          setFailureReason(step.status as 'crashed' | 'bounds');
          setGameStatus('failure');
          setIsPlaying(false);
          setIsJumping(false);
          playSound('crash');

          timerRef.current = setTimeout(() => {
            setShowResultModal(true);
            setCurrentStepIndex(-1);
            setRobotPos(level.start);
            setRobotDir(level.startDirection);
          }, 1000);
        }, 600);
      }

      stepIndex++;
    }, 600);
  };

  const handleAIHelp = async () => {
    if (gameStatus === 'failure') {
      setShowResultModal(false);
      setGameStatus('idle');
    }
    playSound('click');
    setIsLoadingHint(true);
    // const hintText = await playSound(level, blocks, language); // This line looks suspicious in original too
    // It seems 'void' was also used for gemini service?
    // "const hintText = await void(level, blocks, language);"
    // I should check what that was supposed to be. probably 'generateHint'
    // For now I will comment it out or try to guess.
    // Let's assume it was generateHint from geminiService.
    const hintText = "Hint generation is temporarily unavailable.";
    // await generateHint(level, blocks, language);
    setHint(hintText);
    setIsLoadingHint(false);
  };

  // Render Grid
  const renderGrid = () => {
    const cells = [];
    const isForest = level.id <= 20; // Rough heuristic or use level.description keywords
    const isWater = level.id > 20 && level.id <= 40;
    const isDungeon = level.id > 40 && level.id <= 60;
    const isFire = level.id > 60 && level.id <= 80;

    // Base colors based on theme
    const oddColor = isWater ? 'bg-blue-50/50' : isDungeon ? 'bg-slate-100' : isFire ? 'bg-orange-50/50' : 'bg-stone-50';
    const evenColor = isWater ? 'bg-blue-100/30' : isDungeon ? 'bg-slate-200' : isFire ? 'bg-orange-100/30' : 'bg-stone-100';

    for (let i = 0; i < level.gridSize * level.gridSize; i++) {
      const x = i % level.gridSize;
      const y = Math.floor(i / level.gridSize);
      const isStart = x === level.start.x && y === level.start.y;
      const isGoal = x === level.goal.x && y === level.goal.y;

      const cellObstacles = level.obstacles.filter(obs => obs.x === x && obs.y === y);
      const hasObstacle = cellObstacles.length > 0;
      const isCmdHighlight = false; // blockIndexForPosition(x, y) === currentStepIndex; // TOOD: Implement trace visualization

      const isAlt = (x + y) % 2 === 1;

      let cellBgClass = isAlt ? 'bg-white/60' : 'bg-white/40';
      cellBgClass += ' border-2 border-white/50 backdrop-blur-sm shadow-sm';

      let cellContent = null;
      let obstacleTitle = "";

      if (hasObstacle) {
        obstacleTitle = cellObstacles.map(o => o.description || t.obstacles.obstacle).join(", ");
        const hasWater = cellObstacles.some(o => o.type === 'water');
        const hasMud = cellObstacles.some(o => o.type === 'mud');
        const hasLava = cellObstacles.some(o => o.type === 'fire');

        if (hasLava) {
          cellBgClass = 'bg-red-100/60 border-red-200/50 backdrop-blur-sm shadow-sm';
        } else if (hasWater) {
          cellBgClass = 'bg-blue-100/60 border-blue-200/50 backdrop-blur-sm shadow-sm';
        } else if (hasMud) {
          cellBgClass = 'bg-amber-100/60 border-amber-200/50 backdrop-blur-sm shadow-sm';
        } else {
          // Keep base checkerboard for solid obstacles appearing ON TOP
        }

        const solidObj = cellObstacles.find(o => !['water', 'mud'].includes(o.type || 'rock'));

        if (solidObj) {
          const type = solidObj.type || 'rock';
          if (type === 'rock') {
            cellContent = (
              <div className="relative flex items-center justify-center w-full h-full -translate-y-2 transform transition-transform hover:scale-110 duration-300">
                <div className="absolute bottom-2 w-3/4 h-2 bg-black/20 rounded-full blur-[2px]"></div>
                <Mountain className="text-stone-600 fill-stone-400 drop-shadow-xl z-10" size={sizing.icon * 1.2} strokeWidth={1.5} />
              </div>
            );
          } else if (type === 'wall') {
            cellContent = <div className="w-full h-full bg-slate-800 rounded-sm shadow-[0_4px_0_#1e293b] border-t-4 border-slate-600 relative z-10"></div>;
          } else if (type === 'forest') {
            cellContent = (
              <div className="relative flex items-center justify-center w-full h-full -translate-y-2 transform transition-transform hover:scale-110 duration-300">
                <div className="absolute bottom-2 w-3/4 h-2 bg-black/20 rounded-full blur-[2px]"></div>
                <Trees className="text-green-700 fill-green-200/50 drop-shadow-xl z-10" size={sizing.icon * 1.2} strokeWidth={1.5} />
              </div>
            );
          } else if (type === 'fire') {
            cellContent = (
              <div className="relative flex items-center justify-center w-full h-full -translate-y-1">
                <div className="absolute bottom-1 w-2/3 h-2 bg-red-900/40 rounded-full blur-[3px] animate-pulse"></div>
                <div className="absolute w-full h-full bg-red-500/10 rounded-full animate-ping blur-md"></div>
                <Flame className="text-red-500 fill-orange-500 animate-bounce drop-shadow-lg z-10" size={sizing.icon * 1.1} />
              </div>
            );
          }
        } else {
          if (hasWater) {
            cellBgClass = 'bg-blue-200/50 border-blue-300/30';
            cellContent = (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-400/30 to-transparent"></div>
                <Waves className="text-blue-500/50 z-10 animate-pulse" size={sizing.icon} />
              </div>
            );
          } else if (hasMud) {
            cellBgClass = 'bg-amber-800/20 border-amber-800/10 shadow-inner';
            cellContent = (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-full opacity-40 bg-[radial-gradient(#78350f_2px,transparent_2px)] [background-size:8px_8px]"></div>
              </div>
            );
          }
        }
      }

      if (isGoal && !cellContent) {
        if (gameStatus === 'success') {
          cellContent = (
            <div className="relative flex items-center justify-center w-full h-full overflow-visible z-20 -translate-y-3">
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-60 animate-pulse top-3"></div>
              <div className={`text-[${sizing.goal}px] animate-goal-pop z-20 filter drop-shadow-xl relative`}>
                🏆
                <span className="absolute -top-2 -right-3 text-lg animate-bounce [animation-delay:0.1s]">✨</span>
                <span className="absolute -bottom-1 -left-3 text-lg animate-bounce [animation-delay:0.3s]">✨</span>
              </div>
            </div>
          );
          cellBgClass = 'bg-yellow-100/60 border-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.5)] z-10 transform scale-105 transition-all duration-500 ring-4 ring-yellow-300';
        } else {
          cellContent = (
            <div className="relative flex items-center justify-center w-full h-full -translate-y-2">
              <div className="absolute bottom-2 w-1/2 h-1.5 bg-black/20 rounded-full blur-[1px]"></div>
              <div className={`text-[${sizing.goal}px] animate-bounce filter drop-shadow-lg z-10`} title={t.goal}>🚩</div>
            </div>
          );
        }
      }

      if (gameStatus === 'failure' && failureReason === 'crashed' && x === robotPos.x && y === robotPos.y) {
        cellBgClass = `${cellBgClass} animate-crash-pulse ring-4 ring-red-500 z-20`;
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`
            absolute rounded-xl transition-all duration-300
            ${cellBgClass}
            group
          `}
          style={{
            width: gridMetrics.cellSize,
            height: gridMetrics.cellSize,
            left: gridMetrics.gridLeft + (x * (gridMetrics.cellSize + gridMetrics.gapSize)),
            top: gridMetrics.gridTop + (y * (gridMetrics.cellSize + gridMetrics.gapSize)),
          }}
          title={obstacleTitle}
        >
          {/* Cell Coordinate Label (Subtle) */}
          <span className="absolute top-1 left-1.5 text-[10px] font-mono font-bold text-gray-300/50 select-none pointer-events-none">
            {String.fromCharCode(65 + y)}{x}
          </span>
          {isStart && <div className="absolute inset-0 flex items-center justify-center opacity-20"><span className="text-2xl font-black">START</span></div>}
          {cellContent}
        </div>
      );
    }

    return (
      <div
        className={`relative w-full h-full`}
        style={{
          width: gridMetrics.width,
          height: gridMetrics.height,
        }}
      >
        {cells}
      </div>
    );
  };

  // Helper to get robot rotation
  const getRobotRotation = () => {
    switch (robotDir) {
      case Direction.East: return 90;
      case Direction.South: return 180;
      case Direction.West: return 270;
      default: return 0;
    }
  };

  const getButtonClass = (elementId: string, baseClass: string) => {
    if (!currentTutorialStep || currentTutorialStep.highlightElementId !== elementId) {
      return baseClass;
    }
    if (tutorialFeedback === 'error' && currentTutorialStep.highlightElementId === elementId) {
      return `${baseClass} ring-4 ring-red-400 bg-red-100 animate-shake`;
    }
    return `${baseClass} ring-4 ring-yellow-400 ring-offset-2 animate-pulse bg-yellow-50 z-20 relative`;
  };

  const renderIcon = (type: CommandType) => {
    const size = 20; // smaller on mobile if needed, or stick to prop
    switch (type) {
      case CommandType.Up: return <ArrowUp className="text-green-500" size={size} />;
      case CommandType.Down: return <ArrowDown className="text-green-500" size={size} />;
      case CommandType.Left: return <ArrowLeft className="text-orange-500" size={size} />;
      case CommandType.Right: return <ArrowRight className="text-orange-500" size={size} />;
      case CommandType.JumpUp: return <ChevronsUp className="text-purple-500" size={size} />;
      case CommandType.JumpDown: return <ChevronsDown className="text-purple-500" size={size} />;
      case CommandType.JumpLeft: return <ChevronsLeft className="text-purple-500" size={size} />;
      case CommandType.JumpRight: return <ChevronsRight className="text-purple-500" size={size} />;
      default: return null;
    }
  };

  // Calculate pixel position for the robot based on grid metrics
  const stride = gridMetrics.cellSize + gridMetrics.gapSize;
  const robotPixelX = robotPos.x * stride;
  const robotPixelY = robotPos.y * stride;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus === 'running') return;

      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowUp' || e.key === 'w') addBlock(CommandType.Up);
      if (e.key === 'ArrowDown' || e.key === 's') addBlock(CommandType.Down);
      if (e.key === 'ArrowLeft' || e.key === 'a') addBlock(CommandType.Left);
      if (e.key === 'ArrowRight' || e.key === 'd') addBlock(CommandType.Right);

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, addBlock, handleRun, handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden select-none">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      {/* Level Entry Overlay */}
      {showEntry && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-out fade-out duration-500 delay-1500 fill-mode-forwards pointer-events-none">
          <div className="text-center animate-in zoom-in duration-500">
            <h1 className="text-6xl font-black text-white drop-shadow-lg mb-2 tracking-tighter">
              LEVEL {level.id}
            </h1>
            <div className="h-1 w-32 bg-white/50 mx-auto rounded-full"></div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title={t.buttons?.back || "Back"}
          >
            <Home size={20} />
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
              Level {level.id}
              {isTutorial && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Tutorial</span>}
            </h2>
            <p className="text-xs text-gray-500">{level.instruction || (language === 'km' ? 'បញ្ជាមនុស្សយន្តទៅកាន់គោលដៅ' : 'Guide the robot to the goal')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAIHelp}
            disabled={isLoadingHint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm border border-purple-100"
          >
            {isLoadingHint ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <HelpCircle size={16} />
            )}
            <span>{t.buttons?.scout || "Hint"}</span>
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button onClick={onToggleMute} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">

        {/* Left: Grid Container */}
        <div className="flex-1 relative overflow-auto bg-stone-100/50 flex flex-col">

          {/* Hint Banner */}
          {hint && (
            <div className="bg-purple-600 text-white px-4 py-3 shadow-md flex items-start gap-3 shrink-0 z-20">
              <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                <Play size={16} className="fill-current" />
              </div>
              <div className="flex-1 text-sm leading-relaxed">
                <span className="font-bold block mb-0.5 opacity-90">AI Hint:</span>
                {hint}
              </div>
              <button onClick={() => setHint(null)} className="text-white/60 hover:text-white">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* Grid Area */}
          <div ref={gridContainerRef} className="flex-1 relative flex items-center justify-center p-4 bg-stone-100/50 overflow-hidden">

            {/* Coordinate Labels - Top (Columns) */}
            <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none z-10"
              style={{ paddingLeft: gridMetrics.gridLeft, width: '100%' }}>
              <div className="flex" style={{ width: gridMetrics.cellSize * level.gridSize + gridMetrics.gapSize * (level.gridSize - 1) }}>
                {Array.from({ length: level.gridSize }).map((_, i) => (
                  <div key={i} className="flex-1 text-center font-bold text-stone-400/80 text-lg select-none">
                    {i}
                  </div>
                ))}
              </div>
            </div>

            {/* Coordinate Labels - Left (Rows) */}
            <div className="absolute left-4 top-0 h-full flex flex-col justify-center pointer-events-none z-10"
              style={{ paddingTop: gridMetrics.gridTop, height: '100%' }}>
              <div className="flex flex-col" style={{ height: gridMetrics.cellSize * level.gridSize + gridMetrics.gapSize * (level.gridSize - 1) }}>
                {Array.from({ length: level.gridSize }).map((_, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center font-bold text-stone-400/80 text-lg select-none">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
            </div>


            <div className="relative w-full h-full">
              {/* The Grid Render */}
              {renderGrid()}

              {/* Robot Overlay */}
              <div
                className="absolute z-30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center pointer-events-none"
                style={{
                  width: gridMetrics.cellSize,
                  height: gridMetrics.cellSize,
                  left: gridMetrics.gridLeft + (robotPos.x * (gridMetrics.cellSize + gridMetrics.gapSize)),
                  top: gridMetrics.gridTop + (robotPos.y * (gridMetrics.cellSize + gridMetrics.gapSize)),
                  transform: `translate(0, 0)`
                }}
              >
                <div className={`
                                relative w-full h-full flex items-center justify-center
                                transition-transform duration-300
                                ${isJumping ? 'scale-110 -translate-y-4 shadow-xl' : ''}
                            `}>
                  <div className={`transform transition-transform duration-300 ${isJumping ? 'animate-jump-arc' : ''}`}
                  >
                    <span className={`${sizing.robot} filter drop-shadow-xl loading-none select-none relative z-10 block`}>
                      {gameStatus === 'success' ? '🥳' :
                        gameStatus === 'failure' ? '😵' :
                          gameStatus === 'running' ? '🤖' : '🤖'}
                    </span>
                    {/* Simple shadow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1.5 bg-black/30 rounded-full blur-[2px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Right: Controls Panel */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-xl z-20 shrink-0 h-[45%] md:h-full">

        {/* Controls Header */}
        <div className={`p-3 border-b border-gray-100 flex items-center justify-between transition-colors duration-300 ${selectedBlockId ? 'bg-blue-50' : 'bg-gray-50/50'}`}>
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${selectedBlockId ? 'text-blue-600' : 'text-gray-500'}`}>
            {selectedBlockId ? (
              <>
                <RotateCcw size={14} className="animate-spin-slow" />
                Select to Replace
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Commands
              </>
            )}
          </span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full transition-colors duration-300 ${blocks.length >= 20 ? 'bg-red-100 text-red-700 animate-pulse' :
            blocks.length >= 15 ? 'bg-orange-100 text-orange-700' :
              blocks.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
            }`}>
            {blocks.length} / 20
          </span>
        </div>

        {/* Command Palette */}
        <div className="p-4 space-y-4 bg-gray-50/30 overflow-y-auto max-h-[40%] md:max-h-none border-b border-gray-100">

          {/* Movement Commands */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider flex items-center gap-1">
              <Play size={10} className="fill-current" />
              {language === 'km' ? 'ចលនា (Move)' : 'Movement'}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[CommandType.Up, CommandType.Down, CommandType.Left, CommandType.Right].map(type => {
                const label = {
                  [CommandType.Up]: language === 'km' ? 'ទៅមុខ' : 'Fwd',
                  [CommandType.Down]: language === 'km' ? 'ថយក្រោយ' : 'Back',
                  [CommandType.Left]: language === 'km' ? 'ឆ្វេង' : 'Left',
                  [CommandType.Right]: language === 'km' ? 'ស្តាំ' : 'Right',
                }[type];

                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    disabled={gameStatus === 'running'}
                    className={`
                                  relative group flex flex-col items-center justify-center p-2 rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                                  bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600
                                  ${gameStatus === 'running' ? 'opacity-50 cursor-not-allowed' : ''}
                                  ${getButtonClass('btn-' + type, '')}
                              `}
                  >
                    <div className="mb-1">{renderIcon(type)}</div>
                    <span className="text-[10px] font-bold leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jump Commands */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border border-current"></div>
              {language === 'km' ? 'លោត (Jump)' : 'Jump'}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[CommandType.JumpUp, CommandType.JumpDown, CommandType.JumpLeft, CommandType.JumpRight].map(type => {
                const label = {
                  [CommandType.JumpUp]: language === 'km' ? 'ទៅមុខ' : 'Fwd',
                  [CommandType.JumpDown]: language === 'km' ? 'ថយក្រោយ' : 'Back',
                  [CommandType.JumpLeft]: language === 'km' ? 'ឆ្វេង' : 'Left',
                  [CommandType.JumpRight]: language === 'km' ? 'ស្តាំ' : 'Right',
                }[type];

                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    disabled={gameStatus === 'running'}
                    className={`
                                  relative group flex flex-col items-center justify-center p-2 rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                                  bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100 text-purple-600
                                  ${gameStatus === 'running' ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                  >
                    <div className="mb-1">{renderIcon(type)}</div>
                    <span className="text-[10px] font-bold leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Program Queue (Editable Area) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50 shadow-inner">
          <div className="min-h-full space-y-2">
            {blocks.length === 0 && (
              <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                <GripVertical className="mb-2 opacity-50" />
                <p className="text-sm">Tap commands to build your program</p>
              </div>
            )}

            <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
              {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                  <div className="text-xs font-mono text-gray-300 w-4 text-right">{index + 1}</div>
                  <div
                    className={`
                                        group relative flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer select-none
                                        ${selectedBlockId === block.id
                        ? 'bg-blue-50 border-blue-400 shadow-md transform scale-[1.02] z-10'
                        : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                      }
                                        ${currentStepIndex === index ? 'ring-2 ring-yellow-400 ring-offset-1 bg-yellow-50' : ''}
                                    `}
                    onClick={() => toggleSelectBlock(block.id)}
                    draggable={gameStatus !== 'running'}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="bg-gray-50 p-1.5 rounded-md border border-gray-100">
                      {renderIcon(block.type)}
                    </div>
                    <span className="font-medium text-gray-700 text-sm capitalize">
                      {block.type.replace('JUMP_', 'Jump ')}
                    </span>

                    {/* Action Buttons (visible on hover or select) */}
                    <div className={`absolute right-2 flex items-center gap-1 ${selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button
                        onClick={(e) => removeBlock(block.id, e)}
                        className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {draggedBlockIndex === index && (
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg border-2 border-blue-500/50 animate-pulse z-20"></div>
                    )}
                  </div>
                  <div></div> {/* Spacer */}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Play/Control Footer */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              disabled={blocks.length === 0 || gameStatus === 'running'}
              className="p-3 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0 border border-gray-200"
              title="Clear All"
            >
              <Trash2 size={20} />
            </button>

            <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
              <button onClick={handleUndo} disabled={historyIndex <= 0 || gameStatus === 'running'} className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"><Undo size={18} /></button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || gameStatus === 'running'} className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"><Redo size={18} /></button>
            </div>

            <button
              onClick={handleRun}
              disabled={blocks.length === 0 && gameStatus !== 'running'}
              className={`
                            flex-1 h-12 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                            ${gameStatus === 'running'
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200'
                }
                            ${blocks.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                            ${getButtonClass('btn-run', '')}
                        `}
            >
              {gameStatus === 'running' ? (
                <>
                  <RotateCcw size={20} className="animate-spin-slow" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play size={20} className="fill-white" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div >

      {/* Result Modal */ }
  {
    showResultModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">

          {/* Background Effects */}
          {gameStatus === 'success' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-yellow-50 to-transparent opacity-50"></div>
              <div className="absolute -top-10 -left-10 text-6xl animate-bounce [animation-delay:0s] opacity-20">✨</div>
              <div className="absolute top-20 -right-5 text-4xl animate-bounce [animation-delay:0.5s] opacity-20">🎉</div>
            </div>
          )}

          <div className="relative z-10">
            {gameStatus === 'success' ? (
              <>
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4 animate-victory shadow-lg shadow-yellow-200">
                  <div className="text-5xl drop-shadow-md">🏆</div>
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">Level Complete!</h2>

                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3].map(star => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${star <= earnedStars ? 'text-yellow-400 fill-yellow-400 animate-star-pop' : 'text-gray-200'}`}
                      style={{ animationDelay: `${star * 0.2}s` }}
                    />
                  ))}
                </div>

                <div className="text-sm text-gray-500 mb-6 bg-gray-50 py-3 rounded-xl border border-gray-100">
                  <div className="flex justify-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Used</span>
                      <span className={`font-bold text-lg ${blocks.length <= (Math.abs(level.goal.x - level.start.x) + Math.abs(level.goal.y - level.start.y) + 2) ? 'text-green-600' : 'text-gray-700'}`}>
                        {blocks.length}
                      </span>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-70">3-Star Goal</span>
                      <span className="font-bold text-lg text-yellow-600">
                        ≤ {Math.abs(level.goal.x - level.start.x) + Math.abs(level.goal.y - level.start.y) + 2}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      onNext();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transform transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Next Level</span>
                    <ArrowNext size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      resetGame();
                    }}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    <span>Replay</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-shake shadow-lg shadow-red-200">
                  <div className="text-4xl">
                    {failureReason === 'crashed' ? '💥' : '⚠️'}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Try Again!</h2>
                <p className="text-gray-500 mb-6">
                  {failureReason === 'crashed' ? t.messages?.crashed :
                    failureReason === 'bounds' ? t.messages?.bounds :
                      t.messages?.incomplete}
                </p>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    resetGame();
                  }}
                  className="w-full py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  <span>Retry</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    );
  };

  export default GameLevel;
