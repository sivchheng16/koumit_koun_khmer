import React from 'react';
import { X, Play, Clock, Award, AlertCircle } from 'lucide-react';
import { LevelConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LevelDetailModalProps {
    level: LevelConfig;
    isOpen: boolean;
    onClose: () => void;
    onPlay: () => void;
    language: Language;
    stars: number;
    isLocked: boolean;
}

const LevelDetailModal: React.FC<LevelDetailModalProps> = ({
    level,
    isOpen,
    onClose,
    onPlay,
    language,
    stars,
    isLocked
}) => {
    if (!isOpen) return null;

    const t = TRANSLATIONS[language];

    // Helper to determine difficulty/type based on level ID (approximate)
    const getLevelType = (id: number) => {
        if (id <= 20) return language === 'km' ? 'មូលដ្ឋាន (Basic)' : 'Basic Logic';
        if (id <= 40) return language === 'km' ? 'កម្រិតមធ្យម (Intermediate)' : 'Intermediate';
        if (id <= 60) return language === 'km' ? 'ប្រឈម (Advanced)' : 'Advanced';
        if (id <= 80) return language === 'km' ? 'អ្នកជំនាញ (Expert)' : 'Expert';
        return language === 'km' ? 'Master' : 'Master';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header Image / Pattern */}
                <div className={`h-32 bg-gradient-to-br ${level.id <= 20 ? 'from-green-400 to-emerald-600' :
                        level.id <= 40 ? 'from-blue-400 to-indigo-600' :
                            level.id <= 60 ? 'from-purple-400 to-fuchsia-600' :
                                level.id <= 80 ? 'from-orange-400 to-red-600' :
                                    'from-slate-700 to-black'
                    } relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <span className="text-4xl font-black text-gray-800">{level.id}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 pb-8 px-8 text-center">

                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                        {language === 'km' ? `កម្រិត ${level.id}` : `Level ${level.id}`}
                    </h2>
                    <p className="text-sm font-medium text-purple-600 uppercase tracking-wider mb-6">
                        {getLevelType(level.id)}
                    </p>

                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3].map((star) => (
                            <Award
                                key={star}
                                className={`w-8 h-8 ${star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                            />
                        ))}
                    </div>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {level.description || (language === 'km' ? 'ប្រើប្រាស់បញ្ជាដើម្បីនាំមនុស្សយន្តទៅកាន់គោលដៅ។' : 'Use commands to guide the robot to the goal.')}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onPlay}
                            disabled={isLocked}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                ${isLocked
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                }`}
                        >
                            {isLocked ? (
                                <>
                                    <AlertCircle size={20} />
                                    <span>{language === 'km' ? 'ត្រូវបានចាក់សោ' : 'Locked'}</span>
                                </>
                            ) : (
                                <>
                                    <Play size={20} className="fill-current" />
                                    <span>{language === 'km' ? 'ចាប់ផ្តើម' : 'Start Mission'}</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors"
                        >
                            {language === 'km' ? 'បិទ' : 'Close'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LevelDetailModal;
