"use client";

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

// --- UI COMPONENT: Animated Background Lines ---
const AnimatedLines = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Spiral line 1 - Clockwise */}
            <div className="absolute top-1/4 left-1/4">
                <div className="cyber-spiral-1 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/30 to-transparent"></div>
            </div>
            
            {/* Spiral line 2 - Counter-clockwise */}
            <div className="absolute top-2/3 left-3/4">
                <div className="cyber-spiral-2 w-[150px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/25 to-transparent"></div>
            </div>
            
            {/* Large spiral */}
            <div className="absolute top-1/2 left-1/2">
                <div className="cyber-spiral-3 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/20 to-transparent"></div>
            </div>
            
            {/* Small fast spiral */}
            <div className="absolute top-[20%] right-[30%]">
                <div className="cyber-spiral-4 w-[100px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/35 to-transparent"></div>
            </div>
            
            {/* Elliptical spiral */}
            <div className="absolute top-[80%] left-[20%]">
                <div className="cyber-spiral-5 w-[250px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/15 to-transparent"></div>
            </div>
            
            {/* Vertical spiral */}
            <div className="absolute top-[40%] right-[20%]">
                <div className="cyber-spiral-6 w-[180px] h-[1px] bg-gradient-to-r from-transparent via-[#00BFFF]/28 to-transparent"></div>
            </div>
            
            {/* Additional spiral dots/particles for extra effect */}
            <div className="absolute top-[60%] left-[80%]">
                <div 
                    className="w-2 h-2 bg-[#00BFFF]/40 rounded-full"
                    style={{
                        animation: 'spiralClockwise 55s linear infinite'
                    }}
                ></div>
            </div>
            
            <div className="absolute top-[30%] left-[60%]">
                <div 
                    className="w-1 h-1 bg-[#00BFFF]/50 rounded-full"
                    style={{
                        animation: 'spiralCounterClockwise 42s linear infinite'
                    }}
                ></div>
            </div>
        </div>
    );
};

