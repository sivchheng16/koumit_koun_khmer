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
