import React, { useState, useEffect } from 'react';
import { Gamepad2, BrainCircuit, Wand2, Save, Download, CheckCircle, Star, GraduationCap } from 'lucide-react';
import GameLevel from './components/GameLevel';
import { INITIAL_LEVELS, TRANSLATIONS, TUTORIAL_LEVEL } from './constants';
import { LevelConfig } from './types';
import { generateNewLevel } from './services/geminiService';

enum AppView {
  Menu,
  Game,
}

const SESSION_KEY = 'koumnit_session_progress';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Menu);
  
  // Load initial state from sessionStorage
  const [customLevels, setCustomLevels] = useState<LevelConfig[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        return JSON.parse(saved).customLevels || [];
      }
    } catch (e) {
      console.error("Failed to load session data", e);
    }
    return [];
  });

  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        return JSON.parse(saved).completedLevelIds || [];
      }
    } catch (e) {
      console.error("Failed to load session data", e);
    }
    return [];
  });

  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(INITIAL_LEVELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Save to sessionStorage automatically whenever progress changes
  useEffect(() => {
    const data = {
      customLevels,
      completedLevelIds
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }, [customLevels, completedLevelIds]);

  // Check for first visit (Persist permanently for tutorial)
  useEffect(() => {
    const hasVisited = localStorage.getItem('koumnit_visited');
    if (!hasVisited) {
        // Auto start tutorial on first visit
        setCurrentLevel(TUTORIAL_LEVEL);
        setView(AppView.Game);
        localStorage.setItem('koumnit_visited', 'true');
    }
  }, []);

  const handleStartLevel = (level: LevelConfig) => {
    setCurrentLevel(level);
    setView(AppView.Game);
  };

  const handleLevelComplete = (levelId: number) => {
    if (levelId !== 0 && !completedLevelIds.includes(levelId)) { // Don't track tutorial as a standard level
        setCompletedLevelIds(prev => [...prev, levelId]);
    }
  };

  const handleNextLevel = () => {
    // If we just finished tutorial, go to level 1
    if (currentLevel.id === 0) {
        handleStartLevel(INITIAL_LEVELS[0]);
        return;
    }

    // Check if current is in initial
    const initialIndex = INITIAL_LEVELS.findIndex(l => l.id === currentLevel.id);
    if (initialIndex >= 0 && initialIndex < INITIAL_LEVELS.length - 1) {
      handleStartLevel(INITIAL_LEVELS[initialIndex + 1]);
    } else {
        // If it's the last standard level or a custom level, just go back to menu for now
        setView(AppView.Menu);
    }
  };

  const handleGenerateLevel = async () => {
    setIsGenerating(true);
    const newLevel = await generateNewLevel('medium');
    setIsGenerating(false);
    
    if (newLevel) {
        setCustomLevels(prev => [...prev, newLevel]);
        handleStartLevel(newLevel);
    } else {
        alert("Sorry, could not generate a level right now. Please try again.");
    }
  };

  // Manual Save/Load for long-term storage (Optional based on user request, but kept for utility)
  const saveProgressPermanent = () => {
    try {
        const data = {
            customLevels,
            completedLevelIds
        };
        localStorage.setItem('koumnit_save_data', JSON.stringify(data));
        alert(TRANSLATIONS.saveSuccess);
    } catch (e) {
        console.error("Save failed", e);
    }
  };

  const loadProgressPermanent = () => {
    try {
        const saved = localStorage.getItem('koumnit_save_data');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.customLevels && Array.isArray(data.customLevels)) {
                setCustomLevels(data.customLevels);
            }
            if (data.completedLevelIds && Array.isArray(data.completedLevelIds)) {
                setCompletedLevelIds(data.completedLevelIds);
            }
            alert(TRANSLATIONS.loadSuccess);
        } else {
            alert(TRANSLATIONS.noSaveFound);
        }
    } catch (e) {
        console.error("Load failed", e);
        alert("Failed to load data.");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-gray-800 flex flex-col overflow-hidden">
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        
        {view === AppView.Menu && (
          <div className="container mx-auto flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="text-center mb-10 animate-fade-in-down pt-10">
                <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-3 hover:rotate-6 transition-transform">
                    <BrainCircuit size={48} className="text-white" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-blue-900 mb-4 tracking-tight">
                    {TRANSLATIONS.title}
                </h1>
                <p className="text-xl text-blue-700">
                    {TRANSLATIONS.subtitle}
                </p>
            </div>

            <div className="w-full max-w-md space-y-4 pb-10">
                
                {/* Tutorial Button */}
                <button
                    onClick={() => handleStartLevel(TUTORIAL_LEVEL)}
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                    <GraduationCap size={28} className="group-hover:scale-110 transition-transform" />
                    <span className="text-lg">{TRANSLATIONS.tutorialBtn}</span>
                </button>

                {/* Level List */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                        <Gamepad2 className="text-blue-500"/>
                        {TRANSLATIONS.levels}
                    </h2>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                        {INITIAL_LEVELS.map((level, index) => (
                            <button
                                key={level.id}
                                onClick={() => handleStartLevel(level)}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between group border border-transparent hover:border-blue-100"
                            >
                                <div className="flex items-center gap-2">
                                    {completedLevelIds.includes(level.id) ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                    )}
                                    <span className="font-bold text-gray-700 group-hover:text-blue-600">
                                        #{index + 1} {level.name}
                                    </span>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full group-hover:bg-blue-200">
                                    {level.gridSize}x{level.gridSize}
                                </span>
                            </button>
                        ))}
                        
                        {customLevels.map((level, index) => (
                             <button
                                key={level.id}
                                onClick={() => handleStartLevel(level)}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between group border border-transparent hover:border-purple-100"
                            >
                                <div className="flex items-center gap-2">
                                    {completedLevelIds.includes(level.id) ? (
                                        <CheckCircle size={16} className="text-purple-500" />
                                    ) : (
                                        <Star size={16} className="text-purple-300" />
                                    )}
                                    <span className="font-bold text-gray-700 group-hover:text-purple-600 truncate max-w-[150px]">
                                        {level.name}
                                    </span>
                                </div>
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full group-hover:bg-purple-200">
                                    AI
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={saveProgressPermanent}
                        className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        {TRANSLATIONS.save}
                    </button>
                    <button
                        onClick={loadProgressPermanent}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        {TRANSLATIONS.load}
                    </button>
                </div>

                <button
                    onClick={handleGenerateLevel}
                    disabled={isGenerating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    {isGenerating ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <Wand2 className="group-hover:rotate-12 transition-transform" />
                            <span>{TRANSLATIONS.generateLevel}</span>
                        </>
                    )}
                </button>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-400">
                Created with React, Tailwind & Gemini API
            </div>
          </div>
        )}

        {view === AppView.Game && (
          <GameLevel 
            level={currentLevel} 
            onBack={() => setView(AppView.Menu)}
            onNext={handleNextLevel}
            onComplete={handleLevelComplete}
          />
        )}

      </main>
    </div>
  );
};

export default App;