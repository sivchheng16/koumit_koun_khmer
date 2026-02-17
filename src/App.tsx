import React, { useState, useEffect, useMemo } from 'react';
import BrainCircuit from 'lucide-react/dist/esm/icons/brain-circuit';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Star from 'lucide-react/dist/esm/icons/star';
import Play from 'lucide-react/dist/esm/icons/play';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Languages from 'lucide-react/dist/esm/icons/languages';
import Lock from 'lucide-react/dist/esm/icons/lock';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import GameLevel from './components/GameLevel';
import HomePage from './components/HomePage';
import LevelDetailModal from './components/LevelDetailModal';
import { getInitialLevels, TRANSLATIONS, getTutorialLevel } from './constants';
import { LevelConfig, Language } from './types';
import { setMuted as setSoundMuted } from './services/soundService';
import './index.css';

enum AppView {
  Menu,
  Game,
}

const STORAGE_KEY = 'koumnit_game_progress';
const LANG_KEY = 'koumnit_language';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Menu);

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'km';
  });

  const MUTE_KEY = 'koumnit_mute';
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(MUTE_KEY) === 'true';
  });

  useEffect(() => {
    setSoundMuted(isMuted);
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  };

  // Derived Translations
  const t = TRANSLATIONS[language];
  const tutorialLevel = useMemo(() => getTutorialLevel(language), [language]);
  const initialLevels = useMemo(() => getInitialLevels(language), [language]);

  // Load initial state from localStorage
  const [customLevels] = useState<LevelConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).customLevels || [];
      }
    } catch (e) {
      console.error("Failed to load save data", e);
    }
    return [];
  });

  // State for level progress (stars)
  const [levelProgress, setLevelProgress] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).levelProgress || {};
      }
    } catch (e) {
      console.error("Failed to load save data", e);
    }
    return {};
  });

  // Backward compatibility for completedLevelIds (migrate old data)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.completedLevelIds && Array.isArray(parsed.completedLevelIds) && Object.keys(levelProgress).length === 0) {
        const newProgress: Record<number, number> = {};
        parsed.completedLevelIds.forEach((id: number) => {
          newProgress[id] = 1; // Default to 1 star for old saves
        });
        setLevelProgress(newProgress);
      }
    }
  }, []);

  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(initialLevels[0]);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);

  // Save to localStorage automatically whenever progress changes
  useEffect(() => {
    const data = {
      customLevels,
      levelProgress
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [customLevels, levelProgress]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  // Update current level text if language changes
  useEffect(() => {
    if (currentLevel.id === 0) {
      setCurrentLevel(tutorialLevel);
    } else {
      const found = initialLevels.find(l => l.id === currentLevel.id);
      if (found) setCurrentLevel(found);
    }
  }, [language, initialLevels, tutorialLevel]);

  // Check for first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('koumnit_visited');
    if (!hasVisited) {
      setCurrentLevel(tutorialLevel);
      setView(AppView.Game);
      localStorage.setItem('koumnit_visited', 'true');
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'km' ? 'en' : 'km');
  };

  const handleLevelSelect = (level: LevelConfig) => {
    setSelectedLevel(level);
  };

  const handlePlayLevel = () => {
    if (selectedLevel) {
      setCurrentLevel(selectedLevel);
      setView(AppView.Game);
      setSelectedLevel(null);
    }
  };

  const handleLevelComplete = (levelId: number, stars: number) => {
    if (levelId !== 0) {
      setLevelProgress(prev => {
        const currentStars = prev[levelId] || 0;
        return {
          ...prev,
          [levelId]: Math.max(currentStars, stars)
        };
      });
    }
  };

  const handleNextLevel = () => {
    const nextId = currentLevel.id + 1;
    const nextLevel = initialLevels.find(l => l.id === nextId);

    if (nextLevel) {
      setCurrentLevel(nextLevel);
    } else {
      setView(AppView.Menu);
    }
  };

  // Find the next level to play (highest unlocked)
  const nextPlayableLevel = useMemo(() => {
    const completedIds = Object.keys(levelProgress).map(Number);
    if (completedIds.length === 0) return initialLevels[0];
    const maxId = Math.max(...completedIds);
    return initialLevels.find(l => l.id === maxId + 1) || initialLevels.find(l => l.id === maxId) || initialLevels[0];
  }, [levelProgress, initialLevels]);

  const totalStars = Object.values(levelProgress).reduce((a: number, b: number) => a + b, 0);

  // Group levels by theme
  const levelGroups = useMemo(() => {
    return [
      { name: language === 'km' ? 'ព្រៃឈើ (Forest)' : 'Forest Pattern', range: [1, 20], theme: 'text-green-600 bg-green-50 border-green-200' },
      { name: language === 'km' ? 'ទឹក (Water)' : 'Water Crossing', range: [21, 40], theme: 'text-blue-600 bg-blue-50 border-blue-200' },
      { name: language === 'km' ? 'គុកងងឹត (Dungeon)' : 'Dungeon Maze', range: [41, 60], theme: 'text-purple-600 bg-purple-50 border-purple-200' },
      { name: language === 'km' ? 'ភ្នំភ្លើង (Volcano)' : 'Volcano Dash', range: [61, 80], theme: 'text-red-600 bg-red-50 border-red-200' },
      { name: language === 'km' ? 'ចម្រុះ (Mix)' : 'Master Challenge', range: [81, 100], theme: 'text-amber-600 bg-amber-50 border-amber-200' },
    ];
  }, [language]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {view === AppView.Menu ? (
        <>
          <HomePage
            language={language}
            onToggleLanguage={toggleLanguage}
            onResetProgress={() => {
              if (window.confirm(language === 'km' ? 'តើអ្នកពិតជាចង់លុបការរក្សាទុកមែនទេ?' : 'Are you sure you want to reset your progress?')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('koumnit_visited');
                window.location.reload();
              }
            }}
            levelProgress={levelProgress}
            initialLevels={initialLevels}
            onLevelSelect={handleLevelSelect}
            nextPlayableLevel={nextPlayableLevel}
          />

          {selectedLevel && (
            <LevelDetailModal
              level={selectedLevel}
              isOpen={!!selectedLevel}
              onClose={() => setSelectedLevel(null)}
              onPlay={handlePlayLevel}
              language={language}
              stars={levelProgress[selectedLevel.id] || 0}
              isLocked={selectedLevel.id !== 1 && selectedLevel.id > 1 && !levelProgress[selectedLevel.id - 1] && selectedLevel.id !== 0}
            />
          )}
        </>
      ) : (
        <GameLevel
          level={currentLevel}
          onComplete={(stars) => handleLevelComplete(currentLevel.id, stars)}
          onNext={handleNextLevel}
          onBack={() => setView(AppView.Menu)}
          language={language}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
};

export default App;
