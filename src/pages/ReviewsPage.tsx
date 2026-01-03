import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Servant, User, Rating, Reply } from '../types';
import { dbService } from '../services/dbService';
import RatingSystem from '../components/RatingSystem';

interface ReviewsPageProps {
    servants: Servant[];
    user: User | null;
}

interface ReviewItemProps {
    rating: Rating;
    user: User | null;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ rating, user }) => {
    const navigate = useNavigate();
    const [replies, setReplies] = useState<Reply[]>([]);
    const [lightUps, setLightUps] = useState(0);
    const [isLit, setIsLit] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    useEffect(() => {
        loadData();
    }, [rating.id, user]);

    const loadData = async () => {
        const fetchedReplies = await dbService.getRepliesForRating(rating.id);
        setReplies(fetchedReplies);

        const count = await dbService.getLightUpsForRating(rating.id);
        setLightUps(count);

        if (user) {
            const lit = await dbService.hasUserLitUp(rating.id, user.id);
            setIsLit(lit);
        }
    };

    const handleLightUp = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Optimistic UI update
        const newIsLit = !isLit;
        setIsLit(newIsLit);
        setLightUps(prev => newIsLit ? prev + 1 : prev - 1);

        // API Call
        const actualIsLit = await dbService.toggleLightUp(rating.id, user.id);

        // Correct if mismatch (though rare in sync code)
        if (actualIsLit !== newIsLit) {
            setIsLit(actualIsLit);
            // Re-fetch count to be safe
            const count = await dbService.getLightUpsForRating(rating.id);
            setLightUps(count);
        }
    };

    const handleReplySubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!replyText.trim()) return;

        setIsSubmittingReply(true);
        await dbService.saveReply(rating.id, user.id, user.username, replyText);
        setReplyText('');
        setShowReplyInput(false);
        setIsSubmittingReply(false);
        await loadData();
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 5) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-lg ${getScoreColor(rating.score)}`}>
                        {rating.score}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{rating.username}</div>
                        <div className="text-xs text-gray-500">{formatDate(rating.timestamp)}</div>
                    </div>
                </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">{rating.comment || <em className="text-gray-400">No written review.</em>}</p>

            <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
                <button
                    onClick={handleLightUp}
                    className={`flex items-center text-sm font-medium transition-colors ${isLit ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isLit ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Light Up {lightUps > 0 && `(${lightUps})`}
                </button>

                <button
                    onClick={() => {
                        if (!user) navigate('/login');
                        else setShowReplyInput(!showReplyInput);
                    }}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply {replies.length > 0 && `(${replies.length})`}
                </button>
            </div>

            {/* Replies Section */}
            {(showReplyInput || replies.length > 0) && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                    {replies.map(reply => (
                        <div key={reply.id} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-gray-800">{reply.username}</span>
                                <span className="text-xs text-gray-400">{formatDate(reply.timestamp)}</span>
                            </div>
                            <p className="text-gray-700">{reply.content}</p>
                        </div>
                    ))}

                    {showReplyInput && (
                        <div className="mt-3 animate-fade-in">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
                            />
                            <div className="flex justify-end mt-2 gap-2">
                                <button
                                    onClick={() => setShowReplyInput(false)}
                                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReplySubmit}
                                    disabled={!replyText.trim() || isSubmittingReply}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Post Reply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ReviewsPage: React.FC<ReviewsPageProps> = ({ servants, user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ratings, setRatings] = useState<Rating[]>([]);

    // Find servant from URL param
    const servant = servants.find(s => s.id === Number(id));

    useEffect(() => {
        if (!servant) return;
        const fetchRatings = async () => {
            const data = await dbService.getRatingsForServant(servant.id);
            setRatings(data);
        };
        fetchRatings();
    }, [servant?.id]);

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

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/servant/${servant.id}`)}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Servant Profile
                </button>

                <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                    <img src={servant.face} alt={servant.name} className="w-16 h-16 rounded-lg border border-gray-200" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 brand-font">{servant.name}</h1>
                        <p className="text-gray-500">User Reviews & Ratings</p>
                    </div>
                </div>
            </div>

            {/* Rating System / My Review */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Your Rating</h2>
                <RatingSystem
                    servantId={servant.id}
                    user={user}
                    onNavigateToLogin={() => navigate('/login')}
                />
            </div>

            {/* Reviews List */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    Community Reviews
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{ratings.length}</span>
                </h2>

                {ratings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No reviews yet. Be the first to rate this Servant!</p>
                    </div>
                ) : (
                    ratings.map(rating => (
                        <ReviewItem
                            key={rating.id}
                            rating={rating}
                            user={user}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;