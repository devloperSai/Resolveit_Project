// src/components/shared/FeedbackModal.tsx
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface FeedbackModalProps {
  complaintId: number;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ complaintId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, feedback);
      onClose();
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-8 max-w-md w-full animate-slide-in-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Rate Your Experience</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">How satisfied are you with the resolution?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Additional Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="input-field w-full h-32 resize-none"
            placeholder="Tell us more about your experience..."
            maxLength={500}
          />
          <p className="text-xs text-slate-500 mt-1">{feedback.length}/500</p>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 btn-ghost py-3">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 btn-primary py-3 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};