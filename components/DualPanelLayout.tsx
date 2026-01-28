'use client';

import React, { ReactNode } from 'react';

interface DualPanelLayoutProps {
  timeBlocksPanel: ReactNode;
  timelinePanel: ReactNode;
  split?: '50-50' | '60-40' | '67-33'; // Layout ratio options
}

export default function DualPanelLayout({
  timeBlocksPanel,
  timelinePanel,
  split = '50-50',
}: DualPanelLayoutProps) {
  // Calculate flex ratios based on split preference
  const getSplitClasses = () => {
    switch (split) {
      case '67-33':
        return { blocks: 'flex-[2]', timeline: 'flex-1' }; // 2:1 ratio = 67:33
      case '60-40':
        return { blocks: 'flex-[3]', timeline: 'flex-[2]' }; // 3:2 ratio = 60:40
      case '50-50':
      default:
        return { blocks: 'flex-1', timeline: 'flex-1' }; // 1:1 ratio = 50:50
    }
  };

  const classes = getSplitClasses();

  return (
    <div className="flex-1 flex overflow-hidden h-full gap-px bg-gray-200">
      {/* Time Blocks Panel */}
      <div className={`${classes.blocks} overflow-y-auto h-full bg-white`}>
        {timeBlocksPanel}
      </div>

      {/* Timeline Panel */}
      <div className={`${classes.timeline} h-full bg-white`}>
        {timelinePanel}
      </div>
    </div>
  );
}
