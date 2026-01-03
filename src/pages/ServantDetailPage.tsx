import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Servant, User, SkillModel, NpModel } from '../types';
import RatingSystem from '../components/RatingSystem';

interface ServantDetailProps {
    servants: Servant[];
    isAdmin: boolean;
    onEdit: (servant: Servant) => void;
    user?: User | null;
}

// Logic to extract relevant scaling rows (for Skills)
const getScalingRows = (functions: SkillModel['functions'], maxCols: number = 10) => {
    if (!functions) return [];

    const rows: { label: string; values: (string | number)[]; buffIcon?: string }[] = [];

    functions.forEach(func => {
        // For skills, we typically prioritize buff name, but can fallback to popup text if needed
        const buffName = func.buffs[0]?.name || func.funcPopupText || "Effect";
        const buffIcon = func.buffs[0]?.icon || func.funcPopupIcon;

        if (func.svals && func.svals.length > 0) {
            const keysToCheck = ['Value', 'Value2', 'Rate', 'Correction', 'Turn', 'Count'];

            keysToCheck.forEach(key => {
                const values = func.svals.map(sv => sv[key] ?? undefined);
                const validValues = values.filter(v => v !== undefined) as number[];

                if (validValues.length === 0) return;

                const unique = new Set(validValues);
                const shouldShow = unique.size > 1 || key === 'Value' || maxCols === 5;

                if (shouldShow) {
                    let label = buffName;
                    if (key === 'Rate') label += " (Chance)";
                    if (key === 'Turn') label += " (Turns)";
                    if (key === 'Count') label += " (Times)";
                    if (rows.some(r => r.label === label)) label += ` (${key})`;

                    const formattedValues = values.slice(0, maxCols).map(v => {
                        if (v === undefined) return '-';
                        if (key === 'Rate' && v > 100) return (v / 10) + '%';
                        return v;
                    });

                    while (formattedValues.length < maxCols) {
                        formattedValues.push(formattedValues.length > 0 ? formattedValues[formattedValues.length - 1] : '-');
                    }

                    rows.push({ label, values: formattedValues, buffIcon });
                }
            });
        }
    });
    return rows;
};

