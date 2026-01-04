import React, { useState, useEffect } from 'react';
import { User, Rating } from '../types';
import { dbService } from '../services/dbService';
import { validateRating, sanitizeComment } from '../utils/validation';

interface RatingSystemProps {
  collectionNo: number; // Changed from servantId
  server: string; // Added server parameter
  user: User | null;
  onNavigateToLogin: () => void;
  onViewReviews?: () => void;
}

const RatingSystem: React.FC<RatingSystemProps> = ({ collectionNo, server, user, onNavigateToLogin, onViewReviews }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [collectionNo, server, user]);

  const loadRatings = async () => {
    const r = await dbService.getRatingsForServant(collectionNo, server);
    setRatings(r);

    if (user) {
        const myRating = await dbService.getUserRating(user.id, collectionNo, server);
        if (myRating) {
            setUserRating(myRating);
            setCommentText(myRating.comment || '');
        } else {
            setUserRating(null);
            setCommentText('');
        }
    } else {
        setUserRating(null);
        setCommentText('');
    }
  };

  const calculateAverage = () => {
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getScoreColor = (score: number) => {
      // 8-10: Green
      if (score >= 8) return 'bg-green-500';
      // 5-7: Yellow
      if (score >= 5) return 'bg-yellow-400';
      // 1-4: Red
      return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
      if (score >= 9) return 'Universal Acclaim';
      if (score >= 8) return 'Generally Favorable';
      if (score >= 5) return 'Mixed or Average';
      if (score >= 4) return 'Generally Unfavorable';
      return 'Overwhelming Dislike';
  }

  const handleScoreClick = async (score: number) => {
      if (!user) {
          onNavigateToLogin();
          return;
      }

      // Validate score
      const validatedScore = validateRating(score);
      if (!validatedScore) {
          alert('Invalid rating score. Please select a score between 1 and 10.');
          return;
      }

      // If just setting score, save empty comment if it doesn't exist, or keep existing
      const commentToSave = userRating?.comment || '';

      const newRating = await dbService.saveRating({
          userId: user.id,
          username: user.username,
          collectionNo,
          server: server as 'JP' | 'CN' | 'EN', // Track for reference but not used in unique constraint
          score: validatedScore,
          comment: commentToSave
      });

      setUserRating(newRating);
      loadRatings(); // Reload to update average
  };

  const handleReviewSubmit = async () => {
      if (!user || !userRating) return; // Should have clicked score first usually, but let's handle it

      setIsSubmitting(true);

      // Sanitize and validate comment
      const sanitizedComment = sanitizeComment(commentText);
      
      if (sanitizedComment.length > 5000) {
          alert('Comment is too long. Maximum length is 5000 characters.');
          setIsSubmitting(false);
          return;
      }

      // Use existing score or default to 5 if somehow editing without score
      const scoreToSave = userRating.score;

      await dbService.saveRating({
          userId: user.id,
          username: user.username,
          collectionNo,
          server: server as 'JP' | 'CN' | 'EN', // Track for reference but not used in unique constraint
          score: scoreToSave,
          comment: sanitizedComment
      });

      setIsSubmitting(false);
      setIsModalOpen(false);
      loadRatings();
  };

  const openReviewModal = () => {
      if (!user) {
          onNavigateToLogin();
          return;
      }
      if (!userRating) {
          alert("Please select a score above before writing a review.");
          return;
      }
      setIsModalOpen(true);
  }

  const average = calculateAverage();
  const displayScore = hoverScore !== null ? hoverScore : (userRating?.score || 0);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* User Score Section */}
        <div
            className={`flex items-center gap-3 ${onViewReviews ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={onViewReviews}
            title={onViewReviews ? "Click to view all reviews" : undefined}
        >
            <div className="flex flex-col items-end">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">User Score</span>
                <span className="text-xs text-gray-400 underline decoration-dotted">
                    {ratings.length === 0 ? 'No Ratings' : (
                         average ? getScoreLabel(parseFloat(average)) : 'No Ratings'
                    )}
                </span>
                <span className="text-[10px] text-blue-500 font-medium hover:underline">
                    Based on {ratings.length} Ratings &raquo;
                </span>
            </div>
            <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-lg shadow-md ${average ? getScoreColor(parseFloat(average)) : 'bg-gray-300'}`}>
                {average || '?'}
            </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px h-10 bg-gray-200"></div>

        {/* My Score Section */}
        <div className="flex flex-col gap-1">
             <div className="flex justify-between items-baseline">
                 <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">My Score</span>
                 {displayScore > 0 && (
                     <span className={`text-xs font-bold ${
                         displayScore >= 8 ? 'text-green-600' : displayScore >= 5 ? 'text-yellow-600' : 'text-red-600'
                     }`}>
                         {getScoreLabel(displayScore)}
                     </span>
                 )}
             </div>

             {/* Interactive Blocks */}
             <div
                className="flex gap-1"
                onMouseLeave={() => setHoverScore(null)}
             >
                 {[...Array(10)].map((_, i) => {
                     const scoreValue = i + 1;
                     const isActive = scoreValue <= displayScore;
                     const colorClass = isActive
                        ? (displayScore >= 8 ? 'bg-green-500' : displayScore >= 5 ? 'bg-yellow-400' : 'bg-red-500')
                        : 'bg-gray-200';

                     return (
                         <div
                            key={i}
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-sm cursor-pointer transition-colors duration-200 ${colorClass} hover:opacity-80`}
                            onMouseEnter={() => setHoverScore(scoreValue)}
                            onClick={() => handleScoreClick(scoreValue)}
                         ></div>
                     );
                 })}
             </div>

             <button
                onClick={openReviewModal}
                className="text-xs text-blue-600 hover:text-blue-800 text-left mt-1 font-medium flex items-center"
             >
                 {userRating?.comment ? 'Edit My Review' : 'Write a Review'}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                 </svg>
             </button>
        </div>

        {/* Review Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm ${getScoreColor(userRating!.score)}`}>
                            {userRating!.score}
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-2">Share your thoughts on this Servant with other Masters.</p>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                            placeholder="Write your review here... (Minimum 10 characters)"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                         <div className="mt-2 flex justify-end">
                            <span className={`text-xs ${commentText.length > 0 && commentText.length < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                                {commentText.length} characters
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReviewSubmit}
                            disabled={isSubmitting || commentText.length < 10}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Review'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RatingSystem;