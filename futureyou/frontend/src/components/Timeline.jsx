import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Timeline({ milestones }) {
    if (!milestones || milestones.length === 0) return null;

    const getIcon = (tone) => {
        switch (tone) {
            case 'positive': return <TrendingUp className="text-neon" />;
            case 'warning': return <AlertCircle className="text-red-400" />;
            default: return <Calendar className="text-purple" />;
        }
    };

    const getShadow = (tone) => {
        switch (tone) {
            case 'positive': return 'shadow-[0_0_20px_rgba(0,255,204,0.3)]';
            case 'warning': return 'shadow-[0_0_20px_rgba(255,51,102,0.3)]';
            default: return 'shadow-[0_0_20px_rgba(176,38,255,0.3)]';
        }
    };

    return (
        <div className="relative py-20 px-4 md:px-6 max-w-4xl mx-auto">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-neon via-purple to-transparent opacity-20 top-0"></div>

            <h2 className="text-center text-3xl md:text-5xl font-black tracking-tighter mb-20 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent px-4">
                The Path Ahead <br/><span className="text-neon text-[10px] md:text-lg tracking-[0.3em] md:tracking-widest uppercase opacity-80 font-black">Chronological Evolution</span>
            </h2>

            <div className="space-y-12 relative">
                {milestones.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, y: 20 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                        className={`flex flex-col md:flex-row items-start md:items-center w-full ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
                    >
                        {/* Central Icon / Dot (Mobile: left-aligned) */}
                        <div className="absolute left-4 md:static md:w-[10%] flex justify-center z-10">
                            <motion.div 
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-white/10 glass-panel backdrop-blur-2xl shadow-xl transition-all duration-300 ${getShadow(item.tone)}`}
                            >
                                {getIcon(item.tone)}
                            </motion.div>
                        </div>

                        {/* Content Card */}
                        <div className={`w-full md:w-[45%] ml-16 md:ml-0 group`}>
                            <div className={`glass-panel p-6 md:p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all duration-500 relative overflow-hidden ${getShadow(item.tone)}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <h4 className="text-[10px] font-black tracking-widest text-neon uppercase italic">Year {item.year}</h4>
                                    <div className="h-[1px] flex-1 bg-white/10"></div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold mb-3 tracking-tighter text-white">{item.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">{item.description}</p>
                            </div>
                        </div>

                        {/* Spacer for Desktop Grid */}
                        <div className="hidden md:block md:w-[45%]"></div>
                    </motion.div>
                ))}
            </div>

            {/* End Point */}
            <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mt-20 flex flex-col items-center gap-4 py-10"
            >
                <div className="w-4 h-4 rounded-full bg-neon shadow-[0_0_15px_#00ffcc]"></div>
                <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Projected Destination</p>
            </motion.div>
        </div>
    );
}
