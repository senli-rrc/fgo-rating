import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  region: string;
  onRegionChange: (region: string) => void;
  badgeText?: string;
  badgeColor?: string;
  extraControls?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  region,
  onRegionChange,
  badgeText,
  badgeColor = 'bg-red-500',
  extraControls
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-gray-200 pb-4">
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
          <h1 className="text-3xl font-bold text-gray-900 brand-font">{title}</h1>
          {badgeText && (
            <span className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded shadow-sm align-middle`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {extraControls}

        {/* Server Selection */}
        <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
          {['JP', 'CN', 'EN'].map(r => (
            <button
              key={r}
              onClick={() => onRegionChange(r)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${region === r
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
