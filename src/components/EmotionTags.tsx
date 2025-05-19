import React from 'react';

interface EmotionTagsProps {
  emotions: { tag: string; count: number }[];
}

const EmotionTags: React.FC<EmotionTagsProps> = ({ emotions }) => {
  if (!emotions.length) {
    return (
      <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No emotion tags yet</p>
      </div>
    );
  }

  // Calculate the maximum count to normalize sizes
  const maxCount = Math.max(...emotions.map(e => e.count));

  // Color classes for emotion tags
  const colorClasses = [
    'bg-primary-100 text-primary-800',
    'bg-secondary-100 text-secondary-800',
    'bg-accent-100 text-accent-800',
    'bg-green-100 text-green-800',
    'bg-indigo-100 text-indigo-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map((emotion, index) => {
        // Calculate relative size based on count
        const sizeClass = 
          emotion.count === maxCount
            ? 'text-base font-semibold'
            : emotion.count >= maxCount * 0.75
            ? 'text-sm font-medium'
            : 'text-xs';

        // Choose color class
        const colorClass = colorClasses[index % colorClasses.length];

        return (
          <div 
            key={emotion.tag}
            className={`tag ${colorClass} ${sizeClass} flex items-center`}
          >
            <span>{emotion.tag}</span>
            <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
              {emotion.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default EmotionTags;