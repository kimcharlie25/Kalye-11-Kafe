import React from 'react';
import { Utensils, ShoppingBag } from 'lucide-react';
import { useTable } from '../contexts/TableContext';

interface LandingPageProps {
    onContinue: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onContinue }) => {
    const { setServiceType } = useTable();

    const handleSelection = (type: 'dine-in' | 'takeout') => {
        setServiceType(type);
        onContinue();
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-12">
                {/* Logo/Branding */}
                <div className="space-y-4">
                    <h1 className="text-6xl font-sans font-black text-black uppercase tracking-tighter">
                        Kalye 11 Kafe
                    </h1>
                    <p className="text-black opacity-60 font-sans uppercase text-xs tracking-[0.2em] font-bold">
                        Street-Style Taiwanese Flavors
                    </p>
                </div>

                {/* Selection Area */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-sans font-black text-black uppercase tracking-tighter mb-8">
                        How would you like to enjoy your meal?
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => handleSelection('dine-in')}
                            className="group relative flex flex-col items-center justify-center py-10 border-4 border-black hover:bg-black transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <Utensils className="h-12 w-12 mb-4 text-black group-hover:text-white transition-colors" />
                            <span className="text-3xl font-sans font-black text-black group-hover:text-white uppercase tracking-tighter">
                                Dine-In
                            </span>
                            <span className="mt-2 text-[10px] text-gray-400 group-hover:text-gray-300 uppercase tracking-widest font-bold">
                                Enjoy it here
                            </span>
                        </button>

                        <button
                            onClick={() => handleSelection('takeout')}
                            className="group relative flex flex-col items-center justify-center py-10 border-4 border-black hover:bg-black transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <ShoppingBag className="h-12 w-12 mb-4 text-black group-hover:text-white transition-colors" />
                            <span className="text-3xl font-sans font-black text-black group-hover:text-white uppercase tracking-tighter">
                                Takeout
                            </span>
                            <span className="mt-2 text-[10px] text-gray-400 group-hover:text-gray-300 uppercase tracking-widest font-bold">
                                On the go
                            </span>
                        </button>
                    </div>
                </div>

                {/* Footer info */}
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pt-8">
                    Welcome to Kalye 11 Kafe • #getcaffienatedhereatkalye11kafe💙
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
