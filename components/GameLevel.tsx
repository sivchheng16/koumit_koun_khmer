import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, HelpCircle, ArrowRight as ArrowNext, Home, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, Undo, Redo, Volume2, VolumeX, Star, RefreshCw, Waves, Flame, Trees, Mountain, Check, ThumbsUp, AlertTriangle, XCircle, GripVertical, Replace } from 'lucide-react';
import { LevelConfig, CommandBlock, CommandType, Direction, Position, SimulationStep, ObstacleType, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getHintFromAI } from '../services/geminiService';
import { playSound, toggleMute, getMuteState } from '../services/soundService';

interface GameLevelProps {
  level: LevelConfig;
  onBack: () => void;
  onNext: () => void;
  onComplete: (levelId: number) => void;
  language: Language;
}

const GameLevel: React.FC<GameLevelProps> = ({ level, onBack, onNext, onComplete, language }) => {
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
  const [muted, setMuted] = useState(getMuteState());
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout Metrics for smooth animation
  const gridRef = useRef<HTMLDivElement>(null);
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
    // Dynamic cell sizing handles the grid, icon sizes below are for internal SVG scaling
    icon: isSmallGrid ? 30 : 28, // Increased size for better visibility on small grids
    emoji: isSmallGrid ? 'text-2xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-3xl lg:text-4xl',
    robot: isSmallGrid ? 'text-3xl sm:text-6xl lg:text-7xl' : 'text-3xl sm:text-4xl lg:text-5xl',
    goal: isSmallGrid ? 'text-2xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-3xl lg:text-4xl',
  };

  // Reset when level changes
  useEffect(() => {
    setBlocks([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setTutorialStepIndex(0);
    setTutorialFeedback(null);
    resetGame();
  }, [level]);

  // Measure grid for smooth animation - Responsive
  const updateGridMetrics = useCallback(() => {
    if (gridRef.current && gridRef.current.children.length > 0) {
      const gridRect = gridRef.current.getBoundingClientRect();
      
      // We need at least one cell to measure
      const cell0 = gridRef.current.children[0] as HTMLElement;
      if (!cell0) return;

      const rect0 = cell0.getBoundingClientRect();
      
      // Calculate stride based on grid gap logic
      // If we have more than 1 column, we can measure distance between two cells
      let gapSize = 0;
      if (gridRef.current.children.length > 1 && level.gridSize > 1) {
          const cell1 = gridRef.current.children[1] as HTMLElement;
          const rect1 = cell1.getBoundingClientRect();
          // Check if cell1 is to the right of cell0 (same row)
          if (rect1.top === rect0.top) {
             gapSize = rect1.left - (rect0.left + rect0.width);
          }
      }
      
      // Fallback if gap calculation failed (e.g. 1x1 grid or wrapping issues)
      if (gapSize < 0) gapSize = 4; // approximate sm:gap-1

      setGridMetrics({ 
          cellSize: rect0.width, 
          gapSize: gapSize,
          gridLeft: 0, // Relative to container
          gridTop: 0 
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

    if (gridRef.current) {
        resizeObserver.observe(gridRef.current);
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
      onComplete(level.id);
    }
  }, [gameStatus, level.id, onComplete]);

  // Auto-advance to next level on success
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (gameStatus === 'success') {
      timer = setTimeout(() => {
        onNext();
      }, 4000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [gameStatus, level.id, onNext]);

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

  const handleToggleMute = () => {
      const newState = toggleMute();
      setMuted(newState);
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

    // 2. STANDARD ADD LOGIC
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

      switch(cmd.type) {
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
    const hintText = await getHintFromAI(level, blocks, language);
    setHint(hintText);
    setIsLoadingHint(false);
  };

  // Render Grid
  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < level.gridSize; y++) {
      for (let x = 0; x < level.gridSize; x++) {
        const isStart = x === level.start.x && y === level.start.y;
        const isGoal = x === level.goal.x && y === level.goal.y;
        
        const cellObstacles = level.obstacles.filter(obs => obs.x === x && obs.y === y);
        const hasObstacle = cellObstacles.length > 0;
        
        let cellBgClass = 'bg-stone-50 border-stone-200';
        let cellContent = null;
        let obstacleTitle = "";

        if (hasObstacle) {
            obstacleTitle = cellObstacles.map(o => o.description || t.obstacles.obstacle).join(", ");
            const hasWater = cellObstacles.some(o => o.type === 'water');
            const hasMud = cellObstacles.some(o => o.type === 'mud');
            const hasLava = cellObstacles.some(o => o.type === 'fire');

            if (hasLava) {
                cellBgClass = 'bg-red-50 border-red-200';
            } else if (hasWater) {
                cellBgClass = 'bg-blue-50 border-blue-200';
            } else if (hasMud) {
                cellBgClass = 'bg-amber-50 border-amber-200';
            } else {
                cellBgClass = 'bg-stone-100 border-stone-300';
            }

            const solidObj = cellObstacles.find(o => !['water', 'mud'].includes(o.type || 'rock'));
            
            if (solidObj) {
                const type = solidObj.type || 'rock';
                if (type === 'rock') {
                    cellContent = (
                        <div className="relative flex items-center justify-center w-full h-full">
                             <div className="absolute w-3/4 h-3/4 bg-gray-300 rounded-full opacity-50 blur-[1px] translate-y-1"></div>
                             <Mountain className="text-gray-600 fill-gray-400 drop-shadow-md z-10" size={sizing.icon} strokeWidth={1.5} />
                        </div>
                    );
                } else if (type === 'wall') {
                    cellContent = <span className={`${sizing.emoji} filter drop-shadow-md z-10`}>🧱</span>;
                } else if (type === 'forest') {
                    cellContent = (
                        <div className="relative flex items-center justify-center w-full h-full">
                             <div className="absolute w-3/4 h-3/4 bg-green-200 rounded-full opacity-50 blur-[2px] translate-y-1"></div>
                             <Trees className="text-green-600 fill-green-100 drop-shadow-md z-10" size={sizing.icon} strokeWidth={1.5} />
                        </div>
                    );
                } else if (type === 'fire') {
                     cellContent = (
                        <div className="relative flex items-center justify-center w-full h-full">
                             <div className="absolute w-full h-full bg-red-400 rounded-full opacity-20 animate-pulse blur-md"></div>
                             <Flame className="text-red-500 fill-orange-500 animate-bounce drop-shadow-lg z-10" size={sizing.icon} />
                        </div>
                    );
                }
            } else {
                if (hasWater) {
                    cellContent = (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                             <div className="absolute inset-0 bg-blue-400/10 animate-pulse"></div>
                             <Waves className="text-blue-500 opacity-80 z-10" size={sizing.icon} />
                        </div>
                    );
                } else if (hasMud) {
                    cellContent = (
                         <div className="w-full h-full flex items-center justify-center">
                            <span className={`${sizing.emoji} opacity-60 z-10 grayscale`}>🌫️</span>
                         </div>
                    );
                }
            }
        }

        if (isGoal && !cellContent) {
            if (gameStatus === 'success') {
                 cellContent = (
                    <div className="relative flex items-center justify-center w-full h-full overflow-visible z-10">
                        <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-60 animate-pulse"></div>
                        <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-ping opacity-40"></div>
                        <div className="absolute w-[120%] h-[120%] border-2 border-dashed border-yellow-500/50 rounded-full animate-spin [animation-duration:3s]"></div>
                        <div className={`${sizing.goal} animate-goal-pop z-20 filter drop-shadow-xl relative`}>
                            🏆
                            <span className="absolute -top-2 -right-3 text-lg animate-bounce [animation-delay:0.1s]">✨</span>
                            <span className="absolute -bottom-1 -left-3 text-lg animate-bounce [animation-delay:0.3s]">✨</span>
                        </div>
                    </div>
                 );
                 cellBgClass = 'bg-yellow-100 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.5)] z-10 transform scale-110 transition-all duration-500 ring-4 ring-yellow-300';
            } else {
                 cellContent = <div className={`${sizing.goal} animate-bounce filter drop-shadow-md z-10`} title={t.goal}>🚩</div>;
            }
        }

        if (gameStatus === 'failure' && failureReason === 'crashed' && x === robotPos.x && y === robotPos.y) {
             cellBgClass = `${cellBgClass} animate-crash-pulse ring-4 ring-red-500 z-20`;
        }

        cells.push(
          <div 
            key={`${x}-${y}`} 
            className={`w-full h-full aspect-square border-2 rounded-lg flex items-center justify-center relative shadow-sm overflow-hidden transition-colors duration-300 ${cellBgClass}`}
            title={obstacleTitle}
          >
            {isStart && <div className={`absolute opacity-40 grayscale z-0 ${sizing.emoji}`} title={t.start}></div>}
            {cellContent}
          </div>
        );
      }
    }

    return (
      <div 
        ref={gridRef}
        className={`grid gap-1 py-2 m-auto relative w-full h-full content-center justify-center`}
        style={{ 
            gridTemplateColumns: `repeat(${level.gridSize}, 1fr)`,
        }}
      >
        {cells}
      </div>
    );
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
      switch(type) {
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

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto p-2 sm:p-4 gap-3 relative overflow-hidden">
      
      {/* SUCCESS MODAL POPUP */}
      {gameStatus === 'success' && showResultModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 rounded-3xl animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md text-center border-4 border-blue-100 transform transition-all scale-100">
                <div className="mb-4 flex justify-center">
                     <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                        <span className="text-3xl sm:text-4xl">🎉</span>
                     </div>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-black text-blue-600 mb-2">{t.victory}</h2>
                <p className="text-gray-500 mb-6 text-sm sm:text-base">{t.successMsg}</p>
                
                <div className="flex justify-center gap-3 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="relative">
                            <Star 
                                size={48} 
                                className={`${i <= earnedStars ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' : 'text-gray-200 fill-gray-100'} animate-star-pop transform scale-75 sm:scale-100`} 
                                style={{ animationDelay: `${i * 200}ms`}}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => {
                            setGameStatus('idle');
                            resetGame();
                        }} 
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <RefreshCw size={20} />
                        {t.replay}
                    </button>
                    <button 
                        onClick={onNext} 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {t.nextLevel}
                        <ArrowNext size={20}/>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* FAILURE MODAL POPUP */}
      {gameStatus === 'failure' && showResultModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 rounded-3xl animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md text-center border-4 ${failureReason === 'incomplete' ? 'border-orange-100' : 'border-red-100'} transform transition-all scale-100`}>
                <div className="mb-4 flex justify-center">
                     <div className={`w-16 h-16 sm:w-20 sm:h-20 ${failureReason === 'incomplete' ? 'bg-orange-100' : 'bg-red-100'} rounded-full flex items-center justify-center shadow-inner animate-pulse`}>
                        {failureReason === 'bounds' ? <XCircle className="text-red-500 w-8 h-8 sm:w-10 sm:h-10" /> : 
                         failureReason === 'incomplete' ? <HelpCircle className="text-orange-500 w-8 h-8 sm:w-10 sm:h-10" /> :
                         <AlertTriangle className="text-red-500 w-8 h-8 sm:w-10 sm:h-10" />}
                     </div>
                </div>
                
                <h2 className={`text-2xl sm:text-3xl font-black ${failureReason === 'incomplete' ? 'text-orange-600' : 'text-red-600'} mb-2`}>
                    {failureReason === 'bounds' ? t.outOfBounds : 
                     failureReason === 'incomplete' ? t.incomplete :
                     t.crash}
                </h2>
                <p className="text-gray-500 mb-6 text-sm sm:text-base">
                    {failureReason === 'bounds' ? t.outOfBoundsDetail : 
                     failureReason === 'incomplete' ? t.incompleteDetail :
                     t.crashDetail}
                </p>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleAIHelp}
                        className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <HelpCircle size={20} />
                        {t.help}
                    </button>
                    <button 
                        onClick={() => {
                            setGameStatus('idle');
                            resetGame();
                        }} 
                        className={`flex-1 ${failureReason === 'incomplete' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'} text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 text-sm sm:text-base`}
                    >
                        <RefreshCw size={20} />
                        {t.tryAgain}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-2 sm:p-3 rounded-xl shadow-md flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                <Home size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div>
                <h2 className="font-bold text-base sm:text-xl text-blue-700 line-clamp-1">{level.name}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">{level.description}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleMute}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${muted ? 'text-gray-400' : 'text-blue-600'}`}
                title={muted ? "Unmute" : "Mute"}
            >
                {muted ? <VolumeX size={20} className="sm:w-6 sm:h-6" /> : <Volume2 size={20} className="sm:w-6 sm:h-6" />}
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button 
                onClick={handleAIHelp}
                className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors font-bold text-xs sm:text-sm whitespace-nowrap"
            >
                <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden xs:inline">{t.help}</span>
            </button>
        </div>
      </div>

      {/* Main Game Area - Responsive Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 flex-grow overflow-hidden h-full relative">
        
        {/* Left: Game Grid - Responsive Sizing */}
        {/* On mobile, this container takes natural height up to a max limit, on desktop it fills available space */}
        <div className="lg:flex-grow lg:h-full flex-shrink-0 bg-blue-100 rounded-2xl shadow-xl border-[4px] sm:border-[6px] border-blue-300 flex flex-col relative overflow-hidden transition-all h-[40vh] sm:h-[50vh] lg:h-auto">
           
           {isTutorial && currentTutorialStep && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-30 w-[95%] max-w-lg pointer-events-none transition-all  duration-3000">
                <div 
                    key={tutorialStepIndex}
                    className={`
                        bg-white/95 backdrop-blur-sm border-2 border-yellow-400 rounded-2xl p-2 sm:p-3 shadow-xl animate-in slide-in-from-bottom-5 pointer-events-auto flex items-center gap-3 relative overflow-hidden
                        ${tutorialFeedback === 'error' ? 'animate-bounce border-red-500 bg-red-50' : ''}
                    `}
                >
                    <div className="text-xl sm:text-3xl  bg-blue-100 rounded-full p-1 z-10">🤖</div>
                    <div className="flex-1 z-10">
                        <p className="text-sm sm:text-lg font-bold text-gray-800">{currentTutorialStep.message}</p>
                    </div>
                  
                </div>
            </div>
           )}

           <div className="flex-grow overflow-hidden flex items-center justify-center p-2 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle, #dbeafe 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {/* Dynamic Container: Fits width OR height depending on aspect ratio */}
                <div className="relative w-full max-w-[min(90vw,35vh)] sm:max-w-[min(80vw,50vh)] lg:max-w-[min(45vw,75vh)] aspect-square">
                    {/* Render the static grid */}
                    {renderGrid()}

                    {/* Render the Robot as an absolute overlay for smooth translation */}
                    <div 
                        className="absolute top-0 left-0 pointer-events-none z-30"
                        style={{
                            width: gridMetrics.cellSize,
                            height: gridMetrics.cellSize,
                            // Use smooth translation based on pixel calculations
                            transform: `translate(${robotPixelX}px, ${robotPixelY}px)`,
                            transition: 'transform 500ms ease-in-out',
                        }}
                    >
                         {/* Confetti Overlay */}
                         {gameStatus === 'success' && (
                             <>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-2xl animate-confetti" style={{ animationDelay: '0ms', left: '20%' }}>🎉</div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-2xl animate-confetti" style={{ animationDelay: '100ms', left: '80%' }}>🎊</div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-2xl animate-confetti" style={{ animationDelay: '200ms', left: '50%' }}>⭐</div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-2xl animate-confetti" style={{ animationDelay: '300ms', left: '30%' }}>✨</div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-2xl animate-confetti" style={{ animationDelay: '150ms', left: '70%' }}>🎈</div>
                             </>
                         )}

                         {/* Shadow */}
                         <div className={`absolute bottom-1 left-1 right-1 h-2 sm:h-3 bg-black/20 rounded-[100%] blur-[2px] transition-all duration-500 ease-in-out ${isJumping ? 'scale-x-25 scale-y-25 opacity-20 translate-y-4 blur-sm' : 'scale-100 opacity-70'}`} />

                         {/* Success Text Overlay */}
                         {gameStatus === 'success' && (
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-max z-50 animate-float-text pointer-events-none">
                                <span className="text-xl sm:text-3xl font-black text-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] stroke-2 stroke-white">
                                    {t.victory}!
                                </span>
                             </div>
                         )}

                         <div 
                            className={`w-full h-full flex items-center justify-center transition-transform duration-500 ease-in-out ${isPlaying || gameStatus === 'success' ? 'scale-110' : 'scale-100'}`}
                            style={{
                                transform: gameStatus === 'failure' && failureReason !== 'incomplete' ? 'scale(1.2)' : `${isPlaying || gameStatus === 'success' ? 'scale(1.1)' : ''}`
                            }}
                         >
                            {/* "Bobbing" animation container for walking effect */}
                            <div key={currentStepIndex} className={`w-full h-full flex items-center justify-center transition-transform duration-500 ease-in-out ${isJumping ? 'animate-jump-arc' : ''}`}>
                                
                                {/* Jump Action Lines */}
                                {isJumping && (
                                    <div className="absolute -bottom-2 flex gap-1 justify-center w-full z-10">
                                         <div className="relative">
                                            <Flame size={12} className="text-orange-400 fill-yellow-200 animate-pulse rotate-180 opacity-60" />
                                            <div className="absolute top-0 left-0 w-full h-full bg-orange-300 blur-sm rounded-full animate-ping opacity-50"></div>
                                         </div>
                                    </div>
                                )}
                                
                                <div className={`transition-all duration-300 ${!isJumping && isPlaying ? 'animate-bounce' : ''} ${gameStatus === 'success' ? 'animate-victory' : ''} ${gameStatus === 'failure' && failureReason === 'crashed' ? 'animate-shake' : ''}`} style={{ animationDuration: isPlaying ? '600ms' : '1s' }}>
                                    {gameStatus === 'failure' && failureReason !== 'incomplete' ? (
                                        <div className="text-3xl sm:text-5xl lg:text-6xl animate-pulse">💥</div>
                                    ) : (
                                        <div className={`relative ${sizing.robot} filter drop-shadow-xl`}>
                                            {gameStatus === 'failure' && failureReason === 'incomplete' ? '🤔' : '🤖'}
                                            
                                            {gameStatus === 'success' && (
                                                <>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl sm:text-4xl animate-bounce z-20 drop-shadow-lg">👑</div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
           </div>
           
           {/* Hint Toast */}
           <div className="absolute bottom-0 w-full p-2 pointer-events-none flex flex-col items-center gap-2">
               {hint && (
                 <div className="pointer-events-auto bg-white/95 border-2 border-purple-300 p-3 rounded-2xl shadow-xl text-purple-800 text-xs sm:text-sm max-w-[90%] text-center relative animate-in slide-in-from-bottom-2 z-20">
                    <button onClick={() => setHint(null)} className="absolute top-1 right-2 text-gray-400 hover:text-gray-600 font-bold">×</button>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="text-xl">🤖</span>
                        <span>{hint}</span>
                    </div>
                 </div>
               )}
               {isLoadingHint && (
                 <div className="bg-white/80 px-3 py-1 rounded-full text-purple-500 text-xs animate-pulse font-bold shadow-sm z-20">
                    {t.loading}
                 </div>
               )}
           </div>

        </div>

        {/* Right: Controls - Flex Col on all screens, but parent row on large */}
        <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col gap-2 sm:gap-4 flex-1 min-h-0 overflow-hidden">
          
          {/* Workspace - Takes remaining space on mobile, or fixed ratio */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded-2xl border-2 border-gray-200 flex flex-col shadow-inner overflow-hidden">
             <div className="bg-gray-100 p-2 border-b border-gray-200 text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex justify-between items-center flex-shrink-0">
                <span>{t.workspace}</span>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleUndo} 
                        disabled={historyIndex <= 0 || gameStatus === 'running'}
                        className={`p-1 rounded ${historyIndex <= 0 || gameStatus === 'running' ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                        title={t.undo}
                    >
                        <Undo size={16} />
                    </button>
                    <button 
                        onClick={handleRedo} 
                        disabled={historyIndex >= history.length - 1 || gameStatus === 'running'}
                        className={`p-1 rounded ${historyIndex >= history.length - 1 || gameStatus === 'running' ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                        title={t.redo}
                    >
                        <Redo size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button 
                        onClick={handleClear} 
                        disabled={blocks.length === 0 || gameStatus === 'running'}
                        className={`p-1 ${blocks.length === 0 || gameStatus === 'running' ? 'text-gray-300' : 'text-red-400 hover:text-red-600'}`}
                        title={t.delete}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
             </div>
             
             <div className="p-2 sm:p-4 flex-1 overflow-y-auto space-y-2">
                {blocks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-300 italic text-xs sm:text-sm text-center p-4">
                        {isTutorial ? (language === 'km' ? "ធ្វើតាមការណែនាំ" : "Follow instructions") : (language === 'km' ? "ដាក់បញ្ជានៅទីនេះ" : "Place commands here")}
                    </div>
                )}
                {blocks.map((block, index) => (
                    <div 
                        key={block.id}
                        draggable={!gameStatus || gameStatus === 'idle'}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`
                           flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-all select-none
                           ${currentStepIndex === index ? 'bg-yellow-100 border-yellow-400 scale-[1.02] ring-2 ring-yellow-300' : 
                             selectedBlockId === block.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'bg-white hover:bg-blue-50'}
                           ${draggedBlockIndex === index ? 'opacity-50 border-dashed border-gray-400' : ''}
                        `}
                        onClick={() => toggleSelectBlock(block.id)}
                    >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                             <GripVertical size={16} />
                        </div>

                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ${selectedBlockId === block.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                            {selectedBlockId === block.id ? <Replace size={12} /> : index + 1}
                        </div>
                        
                        {renderIcon(block.type)}
                        
                        <span className={`font-medium flex-grow text-xs sm:text-sm ${selectedBlockId === block.id ? 'text-blue-700' : 'text-gray-700'}`}>
                            {t.commands[block.type]}
                        </span>
                        
                         <button 
                            onClick={(e) => removeBlock(block.id, e)}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title={t.delete}
                         >
                            <XCircle size={16} />
                         </button>
                    </div>
                ))}
             </div>
          </div>

          {/* Block Palette - Scalable Controls */}
          <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-lg border border-gray-100 flex-shrink-0 flex flex-col gap-2 sm:gap-3">
             
             <div className="flex flex-row gap-2 sm:gap-3 justify-center items-stretch">
                 {/* 1. Walk Controls */}
                 <div className="flex flex-col items-center bg-green-50/50 p-1.5 sm:p-2 rounded-xl border border-green-100 flex-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-green-800 uppercase mb-1 sm:mb-2">{t.walk}</span>
                    
                    {/* UP */}
                    <button 
                        id="btn-up"
                        onClick={() => addBlock(CommandType.Up)}
                        className={getButtonClass('btn-up', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-green-50 border-2 border-green-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                    >
                        <ArrowUp className="text-green-600" size={18} />
                    </button>

                    <div className="flex gap-1.5 sm:gap-2 my-1">
                        {/* LEFT */}
                        <button 
                            id="btn-left"
                            onClick={() => addBlock(CommandType.Left)}
                            className={getButtonClass('btn-left', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-orange-50 border-2 border-orange-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                        >
                            <ArrowLeft className="text-orange-600" size={18} />
                        </button>
                        
                        {/* Spacer/Center */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100/50 rounded-xl flex items-center justify-center">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* RIGHT */}
                        <button 
                            id="btn-right"
                            onClick={() => addBlock(CommandType.Right)}
                            className={getButtonClass('btn-right', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-orange-50 border-2 border-orange-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                        >
                            <ArrowRight className="text-orange-600" size={18} />
                        </button>
                    </div>

                    {/* DOWN */}
                    <button 
                        id="btn-down"
                        onClick={() => addBlock(CommandType.Down)}
                        className={getButtonClass('btn-down', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-green-50 border-2 border-green-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                    >
                        <ArrowDown className="text-green-600" size={18} />
                    </button>
                 </div>

                 {/* 2. Jump Controls */}
                 <div className="flex flex-col items-center bg-purple-50/50 p-1.5 sm:p-2 rounded-xl border border-purple-100 flex-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-purple-800 uppercase mb-1 sm:mb-2">{t.jump}</span>

                    {/* JUMP UP */}
                    <button 
                        id="btn-jump-up"
                        onClick={() => addBlock(CommandType.JumpUp)}
                        className={getButtonClass('btn-jump-up', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                    >
                        <ChevronsUp className="text-purple-600" size={18} />
                    </button>

                    <div className="flex gap-1.5 sm:gap-2 my-1">
                        {/* JUMP LEFT */}
                        <button 
                            id="btn-jump-left"
                            onClick={() => addBlock(CommandType.JumpLeft)}
                            className={getButtonClass('btn-jump-left', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                        >
                            <ChevronsLeft className="text-purple-600" size={18} />
                        </button>
                        
                        {/* Spacer */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100/50 rounded-xl flex items-center justify-center">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* JUMP RIGHT */}
                        <button 
                            id="btn-jump-right"
                            onClick={() => addBlock(CommandType.JumpRight)}
                            className={getButtonClass('btn-jump-right', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                        >
                            <ChevronsRight className="text-purple-600" size={18} />
                        </button>
                    </div>

                    {/* JUMP DOWN */}
                    <button 
                        id="btn-jump-down"
                        onClick={() => addBlock(CommandType.JumpDown)}
                        className={getButtonClass('btn-jump-down', "w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-xl transition-all active:scale-95 shadow-sm")}
                    >
                        <ChevronsDown className="text-purple-600" size={18} />
                    </button>
                 </div>
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2 sm:gap-3">
                <button 
                    id="btn-run"
                    onClick={handleRun}
                    disabled={isPlaying || blocks.length === 0 || isPreparingResult}
                    className={getButtonClass('btn-run', `flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-md transition-all
                        ${isPlaying || blocks.length === 0 || isPreparingResult ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:translate-y-1'}
                    `)}
                >
                    {isPreparingResult ? (
                        <>
                            <RefreshCw className="animate-spin" size={18} />
                            <span className="text-sm">{t.preparingResult}</span>
                        </>
                    ) : (
                        <>
                            <Play fill="currentColor" size={20} /> <span className="text-sm sm:text-base">{t.run}</span>
                        </>
                    )}
                </button>
                <button 
                    id="btn-reset"
                    onClick={resetGame}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex items-center justify-center shadow-sm active:scale-95"
                >
                    <RotateCcw size={20} />
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GameLevel;