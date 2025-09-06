"use client";

//disable-eslint @typescript-eslint/no-misused-promises
//disable-eslint @typescript-eslint/no-non-null-assertion

import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

// --- UTILITY: cn (for merging Tailwind classes) ---
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// --- UI COMPONENT: Glow ---
const glowVariants = cva("absolute w-full", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-[128px]",
      bottom: "bottom-0",
      below: "-bottom-[128px]",
      center: "top-[50%]",
      interactive: "top-0",
    },
  },
  defaultVariants: {
    variant: "top",
  },
});

const Glow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof glowVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(glowVariants({ variant }), className)}
    {...props}
  >
    <div
      className={cn(
        "absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsla(var(--brand-foreground)/.5)_10%,_hsla(var(--brand-foreground)/0)_60%)] sm:h-[512px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
    <div
      className={cn(
        "absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsla(var(--brand)/.3)_10%,_hsla(var(--brand-foreground)/0)_60%)] sm:h-[256px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
  </div>
));
Glow.displayName = "Glow";


// --- UI COMPONENT: Card ---
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";


// --- BlockComponent Definition ---
interface BlockProps {
    index: number;
    data: string;
    previousHash: string;
    hash: string;
    isValid: boolean;
    onDataChange: (index: number, newData: string) => void;
}

const BlockComponent = ({ index, data, previousHash, hash, isValid, onDataChange }: BlockProps) => {
    const borderColor = isValid ? 'border-green-500/80' : 'border-red-500/80';
    const shadowColor = isValid ? 'shadow-green-500/20' : 'shadow-red-500/20';

    return (
        <Card className={cn(
            "relative z-10 w-full max-w-sm border-4 transition-all duration-300 bg-white/80 backdrop-blur-sm",
            borderColor,
            shadowColor
        )}>
            <div className="p-4">
                <h3 className="font-bold text-xl mb-3 text-gray-800">Block #{index}</h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="text-gray-600 font-semibold">Data</label>
                        <textarea
                            className="w-full bg-gray-50 text-gray-900 p-2 rounded mt-1 resize-none h-24 focus:ring-2 focus:ring-green-400 outline-none border border-gray-300 font-sans"
                            value={data}
                            onChange={(e) => onDataChange(index, e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-gray-600 font-semibold">Previous Hash</label>
                        <div className="bg-gray-100 p-2 rounded mt-1 font-mono break-words text-xs text-gray-700 border border-gray-200">{previousHash}</div>
                    </div>
                    <div>
                        <label className="text-gray-600 font-semibold">Hash</label>
                        <div className="bg-gray-100 p-2 rounded mt-1 font-mono break-words text-xs text-gray-700 border border-gray-200">{hash}</div>
                    </div>
                </div>
            </div>
        </Card>
    );
};


// --- HomePage Component Definition ---
interface Block {
    index: number;
    data: string;
    previousHash: string;
    hash: string;
    isValid: boolean;
}

const calculateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function HomePage() {
    const [chain, setChain] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const createInitialChain = async () => {
            setIsLoading(true);
            const tempChain: Block[] = [];
            
            const genesisData = 'Genesis Block';
            const genesisHash = await calculateHash(`00${genesisData}`);
            tempChain.push({ index: 0, data: genesisData, previousHash: '0', hash: genesisHash, isValid: true });
            
            const block1Data = 'Amrit sent 5 coins to Ben';
            const block1Hash = await calculateHash(`1${tempChain[0].hash}${block1Data}`);
            tempChain.push({ index: 1, data: block1Data, previousHash: tempChain[0].hash, hash: block1Hash, isValid: true });
            
            const block2Data = 'Ben sent 2 coins to Charlie';
            const block2Hash = await calculateHash(`2${tempChain[1].hash}${block2Data}`);
            tempChain.push({ index: 2, data: block2Data, previousHash: tempChain[1].hash, hash: block2Hash, isValid: true });

            const block3Data = 'Charlie sent 10 coins to Amrit';
            const block3Hash = await calculateHash(`3${tempChain[2].hash}${block3Data}`);
            tempChain.push({ index: 3, data: block3Data, previousHash: tempChain[2].hash, hash: block3Hash, isValid: true });

            setChain(tempChain);
            setIsLoading(false);
        };

        createInitialChain();
    }, []);

    const handleDataChange = async (index: number, newData: string) => {
        const newChain = JSON.parse(JSON.stringify(chain));
        newChain[index].data = newData;
        newChain[index].hash = await calculateHash(`${index}${newChain[index].previousHash}${newChain[index].data}`);

        for (let i = 1; i < newChain.length; i++) {
            const previousBlock = newChain[i - 1];
            const currentBlock = newChain[i];

            if (previousBlock.isValid && currentBlock.previousHash === previousBlock.hash) {
                currentBlock.isValid = true;
            } else {
                for (let j = i; j < newChain.length; j++) {
                    newChain[j].isValid = false;
                }
                break;
            }
        }
        setChain(newChain);
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-white text-gray-800 relative overflow-hidden font-sans">
            <Glow variant="interactive" className="opacity-40 scale-150 blur-3xl" />
            
            <div className="text-center mb-8 z-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-2"> <span className='text-red-600'>CESS</span> X <span className='text-blue-600'>Node</span></h1>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-300">
                    The Unbreakable Chain
                </h1>
                <p className="text-gray-600 max-w-2xl mt-2 text-base sm:text-lg">
                    This is a live simulation of a blockchain. Each block is cryptographically linked to the one before it. 
                    Try changing the data in any block to see the instant effect on the chain&apos;s integrity.
                </p>
                
            </div>
            
            {isLoading ? (
                <p className="z-10">Generating Genesis Block...</p>
            ) : (
                <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center md:items-start gap-8 z-10 w-full">
                    {chain.map(block => (
                        <BlockComponent
                            key={block.index}
                            index={block.index}
                            data={block.data}
                            previousHash={block.previousHash}
                            hash={block.hash}
                            isValid={block.isValid}
                            onDataChange={handleDataChange}
                        />
                    ))}
                      <div>
                   <footer className="mt-12 text-center text-sm text-slate-500">
                          <p>&copy; {new Date().getFullYear()} <a href="https://www.instagram.com/node.hesh?igsh=M3JxYzBoNHJ3OHlj" className='underline hover:text-cyan-500'>Node</a> | All Rights Reserved.</p>
                      </footer>
                </div>  
                </div>          
            )}
        </main>
        
    );
}
