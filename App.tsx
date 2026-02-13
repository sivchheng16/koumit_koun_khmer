import React, { useState, useEffect, useMemo } from 'react';
import { BrainCircuit, GraduationCap, CheckCircle, Star, Play, LayoutGrid, Languages, Lock, Trees, Droplets, Castle, Flame, Gamepad2, ArrowUp, CornerDownRight, ChevronRight } from 'lucide-react';
import GameLevel from './components/GameLevel';
import { getInitialLevels, TRANSLATIONS, getTutorialLevel } from './constants';
import { LevelConfig, Language } from './types';

enum AppView {
  Menu,
  Game,
}

const SESSION_KEY = 'koumnit_session_progress';
const LANG_KEY = 'koumnit_language';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Menu);
  
  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'km';
  });

  // Derived Translations
  const t = TRANSLATIONS[language];
  const tutorialLevel = useMemo(() => getTutorialLevel(language), [language]);
  const initialLevels = useMemo(() => getInitialLevels(language), [language]);

  // Load initial state from sessionStorage
  const [customLevels] = useState<LevelConfig[]>(() => {
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

  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(initialLevels[0]);

  // Save to sessionStorage automatically whenever progress changes
  useEffect(() => {
    const data = {
      customLevels,
      completedLevelIds
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }, [customLevels, completedLevelIds]);

  useEffect(() => {
      localStorage.setItem(LANG_KEY, language);
  }, [language]);

  // Update current level text if language changes while playing standard levels
  useEffect(() => {
      if (currentLevel.id === 0) {
          setCurrentLevel(tutorialLevel);
      } else {
          const found = initialLevels.find(l => l.id === currentLevel.id);
          if (found) setCurrentLevel(found);
      }
  }, [language, initialLevels, tutorialLevel]);

  // Check for first visit (Persist permanently for tutorial)
  useEffect(() => {
    const hasVisited = localStorage.getItem('koumnit_visited');
    if (!hasVisited) {
        // Auto start tutorial on first visit
        setCurrentLevel(tutorialLevel);
        setView(AppView.Game);
        localStorage.setItem('koumnit_visited', 'true');
    }
  }, []);

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'km' ? 'en' : 'km');
  };

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
        handleStartLevel(initialLevels[0]);
        return;
    }

    // Check if current is in initial
    const initialIndex = initialLevels.findIndex(l => l.id === currentLevel.id);
    if (initialIndex >= 0 && initialIndex < initialLevels.length - 1) {
      handleStartLevel(initialLevels[initialIndex + 1]);
    } else {
        // If it's the last standard level or a custom level, just go back to menu for now
        setView(AppView.Menu);
    }
  };

  const getBiomeStyle = (levelId: number) => {
    if (levelId <= 20) return { 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-100', 
        hover: 'hover:border-emerald-400',
        ring: 'hover:ring-emerald-200',
        icon: Trees,
        label: 'Forest'
    };
    if (levelId <= 40) return { 
        color: 'text-cyan-600', 
        bg: 'bg-cyan-50', 
        border: 'border-cyan-100', 
        hover: 'hover:border-cyan-400',
        ring: 'hover:ring-cyan-200',
        icon: Droplets,
        label: 'Water'
    };
    if (levelId <= 60) return { 
        color: 'text-slate-600', 
        bg: 'bg-slate-50', 
        border: 'border-slate-100', 
        hover: 'hover:border-slate-400',
        ring: 'hover:ring-slate-200',
        icon: Castle,
        label: 'Dungeon'
    };
    if (levelId <= 80) return { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-100', 
        hover: 'hover:border-orange-400',
        ring: 'hover:ring-orange-200',
        icon: Flame,
        label: 'Volcano'
    };
    return { 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-50', 
        border: 'border-indigo-100', 
        hover: 'hover:border-indigo-400',
        ring: 'hover:ring-indigo-200',
        icon: Gamepad2,
        label: 'Challenge'
    };
  };

  return (
    <div className="h-screen bg-white font-sans text-gray-800 flex flex-col overflow-hidden">
        {view === AppView.Menu && (
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                <BrainCircuit size={18} />
                            </div>
                            <span className="font-bold text-lg text-slate-900 tracking-tight hidden sm:block">ROBOT BRAINIAC</span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                             {/* Language Switch */}
                             <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors border border-slate-200"
                                title="Switch Language"
                             >
                                <Languages size={18} />
                                <span className="uppercase">{language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
                             </button>

                             {/* Tutorial Button */}
                             <button
                                onClick={() => handleStartLevel(tutorialLevel)}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl font-bold text-sm transition-colors border border-orange-200"
                                title={t.tutorialBtn}
                             >
                                <GraduationCap size={18} />
                                <span className="hidden sm:inline">{t.tutorialBtn}</span>
                             </button>

                             {/* Play Button */}
                             <button
                                onClick={() => handleStartLevel(initialLevels[0])}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-sm shadow-md transition-transform hover:scale-105 active:scale-95"
                                title={t.play}
                             >
                                <Play size={18} fill="currentColor" />
                                <span className="hidden sm:inline">{t.play}</span>
                             </button>
                        </div>
                    </div>
                </header>

                {/* Level Grid Section */}
                <section className="py-16 bg-white flex-1 relative z-20">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <LayoutGrid size={24} />
                                    </div>
                                    {t.levels}
                                </h2>
                                <p className="text-slate-500 mt-1 ml-1">{language === 'km' ? 'ជ្រើសរើសកម្រិតដើម្បីលេង' : 'Select a challenge to begin'}</p>
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                {t.total}: {initialLevels.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Standard Levels */}
                            {initialLevels.map((level, index) => {
                                const isCompleted = completedLevelIds.includes(level.id);
                                const isLocked = false;
                                // const isLocked = index > 0 && !completedLevelIds.includes(initialLevels[index - 1].id);
                                const styles = getBiomeStyle(level.id);
                                const Icon = styles.icon;
                                
                                return (
                                    <button
                                        key={level.id}
                                        onClick={() => !isLocked && handleStartLevel(level)}
                                        disabled={isLocked}
                                        className={`
                                            group relative overflow-hidden rounded-3xl p-6 text-left border-2 transition-all duration-300
                                            flex flex-col h-56
                                            ${isLocked 
                                                ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-80' 
                                                : `bg-white ${styles.border} ${styles.hover} hover:shadow-xl hover:-translate-y-1 hover:ring-4 ${styles.ring} ring-offset-2 cursor-pointer`
                                            }
                                        `}
                                    >
                                        {/* Background Decoration Icon */}
                                        <div className={`absolute -bottom-6 -right-6 text-9xl opacity-5 transform group-hover:scale-110 transition-transform duration-500 ${styles.color} pointer-events-none`}>
                                            <Icon />
                                        </div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm
                                                ${isLocked 
                                                    ? 'bg-gray-200 text-gray-400' 
                                                    : isCompleted 
                                                        ? 'bg-green-500 text-white shadow-green-500/30' 
                                                        : `${styles.bg} ${styles.color}`
                                                }
                                            `}>
                                                {isLocked ? <Lock size={20} /> : (index + 1)}
                                            </div>
                                            
                                            {isCompleted && (
                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle size={12} />
                                                    DONE
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-gray-400' : 'text-slate-800 group-hover:text-blue-600 transition-colors'}`}>
                                                {level.name}
                                            </h3>
                                            <p className={`text-xs line-clamp-2 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {level.description}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-auto relative z-10 flex items-center justify-between">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'text-gray-300' : styles.color}`}>
                                                {styles.label}
                                            </span>
                                            
                                            {!isLocked && (
                                                <div className={`w-8 h-8 rounded-full ${styles.bg} flex items-center justify-center ${styles.color} opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12 relative z-20 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-6 opacity-40">
                             <BrainCircuit size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase">{t.poweredBy}</p>
                        <h2 className="text-3xl font-black tracking-widest text-white mb-8">KOOMPI</h2>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full mb-8"></div>
                        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} ROBOT BRAINIAC. {t.rightsReserved}</p>
                    </div>
                </footer>
            </div>
        )}

        {view === AppView.Game && (
          <GameLevel 
            level={currentLevel} 
            onBack={() => setView(AppView.Menu)}
            onNext={handleNextLevel}
            onComplete={handleLevelComplete}
            language={language}
          />
        )}
    </div>
  );
};

export default App;