// Component to display a single skill detailed view
const SkillDetailedView: React.FC<{ skill: SkillModel }> = ({ skill }) => {
    const scalingRows = getScalingRows(skill.functions, 10);

    return (
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                {skill.icon && <img src={skill.icon} alt="" className="w-12 h-12 mt-1" />}
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">{skill.name}</h4>
                            {skill.num && <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Skill {skill.num}</span>}
                        </div>
                        {skill.coolDown && (
                            <div className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                CD: {skill.coolDown.join(' → ')}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">{skill.detail}</p>
                </div>
            </div>

            {/* Scaling Table */}
            {scalingRows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-xs sm:text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                <th className="p-2 text-left font-medium min-w-[120px]">Effect</th>
                                {[...Array(10)].map((_, i) => (
                                    <th key={i} className="p-2 font-medium w-12">Lv{i + 1}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Cooldown Row */}
                            {skill.coolDown && (
                                <tr>
                                    <td className="p-2 text-left font-bold text-blue-600">Cooldown</td>
                                    {skill.coolDown.length === 10 ? (
                                        skill.coolDown.map((cd, i) => (
                                            <td key={i} className="p-2 text-gray-600">{cd}</td>
                                        ))
                                    ) : (
                                        [...Array(10)].map((_, i) => {
                                            if (!skill.coolDown || skill.coolDown.length === 0) return <td key={i}>-</td>;

                                            const base = skill.coolDown[0];
                                            let val = base;

                                            if (skill.coolDown.length === 3) {
                                                if (i < 5) val = skill.coolDown[0];
                                                else if (i < 9) val = skill.coolDown[1];
                                                else val = skill.coolDown[2];
                                            } else {
                                                if (i >= 5) val = Math.max(base - 1, 1);
                                                if (i >= 9) val = Math.max(base - 2, 1);
                                            }
                                            return <td key={i} className="p-2 text-gray-600">{val}</td>
                                        })
                                    )}
                                </tr>
                            )}

                            {/* Effect Rows */}
                            {scalingRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-2 text-left flex items-center gap-2">
                                        {row.buffIcon && <img src={row.buffIcon} className="w-5 h-5" alt="" />}
                                        <span className="truncate max-w-[150px]" title={row.label}>{row.label}</span>
                                    </td>
                                    {row.values.map((val, i) => (
                                        <td key={i} className="p-2 font-mono text-gray-700">{val}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Component to display a single NP detailed view
const NpDetailedView: React.FC<{ np: NpModel }> = ({ np }) => {
    const getCardColor = (card: string | number) => {
        const c = String(card).toLowerCase().trim();

        // 1=Arts, 2=Buster, 3=Quick as per request
        if (c === 'quick' || c === '3') return 'bg-green-600 border-green-700';
        if (c === 'arts' || c === '1') return 'bg-blue-600 border-blue-700';
        if (c === 'buster' || c === '2') return 'bg-red-600 border-red-700';

        return 'bg-gray-500 border-gray-600';
    };

    const getCardLabel = (card: string | number) => {
        const c = String(card).toLowerCase().trim();
        if (c === '3') return 'Quick';
        if (c === '1') return 'Arts';
        if (c === '2') return 'Buster';
        return card;
    };

    // Process functions for display
    const renderEffects = () => {
        if (!np.functions) return [];

        return np.functions.map((func, idx) => {
            // Priority: funcPopupText -> buffName -> funcType
            const buffName = func.funcPopupText || func.buffs[0]?.name || func.funcType || "Effect";
            // Priority: funcPopupIcon -> buffIcon
            const buffIcon = func.funcPopupIcon || func.buffs[0]?.icon;

            // We want to separate Value, Chance, Turn, Count into separate rows
            const rows: { label: string; values: string[] }[] = [];
            const keys = ['Value', 'Correction', 'Rate', 'Turn', 'Count'];

            keys.forEach(key => {
                if (!func.svals) return;

                const rawValues = func.svals.map(sv => sv[key]).filter(v => v !== undefined);
                if (rawValues.length === 0) return;

                // Show row if it has data.
                if (rawValues.length > 0) {
                    const formatted = rawValues.slice(0, 5).map(v => {
                        if (key === 'Rate') return (v / 10) + '%';
                        if (key === 'Turn') return v + 'T';
                        if (key === 'Count') return v + ' times';

                        // Value/Correction formatting
                        const lowerType = func.funcType?.toLowerCase() || "";
                        const lowerName = buffName.toLowerCase();
                        if (lowerType.includes('hp') || lowerName.includes('hp') || lowerType.includes('shorten') || lowerName.includes('cooldown')) {
                            return v.toLocaleString();
                        }
                        return (v / 10) + '%';
                    });

                    // Fill to 5 columns
                    while (formatted.length < 5) formatted.push(formatted[formatted.length - 1] || '-');

                    let rowLabel = "";
                    if (key === 'Value' || key === 'Correction') rowLabel = "Effect";
                    else if (key === 'Rate') rowLabel = "Chance";
                    else if (key === 'Turn') rowLabel = "Duration";
                    else if (key === 'Count') rowLabel = "Count";

                    rows.push({ label: rowLabel, values: formatted });
                }
            });

            const hasData = rows.length > 0;

            return (
                <div key={idx} className="border-b last:border-0 border-gray-100">
                    {/* Effect Header Row */}
                    <div className={`flex items-center justify-between p-3 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                            {buffIcon ? (
                                <img src={buffIcon} alt="" className="w-6 h-6" />
                            ) : (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-xs">
                                    ★
                                </div>
                            )}
                            <span className="font-medium text-gray-800 text-sm md:text-base">{buffName}</span>
                        </div>

                        {/* If no data, show symbol */}
                        {!hasData && (
                            <div className="font-mono text-gray-400 text-lg">Ø</div>
                        )}
                    </div>

                    {/* Table Rows */}
                    {hasData && (
                        <div className="bg-white border-t border-gray-100 overflow-x-auto">
                            <table className="w-full text-center text-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold">
                                        <th className="py-2 border-r border-gray-200 w-24 bg-gray-50">Effect</th>
                                        <th className="py-2 border-r border-gray-200 w-1/6 bg-gray-50">NP1</th>
                                        <th className="py-2 border-r border-gray-200 w-1/6 bg-gray-50">NP2</th>
                                        <th className="py-2 border-r border-gray-200 w-1/6 bg-gray-50">NP3</th>
                                        <th className="py-2 border-r border-gray-200 w-1/6 bg-gray-50">NP4</th>
                                        <th className="py-2 w-1/6 bg-gray-50">NP5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="border-t border-gray-50 last:border-b-0 hover:bg-gray-50">
                                            <td className="py-2 font-medium text-gray-600 text-xs border-r border-gray-100 bg-gray-50/30">{row.label}</td>
                                            {row.values.map((val, i) => (
                                                <td key={i} className="py-2 font-mono text-gray-700 border-r last:border-0 border-gray-100">
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200">
            {/* Fancy Header */}
            <div className="relative h-32 bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Decorative Background Pattern */}
                <div className={`absolute inset-0 opacity-20 ${getCardColor(np.card)}`}
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}>
                </div>

                <div className="relative z-10 text-center px-4">
                    <h3 className="text-2xl font-bold text-white tracking-wider text-shadow-md brand-font mb-1">
                        {np.name}
                    </h3>
                    {/* Subtitles or original name could go here if available */}
                    <div className="mt-2 flex justify-center gap-3">
                        <span className={`px-3 py-0.5 rounded text-white text-xs font-bold uppercase border border-white/30 shadow-sm ${getCardColor(np.card)}`}>
                            {getCardLabel(np.card)}
                        </span>
                        <span className="px-3 py-0.5 rounded bg-black/50 text-white text-xs font-bold border border-white/20">
                            {np.rank}
                        </span>
                        <span className="px-3 py-0.5 rounded bg-black/50 text-white text-xs font-bold border border-white/20">
                            {np.type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detail Description */}
            {np.detail && (
                <div className="bg-blue-50/50 p-4 text-center border-b border-gray-200">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed italic">
                        {np.detail}
                    </p>
                </div>
            )}

            {/* Effects List */}
            <div className="bg-white">
                {renderEffects()}
            </div>
        </div>
    );
};

// Component to handle skill grouping (Strengthening)
const SkillGroupDisplay: React.FC<{ skills: SkillModel[] }> = ({ skills }) => {
    // Sort skills by ID descending (Assumption: Higher ID = Newer/Strengthened)
    const sortedSkills = [...skills].sort((a, b) => b.id - a.id);
    const [selectedSkillId, setSelectedSkillId] = useState(sortedSkills[0].id);

    // If only one skill, just show it
    if (sortedSkills.length === 1) {
        return <SkillDetailedView skill={sortedSkills[0]} />;
    }

    const currentSkill = sortedSkills.find(s => s.id === selectedSkillId) || sortedSkills[0];

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 justify-end">
                {sortedSkills.map((s, idx) => {
                    // Label generation: "Base", "Upgrade 1", "Upgrade 2" based on reverse index
                    const label = idx === sortedSkills.length - 1 ? "Base" : `Strengthened ${sortedSkills.length - 1 - idx}`;
                    const isSelected = s.id === selectedSkillId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSkillId(s.id)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${isSelected
                                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-bold'
                                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <SkillDetailedView skill={currentSkill} />
        </div>
    );
};

// Component to handle NP grouping (Strengthening)
const NpGroupDisplay: React.FC<{ nps: NpModel[] }> = ({ nps }) => {
    // Sort by ID descending (Assumption: Higher ID = Newer/Strengthened)
    const sortedNps = [...nps].sort((a, b) => b.id - a.id);
    const [selectedNpId, setSelectedNpId] = useState(sortedNps[0].id);

    // If only one NP, just show it
    if (sortedNps.length === 1) {
        return <NpDetailedView np={sortedNps[0]} />;
    }

    const currentNp = sortedNps.find(n => n.id === selectedNpId) || sortedNps[0];

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 justify-end">
                {sortedNps.map((n, idx) => {
                    const label = idx === sortedNps.length - 1 ? "Base" : `Strengthened ${sortedNps.length - 1 - idx}`;
                    const isSelected = n.id === selectedNpId;
                    return (
                        <button
                            key={n.id}
                            onClick={() => setSelectedNpId(n.id)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${isSelected
                                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-bold'
                                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <NpDetailedView np={currentNp} />
        </div>
    );
};

const ServantDetailPage: React.FC<ServantDetailProps> = ({
    servants,
    isAdmin,
    onEdit,
    user
}) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'none' | 'np' | 'skills' | 'class' | 'append' | 'profile'>('np');

    // Find servant from URL param
    const servant = servants.find(s => s.id === Number(id));

    // Find prev/next servants
    const currentIndex = servants.findIndex(s => s.id === Number(id));
    const prevServant = currentIndex > 0 ? servants[currentIndex - 1] : undefined;
    const nextServant = currentIndex < servants.length - 1 ? servants[currentIndex + 1] : undefined;

    // Reset image carousel and tab when the servant changes
    useEffect(() => {
        setCurrentImageIndex(0);
        setActiveTab('np');
    }, [id]);

    if (!servant) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Servant not found</h2>
                    <button
                        onClick={() => navigate('/servants')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const images = servant.images && servant.images.length > 0 ? servant.images : [servant.face];

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const renderDeckCard = (type: string, index: number) => {
        let colorClass = 'bg-gray-400';
        let label = type;
        const lowerType = String(type).toLowerCase().trim();

        if (lowerType === 'quick' || lowerType === '3') {
            colorClass = 'bg-green-500';
            label = 'Quick';
        } else if (lowerType === 'arts' || lowerType === '1') {
            colorClass = 'bg-blue-500';
            label = 'Arts';
        } else if (lowerType === 'buster' || lowerType === '2') {
            colorClass = 'bg-red-500';
            label = 'Buster';
        }

        return (
            <div key={index} className="flex flex-col items-center">
                <div className={`w-12 h-16 rounded shadow-md ${colorClass} text-white flex items-center justify-center font-bold text-xs uppercase border-2 border-white ring-1 ring-gray-200`}>
                    {label}
                </div>
            </div>
        )
    };

    // Helper components for tabs
    const TabButton = ({ id, label, current }: { id: string, label: string, current: string }) => (
        <button
            onClick={() => setActiveTab(current === id ? 'none' : id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${current === id
                    ? 'bg-white text-blue-600 border-blue-600'
                    : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 hover:text-gray-900'
                }`}
        >
            {label}
        </button>
    );

    // Group active skills by 'num'
    const getGroupedSkills = () => {
        if (!servant.skills) return [];
        const groups = new Map<number, SkillModel[]>();

        servant.skills.forEach(skill => {
            const num = skill.num || 0;
            if (!groups.has(num)) {
                groups.set(num, []);
            }
            groups.get(num)?.push(skill);
        });

        // Convert map to array sorted by num
        return Array.from(groups.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, skills]) => skills);
    };

    // Group NPs by 'num'
    const getGroupedNps = () => {
        if (!servant.noblePhantasms) return [];
        const groups = new Map<number, NpModel[]>();

        servant.noblePhantasms.forEach(np => {
            const num = np.num || 1; // Default to 1 if missing
            if (!groups.has(num)) {
                groups.set(num, []);
            }
            groups.get(num)?.push(np);
        });

        return Array.from(groups.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, nps]) => nps);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20">
            {/* Top Actions: Back & Edit */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate('/servants')}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                </button>
                {isAdmin && (
                    <button
                        onClick={() => onEdit(servant)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            {/* Navigation Bar */}
            <div className="flex justify-between items-center mb-8 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="w-1/2 flex justify-start">
                    {prevServant ? (
                        <button
                            onClick={() => navigate(`/servant/${prevServant.id}`)}
                            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors group text-left"
                        >
                            <div className="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-full mr-3 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-mono">ID: {prevServant.collectionNo}</div>
                                <div className="font-bold text-sm truncate max-w-[120px] sm:max-w-xs">{prevServant.name}</div>
                            </div>
                        </button>
                    ) : (
                        <div className="w-8"></div> // Spacer
                    )}
                </div>

                <div className="w-px h-8 bg-gray-200 mx-2"></div>

                <div className="w-1/2 flex justify-end">
                    {nextServant ? (
                        <button
                            onClick={() => navigate(`/servant/${nextServant.id}`)}
                            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors group text-right"
                        >
                            <div>
                                <div className="text-xs text-gray-500 font-mono">ID: {nextServant.collectionNo}</div>
                                <div className="font-bold text-sm truncate max-w-[120px] sm:max-w-xs">{nextServant.name}</div>
                            </div>
                            <div className="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-full ml-3 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ) : (
                        <div className="w-8"></div> // Spacer
                    )}
                </div>
            </div>

            {/* Header with Rating */}
            <div className="mb-8 border-b border-gray-200 pb-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold shadow-sm ${servant.className.toLowerCase() === 'saber' ? 'bg-blue-600' :
                                servant.className.toLowerCase() === 'archer' ? 'bg-red-600' :
                                    servant.className.toLowerCase() === 'lancer' ? 'bg-green-600' :
                                        'bg-gray-600'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm text-gray-500 font-serif">{servant.className}</h2>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 brand-font">{servant.originalName}</h1>
                        </div>
                    </div>

                    {/* Rating System Widget */}
                    <RatingSystem
                        servantId={servant.id}
                        user={user || null}
                        onNavigateToLogin={() => navigate('/login')}
                        onViewReviews={() => navigate(`/servant/${servant.id}/reviews`)}
                    />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start">
                {/* Left Column: Data Table */}
                <div className="w-full lg:w-1/2">
                    <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                        <div className="grid grid-cols-4 divide-x divide-y divide-gray-200 text-sm">
                            {/* ID / Collection */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">ID</div>
                            <div className="p-3 text-center">{servant.id}</div>
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Collection</div>
                            <div className="p-3 text-center">{servant.collectionNo}</div>

                            {/* Class / Attribute */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Class</div>
                            <div className="p-3 text-center">{servant.className}</div>
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Attribute</div>
                            <div className="p-3 text-center capitalize">{servant.attribute}</div>

                            {/* Rarity / Cost */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Rarity</div>
                            <div className="p-3 text-center text-yellow-500 font-bold tracking-widest">{"★".repeat(servant.rarity)}</div>
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Cost</div>
                            <div className="p-3 text-center">{servant.cost || '-'}</div>

                            {/* HP */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">HP</div>
                            <div className="col-span-3 p-3 flex justify-between px-8">
                                <span className="text-gray-600">Base: <span className="text-gray-900 font-mono">{servant.hpBase?.toLocaleString() || '-'}</span></span>
                                <span className="text-gray-600">Max: <span className="text-blue-600 font-bold font-mono">{servant.hpMax?.toLocaleString()}</span></span>
                            </div>

                            {/* ATK */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">ATK</div>
                            <div className="col-span-3 p-3 flex justify-between px-8">
                                <span className="text-gray-600">Base: <span className="text-gray-900 font-mono">{servant.atkBase?.toLocaleString() || '-'}</span></span>
                                <span className="text-gray-600">Max: <span className="text-red-600 font-bold font-mono">{servant.atkMax?.toLocaleString()}</span></span>
                            </div>

                            {/* Deck */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Deck</div>
                            <div className="col-span-3 p-3">
                                <div className="flex justify-center gap-2">
                                    {servant.cards && servant.cards.length > 0
                                        ? servant.cards.map((card, idx) => renderDeckCard(card, idx))
                                        : <span className="text-gray-400 italic">No deck data</span>
                                    }
                                </div>
                            </div>

                            {/* Traits */}
                            <div className="p-3 font-bold bg-gray-50 text-gray-700 flex items-center justify-center">Traits</div>
                            <div className="col-span-3 p-3">
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {servant.traits.map(t => (
                                        <span key={t} className="text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-600">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: CharaGraph Carousel */}
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <div className="relative w-full max-w-md aspect-[0.7] bg-gray-100 rounded-lg shadow-xl overflow-hidden group">
                        <img
                            src={images[currentImageIndex]}
                            alt={`Portrait ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover object-top transition-opacity duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = servant.face; // Fallback to icon
                            }}
                        />

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                    {images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full shadow ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="absolute top-4 right-4">
                            <div className="bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded font-mono">
                                Portrait {currentImageIndex + 1}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS SECTION */}
            <div className="mt-8 border-b border-gray-200 flex gap-1 flex-wrap">
                <TabButton id="np" label="Noble Phantasm" current={activeTab} />
                <TabButton id="skills" label="Active Skills" current={activeTab} />
                <TabButton id="class" label="Class Skills" current={activeTab} />
                <TabButton id="append" label="Append Skills" current={activeTab} />
                <TabButton id="profile" label="Profile" current={activeTab} />
            </div>

            {/* TAB CONTENT */}
            <div className="bg-white shadow-sm border border-t-0 border-gray-200 rounded-b-lg p-6 min-h-[100px] mb-10 transition-all">

                {activeTab === 'none' && (
                    <p className="text-gray-500 text-center italic py-4">Select a tab above to view detailed data.</p>
                )}

                {activeTab === 'np' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 brand-font">Noble Phantasms</h3>
                        {getGroupedNps().length > 0 ? (
                            <div className="space-y-6">
                                {getGroupedNps().map((nps, idx) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        <NpGroupDisplay nps={nps} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No Noble Phantasm data available. Try re-syncing data.</p>
                        )}
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 brand-font">Active Skills</h3>
                        {getGroupedSkills().length > 0 ? (
                            <div className="space-y-6">
                                {getGroupedSkills().map((skills, idx) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        <SkillGroupDisplay skills={skills} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No Skill data available. Try re-syncing data.</p>
                        )}
                    </div>
                )}

                {activeTab === 'class' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 brand-font">Class Skills</h3>
                        {servant.classPassive && servant.classPassive.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {servant.classPassive.map(skill => (
                                    <div key={skill.id} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                                        {skill.icon && <img src={skill.icon} alt="" className="w-10 h-10 mt-1" />}
                                        <div>
                                            <h4 className="font-bold text-gray-900">{skill.name}</h4>
                                            <p className="text-gray-600 text-sm mt-1">{skill.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No Class Skill data available.</p>
                        )}
                    </div>
                )}

                {activeTab === 'append' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 brand-font">Append Skills</h3>
                        {servant.appendPassive && servant.appendPassive.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {servant.appendPassive.map(skill => (
                                    // Reusing SkillDetailedView if possible, or simplified view
                                    <SkillDetailedView key={skill.id} skill={skill} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No Append Skill data available.</p>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 brand-font">Profile & Stats</h3>
                        {servant.profile ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-gray-700 mb-2">Credits</h4>
                                        <p className="text-sm"><span className="font-medium">Illustrator:</span> {servant.profile.illustrator}</p>
                                        <p className="text-sm"><span className="font-medium">CV:</span> {servant.profile.cv}</p>
                                    </div>
                                    {servant.profile.stats && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-bold text-gray-700 mb-2">Parameters</h4>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div>STR: <span className="font-mono font-bold">{servant.profile.stats.strength}</span></div>
                                                <div>END: <span className="font-mono font-bold">{servant.profile.stats.endurance}</span></div>
                                                <div>AGI: <span className="font-mono font-bold">{servant.profile.stats.agility}</span></div>
                                                <div>MAG: <span className="font-mono font-bold">{servant.profile.stats.magic}</span></div>
                                                <div>LUK: <span className="font-mono font-bold">{servant.profile.stats.luck}</span></div>
                                                <div>NP: <span className="font-mono font-bold">{servant.profile.stats.np}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {servant.profile.comments && (
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Profile Comments</h4>
                                        <div className="space-y-4">
                                            {servant.profile.comments.map(comment => (
                                                <div key={comment.id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                                                    <p className="whitespace-pre-wrap">{comment.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">No Profile data available.</p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ServantDetailPage;