import { useEffect, useState } from 'react';

// Define our intricate 3x3 pixel art grids (1 = colored pixel, 0 = transparent)
const PIXEL_SHAPES = {
  flower:  [0, 1, 0,  
            1, 1, 1,  
            0, 1, 0], // 5-pixel cross/star
            
  diamond: [0, 1, 0,  
            1, 0, 1,  
            0, 1, 0], // Hollow diamond
            
  chunk:   [0, 1, 1,  
            1, 1, 0,  
            0, 0, 1], // Uneven jagged block
            
  twin:    [1, 0, 1,  
            0, 0, 0,  
            0, 0, 0], // Two separated dust pixels

  corners: [1, 0, 1,  
            0, 1, 0,  
            1, 0, 1], // Two separated dust pixels
};

export default function FallingSakura() {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const colors = ['bg-[#f4c2c2]', 'bg-[#f8d7da]', 'bg-[#eeb4b4]', 'bg-[#ffe4e1]'];
    const shapeKeys = Object.keys(PIXEL_SHAPES);

    const newPetals = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, 
      duration: 25 + Math.random() * 30, 
      delay: Math.random() * -60, 
      size: Math.floor(Math.random() * 3) + 1, // Multiplier for the 9x9 grid
      colorClass: colors[Math.floor(Math.random() * colors.length)],
      shapeName: shapeKeys[Math.floor(Math.random() * shapeKeys.length)],
      animationName: i % 2 === 0 ? 'sakuraSway1' : 'sakuraSway2'
    }));
    
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map(p => (
        <div
          key={p.id}
          className="absolute top-[-10%]"
          style={{
            left: `${p.left}%`,
            width: `${p.size * 9}px`,  
            height: `${p.size * 9}px`, 
            animation: `${p.animationName} ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
           <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0">
            {PIXEL_SHAPES[p.shapeName].map((isFilled, index) => (
              <div
                key={index}
                className={isFilled ? `${p.colorClass} opacity-60 dark:opacity-35 shadow-sm` : 'bg-transparent'}
              />
            ))}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes sakuraSway1 {
          0% { top: -10%; transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(25px) rotate(90deg); }
          50% { transform: translateX(-20px) rotate(180deg); }
          75% { transform: translateX(30px) rotate(270deg); }
          100% { top: 110%; transform: translateX(-15px) rotate(360deg); }
        }
        @keyframes sakuraSway2 {
          0% { top: -10%; transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-25px) rotate(-90deg); }
          50% { transform: translateX(20px) rotate(-180deg); }
          75% { transform: translateX(-30px) rotate(-270deg); }
          100% { top: 110%; transform: translateX(15px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}