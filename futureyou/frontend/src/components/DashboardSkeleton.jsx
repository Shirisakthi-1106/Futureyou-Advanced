import React from 'react';
import { motion } from 'framer-motion';

const SkeletonPulse = ({ className }) => (
  <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
    <motion.div
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
    />
  </div>
);

export default function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pt-24 pb-20 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="h-[2px] w-12 bg-white/10"></div>
          <SkeletonPulse className="h-10 w-48" />
        </div>
        <SkeletonPulse className="h-8 w-32 rounded-full" />
      </div>

      {/* Sentinel Placeholder */}
      <SkeletonPulse className="h-24 w-full mb-10 rounded-3xl" />

      {/* Quests Placeholder */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <SkeletonPulse className="h-6 w-6 rounded-lg" />
          <SkeletonPulse className="h-6 w-56" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonPulse key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-44 w-full rounded-[2.5rem]" />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SkeletonPulse className="h-[400px] w-full rounded-[2rem]" />
        <SkeletonPulse className="h-[400px] w-full rounded-[2rem]" />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SkeletonPulse className="h-[400px] w-full rounded-[2rem]" />
        <SkeletonPulse className="h-[400px] w-full rounded-[2rem]" />
      </div>
    </div>
  );
}
