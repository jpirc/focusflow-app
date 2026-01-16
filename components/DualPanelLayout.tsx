'use client';

import React, { ReactNode, useState } from 'react';

interface DualPanelLayoutProps {
  timeBlocksPanel: ReactNode;
  timelinePanel: ReactNode;
}

export default function DualPanelLayout({
  timeBlocksPanel,
  timelinePanel,
}: DualPanelLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Time Blocks Panel (67%) */}
      <div className="flex-[2] overflow-y-auto h-full">
        {timeBlocksPanel}
      </div>

      {/* Timeline Panel (33%) */}
      <div className="flex-1 h-full">
        {timelinePanel}
      </div>
    </div>
  );
}