// --- UI COMPONENT: Card ---
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-[#1A1A1A] text-[#E0E0E0] shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";


// --- Mining Configuration ---
const MINING_DIFFICULTY = 3; // Number of leading zeros required

// --- BlockComponent Definition ---
interface BlockProps {
    index: number;
    data: string;
    previousHash: string;
    hash: string;
    nonce: number;
    isValid: boolean;
    isMining: boolean;
    onDataChange: (index: number, newData: string) => void;
    onMineBlock: (index: number) => void;
}

const BlockComponent = ({ index, data, previousHash, hash, nonce, isValid, isMining, onDataChange, onMineBlock }: BlockProps) => {
    const borderColor = isValid ? 'border-[#39FF14]' : 'border-[#FF4500]';
    const shadowColor = isValid ? 'shadow-[#39FF14]/20' : 'shadow-[#FF4500]/20';

    return (
        <Card className={cn(
            "relative z-10 w-full max-w-sm border-4 transition-all duration-300 bg-[#1A1A1A]",
            borderColor,
            shadowColor
        )}>
            <div className="p-4">
                <h3 className="font-bold text-xl mb-3 text-[#E0E0E0]">Block #{index}</h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="text-[#E0E0E0] font-semibold">Data</label>
                        <textarea
                            className="w-full bg-gray-800 text-[#E0E0E0] p-2 rounded mt-1 resize-none h-24 focus:ring-2 focus:ring-[#00BFFF] outline-none border border-gray-600 font-sans"
                            value={data}
                            onChange={(e) => onDataChange(index, e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[#E0E0E0] font-semibold">Previous Hash</label>
                        <div className="bg-gray-800 p-2 rounded mt-1 font-mono break-words text-xs text-[#E0E0E0] border border-gray-600">{previousHash}</div>
                    </div>
                    <div>
                        <label className="text-[#E0E0E0] font-semibold">Nonce</label>
                        <div className="bg-gray-800 p-2 rounded mt-1 font-mono text-xs text-[#E0E0E0] border border-gray-600">{nonce}</div>
                    </div>
                    <div>
                        <label className="text-[#E0E0E0] font-semibold">Hash</label>
                        <div className="bg-gray-800 p-2 rounded mt-1 font-mono break-words text-xs text-[#E0E0E0] border border-gray-600">{hash}</div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => onMineBlock(index)}
                            disabled={isValid || isMining}
                            className={cn(
                                "w-full py-2 px-4 rounded font-semibold text-sm transition-all duration-200",
                                isValid 
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                                    : isMining
                                        ? "bg-[#00BFFF] text-white cursor-not-allowed animate-pulse"
                                        : "bg-[#00BFFF] hover:bg-[#0099CC] text-white cursor-pointer"
                            )}
                        >
                            {isMining ? "Mining..." : isValid ? "Block Valid" : "Mine Block"}
                        </button>
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
    nonce: number;
    isValid: boolean;
    isMining: boolean;
}

const calculateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const mineBlock = async (index: number, previousHash: string, data: string): Promise<{ hash: string; nonce: number }> => {
    let nonce = 0;
    const target = "0".repeat(MINING_DIFFICULTY);
    
    while (true) {
        const blockString = `${index}${previousHash}${data}${nonce}`;
        const hash = await calculateHash(blockString);
        
        if (hash.startsWith(target)) {
            return { hash, nonce };
        }
        
        nonce++;
        
        // Add a small delay every 1000 iterations to prevent UI blocking
        if (nonce % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
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
            tempChain.push({ index: 0, data: genesisData, previousHash: '0', hash: genesisHash, nonce: 0, isValid: true, isMining: false });
            
            const block1Data = 'Amrit sent 5 coins to Ben';
            const block1Hash = await calculateHash(`1${tempChain[0].hash}${block1Data}`);
            tempChain.push({ index: 1, data: block1Data, previousHash: tempChain[0].hash, hash: block1Hash, nonce: 0, isValid: true, isMining: false });
            
            const block2Data = 'Ben sent 2 coins to Charlie';
            const block2Hash = await calculateHash(`2${tempChain[1].hash}${block2Data}`);
            tempChain.push({ index: 2, data: block2Data, previousHash: tempChain[1].hash, hash: block2Hash, nonce: 0, isValid: true, isMining: false });

            const block3Data = 'Charlie sent 10 coins to Amrit';
            const block3Hash = await calculateHash(`3${tempChain[2].hash}${block3Data}`);
            tempChain.push({ index: 3, data: block3Data, previousHash: tempChain[2].hash, hash: block3Hash, nonce: 0, isValid: true, isMining: false });

            setChain(tempChain);
            setIsLoading(false);
        };

        createInitialChain();
    }, []);

    const handleDataChange = async (index: number, newData: string) => {
        const newChain = JSON.parse(JSON.stringify(chain));
        newChain[index].data = newData;
        newChain[index].isValid = false; // Immediately invalidate the block when data changes
        newChain[index].nonce = 0; // Reset nonce
        
        // Invalidate all subsequent blocks when a block's data is changed
        for (let i = index; i < newChain.length; i++) {
            newChain[i].isValid = false;
        }
        
        setChain(newChain);
    };

    const handleMineBlock = async (index: number) => {
        const newChain = JSON.parse(JSON.stringify(chain));
        
        // Set mining state
        newChain[index].isMining = true;
        setChain([...newChain]);

        try {
            // Mine the block
            const { hash, nonce } = await mineBlock(
                newChain[index].index,
                newChain[index].previousHash,
                newChain[index].data
            );
            
            // Update the block with new hash and nonce
            newChain[index].hash = hash;
            newChain[index].nonce = nonce;
            newChain[index].isValid = true;
            newChain[index].isMining = false;

            // Update subsequent blocks' previous hashes and invalidate them
            for (let i = index + 1; i < newChain.length; i++) {
                newChain[i].previousHash = newChain[i - 1].hash;
                newChain[i].isValid = false; // This forces the user to mine subsequent blocks
            }

            setChain([...newChain]);
        } catch (error) {
            console.error('Mining failed:', error);
            newChain[index].isMining = false;
            setChain([...newChain]);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-[#0A0A0A] text-[#E0E0E0] relative overflow-hidden font-sans">
            <AnimatedLines />
            <Glow variant="interactive" className="opacity-40 scale-150 blur-3xl" />
            
            <div className="text-center mb-8 z-10">
            <h1 className="text-2xl font-bold text-[#E0E0E0] mb-2"> <span className='text-red-400'>CESS</span> X <span className='text-blue-400'>Node</span></h1>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00BFFF] to-[#39FF14]">
                    The Unbreakable Chain
                </h1>
                <p className="text-[#E0E0E0] max-w-2xl mt-2 text-base sm:text-lg">
                    This is a live simulation of a blockchain with Proof-of-Work mining. Each block is cryptographically linked to the one before it. 
                    Try changing the data in any block to see it turn red (invalid). Then click "Mine Block" to find a valid nonce and restore the chain&apos;s integrity.
                    Notice how mining one block invalidates the next block, demonstrating the cascading nature of blockchain security.
                </p>
                
            </div>
            
            {isLoading ? (
                <p className="z-10">Generating Genesis Block...</p>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center md:items-start gap-8 z-10 w-full">
                        {chain.map(block => (
                            <BlockComponent
                                key={block.index}
                                index={block.index}
                                data={block.data}
                                previousHash={block.previousHash}
                                hash={block.hash}
                                nonce={block.nonce}
                                isValid={block.isValid}
                                isMining={block.isMining}
                                onDataChange={handleDataChange}
                                onMineBlock={handleMineBlock}
                            />
                        ))}
                    </div>
                    
                    <footer className="mt-12 text-center text-sm text-[#E0E0E0] z-10 w-full">
                        <p>&copy; {new Date().getFullYear()} <a href="https://www.instagram.com/node.hesh?igsh=M3JxYzBoNHJ3OHlj" className='underline hover:text-[#00BFFF]'>Node</a> | All Rights Reserved.</p>
                    </footer>
                </>
            )}
        </main>
        
    );
}
