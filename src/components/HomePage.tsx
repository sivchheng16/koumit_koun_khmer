import React, { useMemo } from 'react';
import { BrainCircuit, RotateCcw, Languages, Play, Star, Lock } from 'lucide-react';
import { LevelConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HomePageProps {
    language: Language;
    onToggleLanguage: () => void;
    onResetProgress: () => void;
    levelProgress: Record<number, number>;
    initialLevels: LevelConfig[];
    onLevelSelect: (level: LevelConfig) => void;
    nextPlayableLevel: LevelConfig;
}

const HomePage: React.FC<HomePageProps> = ({
    language,
    onToggleLanguage,
    onResetProgress,
    levelProgress,
    initialLevels,
    onLevelSelect,
    nextPlayableLevel,
}) => {
    const t = TRANSLATIONS[language];
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
        <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                        <BrainCircuit className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                            ROBOT BRAINIAC
                        </h1>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Learn to Code</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onResetProgress}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={language === 'km' ? 'លុបការរក្សាទុក' : 'Reset Progress'}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onToggleLanguage}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all text-sm font-medium text-gray-600"
                    >
                        <Languages className="w-4 h-4" />
                        <span>{language === 'km' ? 'English' : 'ខ្មែរ'}</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full pb-12">

                {/* Hero Section: Continue & Stats */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-purple-200 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>

                        <div>
                            <h2 className="text-3xl font-black mb-2">{language === 'km' ? 'បន្តការផ្សងព្រេង' : 'Continue Adventure'}</h2>
                            <p className="opacity-90 mb-6 text-lg">{t.level} {nextPlayableLevel.id}</p>
                        </div>

                        <button
                            onClick={() => onLevelSelect(nextPlayableLevel)}
                            className="bg-white text-purple-700 px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 w-max"
                        >
                            <Play className="fill-current w-5 h-5" />
                            {language === 'km' ? 'លេងបន្ត' : 'Play Next Level'}
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center gap-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Total Progress</span>
                                <span className="font-black text-2xl text-gray-800">{Object.keys(levelProgress).length} / 100</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(Object.keys(levelProgress).length / 100) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-yellow-50 rounded-2xl">
                                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-gray-800">{totalStars}</div>
                                <div className="text-sm font-medium text-gray-400">Stars Earned</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Grid Sections */}
                <div className="space-y-8">
                    {levelGroups.map((group, groupIdx) => {
                        const groupLevels = initialLevels.filter(l => l.id >= group.range[0] && l.id <= group.range[1]);

                        // Only show group if previous group is at least partially started or it's the first group
                        const previousGroupEnd = group.range[0] - 1;
                        const isGroupLocked = groupIdx > 0 && !levelProgress[previousGroupEnd];

                        if (isGroupLocked) return null;

                        return (
                            <div key={group.name} className="animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full mb-4 font-bold ${group.theme}`}>
                                    <span>{group.name}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">
                                        {groupLevels.filter(l => levelProgress[l.id]).length} / 20
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                    {groupLevels.map((level) => {
                                        const stars = levelProgress[level.id];
                                        const isCompleted = stars !== undefined;
                                        const isLocked = false;
                                        // const isLocked = level.id !== 1 && !levelProgress[level.id - 1];
                                        const isNext = !isLocked && !isCompleted;

                                        return (
                                            <button
                                                key={level.id}
                                                disabled={isLocked}
                                                onClick={() => !isLocked && onLevelSelect(level)}
                                                className={`
                              relative aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center
                              ${isLocked
                                                        ? 'bg-gray-50 border-gray-100 text-gray-300'
                                                        : isCompleted
                                                            ? 'bg-white border-green-200 text-gray-800 shadow-sm hover:-translate-y-1 hover:shadow-md'
                                                            : 'bg-white border-blue-200 text-blue-600 shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1'
                                                    }
                              ${isNext ? 'ring-4 ring-blue-100 ring-offset-2 animate-pulse' : ''}
                            `}
                                            >
                                                {isLocked ? (
                                                    <Lock className="w-5 h-5 opacity-50" />
                                                ) : (
                                                    <>
                                                        <span className={`text-lg font-bold ${isCompleted ? 'mb-1' : ''}`}>{level.id}</span>
                                                        {isCompleted && (
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3].map(s => (
                                                                    <Star key={s} size={10} className={`${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center text-gray-400 text-sm py-6 border-t border-gray-100">
                <p>© 2024 Robot Brainiac. Designed for learning.</p>
            </footer>
        </div>
    );
};

export default HomePage;
