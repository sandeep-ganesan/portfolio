import { useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { openWindows, closeWindow, focusWindow } from '../store/windows';

// 1. We create a custom component for an individual window
function DraggableWindow({ win, index }) {
  // NEW: A ref to measure the window's actual physical size on screen
  const windowRef = useRef(null);

  // Stagger new windows based on how many are open, adjusting for small browser sizes
  const [pos, setPos] = useState(() => {
    if (typeof window !== 'undefined') {
      const safeWidth = Math.min(900, window.innerWidth * 0.95);
      const safeHeight = Math.min(750, window.innerHeight * 0.90);
      
      // Create a random offset between -25px and +25px
      const jitterX = Math.floor(Math.random() * 50) - 100;
      const jitterY = Math.floor(Math.random() * 50) - 25;

      // Shift base slightly up/left (-30), increase index cascade (+40), and apply jitter
      const startX = Math.max(10, (window.innerWidth / 2) - (safeWidth / 2) - 30 + (index * 40) + jitterX);
      const startY = Math.max(10, (window.innerHeight / 2) - (safeHeight / 2) - 30 + (index * 40) + jitterY);
      
      return { x: startX, y: startY };
    }
    // Fallback just in case
    return { x: 10, y: 10 }; 
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.target.setPointerCapture(e.pointerId); 
  };

  const handlePointerMove = (e) => {
    // NEW: Ensure we have a reference to the window element before moving
    if (!isDragging || !windowRef.current) return;

    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    // NEW: Read the actual dynamically resized width of the window instead of hardcoding 900
    const winWidth = windowRef.current.offsetWidth;
    const titleBarHeight = 40; 
    const minVisibleX = 100; 

    // Horizontal Clamp
    newX = Math.max(-winWidth + minVisibleX, Math.min(newX, window.innerWidth - minVisibleX));
    
    // Vertical Clamp
    newY = Math.max(0, Math.min(newY, window.innerHeight - titleBarHeight));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={windowRef}
      onPointerDown={() => focusWindow(win.id)}
      // NEW: Added max-w-[95vw] and max-h-[90vh] so the window shrinks on smaller monitors
      className="absolute flex flex-col bg-[#f4ece6] pointer-events-auto max-md:!left-0 max-md:!top-0 max-md:!w-full max-md:!h-[100dvh] max-md:border-none max-md:shadow-none border-4 border-[#5c4f4f] shadow-[8px_8px_0px_0px_rgba(92,79,79,0.3)] w-[900px] h-[750px] max-w-[95vw] max-h-[90vh]"
      style={{ 
        left: pos.x, 
        top: pos.y, 
        zIndex: 100 + (win.zIndex || 0) 
      }}
    >
      {/* --- THE DRAG HANDLE (HEADER) --- */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="bg-[#8f9ca6] text-[#2c2626] px-3 py-2 flex justify-between items-center border-b-4 border-[#5c4f4f] cursor-default select-none touch-none max-md:py-3"
      >
        <span className="font-bold tracking-widest text-sm uppercase pointer-events-none">
          {win.title}
        </span>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => closeWindow(win.id)}
          className="text-[#2c2626] hover:text-[#d97373] font-bold cursor-default transition-transform hover:scale-110 text-lg md:text-base px-2"
        >
          [X]
        </button>
      </div>

      {/* --- THE WINDOW CONTENT --- */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto text-[#5c4f4f] leading-relaxed cursor-auto">
        
        {win.id === 'about' && (
          <div className="flex flex-col gap-4 h-full overflow-y-auto md:pr-2 pb-12 pointer-events-auto">
            
            {/* Top Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 border-b-4 border-[#8f9ca6] pb-6">
              <div className="w-48 h-48 md:w-64 md:h-64 bg-[#c9d4d9] border-4 border-[#5c4f4f] flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(92,79,79,0.2)]">
                <img src="media/bk_pic.png" alt="Profile" className="w-full h-full object-cover pixel-art" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-widest text-[#2c2626]">Sandeep Ganesan</h2>
                <p className="text-[#d97373] font-bold text-lg mt-1">University Student and Freelance Developer</p>
              </div>
            </div>

            {/* Bio Content Area */}
            <div className="space-y-5 text-lg">
              <p>
                Hello! I'm a third-year university student currently based in Japan. 
              </p>
              <p>
                I'm passionate about creating engaging digital experiences, whether that's through building interactive web applications or solving real-world problems through mobile applications. I also love dabbling in AI, NLP and robotics.
              </p>
              <p>
                My current technical focuses include creating mobile applications using Flutter and React. I also use ROS2 for my robotics projects.
              </p>

              <div>
                <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                  Education
                </h3>
                <p>
                  B.Engg. in Information Systems Science and Engineering, <strong>Ritsumeikan University</strong>, Expected Graduation: <strong>2028</strong>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                  Other Interests
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Gaming:</strong> I like to play some video games in my free time. Current favorite is <em>Rainbow Six Siege</em>.</li>
                  <li><strong>Drawing silly art:</strong> I draw silly art when I am bored. The current profile picture is something I drew.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                Language Proficiency
              </h3>
              <p>
                I am fluent in English and Tamil and have conversational proficiency in Japanese.
              </p>
            </div>

          </div>
        )}

        {win.id === 'projects' && (
          <ProjectsContent />
        )}

        {win.id === 'contact' && (
          <ContactContent />
        )}

        {win.id === 'clock' && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="opacity-50 italic">Time Zone is JST. This window is a WIP ({'>'}ᴗ•) !</p>
          </div>
        )}

        {win.id === 'credits' && (
          <div className="flex flex-col gap-4 h-full">
            <h2 className="text-3xl font-bold tracking-widest text-[#2c2626] uppercase border-b-4 border-[#8f9ca6] pb-4">
              Credits & Resources
            </h2>
            
            <div className="space-y-6 text-lg mt-2">
              <p>
                A huge thank you to the creators, developers, and artists whose tools and inspiration made this portfolio possible:
              </p>
              
              <ul className="space-y-4">
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">Design Inspiration</span>
                  <span><a href="https://www.sharyap.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Sharlene Yap's Website</a></span>
                </li>
                
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">Music</span>
                  <span><a href="https://incompetech.com/" target="_blank" rel="noopener noreferrer" className="hover:underline break-all sm:break-normal">Gymnopedie No. 1 by Erik Satie (performed by Kevin MacLeod)</a></span>
                </li>

                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">Typography</span>
                  <span>DotGothic16 via Google Fonts</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">Icons</span>
                  <span>
                    <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Material Design Icons by Google
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// A dedicated component just for the Projects window to handle its own filter state
function ProjectsContent() {
  const [filter, setFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: "Streamoo",
      category: "personal",
      stack: "Flutter • Flask • Firebase",
      description: "A modern application to keep track of your favorite streamers across Twitch and YouTube with real-time visibility.",
      github: "https://github.com/sandeep-ganesan/Streamoo",
      details: {
        features: [
          "Live Status Widget for the home screen",
          "Multi-Platform Support (Twitch & YouTube)",
          "Account Sync via Firebase Auth",
          "Dark Mode interface"
        ],
        architecture: "Polling-based architecture where a Flask backend queries APIs every 15 minutes and syncs live status changes directly to Firestore for the app and widget."
      }
    },
    {
      id: 2,
      title: "読READER",
      category: "personal",
      stack: "React Native • Llama 3.2 • llama.rn",
      description: "A minimalist application for reading EPUB files and conversing with an on-device AI assistant—completely offline.",
      github: "https://github.com/sandeep-ganesan/YomiREADER",
      details: {
        features: [
          "On-Device RAG for book-specific chatting",
          "Native C++ Engine powered by llama.rn",
          "Vector Caching for optimized local storage",
          "Custom reader core with gesture navigation"
        ],
        architecture: "EPUBs are chunked and embedded via Nomic Embed Text v1.5. User queries trigger cosine similarity search, and Meta Llama 3.2 3B processes segments for a grounded response directly on mobile hardware."
      }
    },
    {
      id: 3,
      title: "Dynamic VAA Updater",
      category: "school",
      stack: "Python • BERT • YouTube API",
      description: "A team-based machine learning pipeline that dynamically updates Voting Advice Applications (VAAs) by tracking politicians' social media statements.",
      details: {
        features: [
          "Automated YouTube API data collection & scraping",
          "BERTopic modeling for data noise reduction",
          "Fine-tuned BERT sentiment analysis",
          "Semantic similarity matching for manifesto deviations"
        ],
        architecture: "Collects real-time social media data, filtering it via BERTopic. Processed text undergoes sentiment analysis using a BERT model fine-tuned on political manifestos, then uses semantic algorithms to flag orientation shifts for VAA updates."
      }
    }
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto md:pr-2 pb-12 pointer-events-auto">
      
      {/* The Main Header */}
      <h2 className="text-3xl font-bold tracking-widest text-[#2c2626] uppercase border-b-4 border-[#8f9ca6] pb-4 sticky top-0 bg-[#f4ece6] z-10 pt-2">
        Projects
      </h2>
      
      {/* The Filter Buttons */}
      <div className="flex flex-wrap gap-3 md:gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'all' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('school')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'school' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          School
        </button>
        <button
          onClick={() => setFilter('personal')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'personal' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          Personal
        </button>
      </div>

      {/* The Project Grid */}
      <div className="grid grid-cols-1 gap-6 mt-4">
         {filteredProjects.map(project => (
           <div key={project.id} className="border-4 border-[#5c4f4f] bg-[#e4dcc6] flex flex-col shadow-[4px_4px_0px_0px_rgba(92,79,79,0.2)]">
             
             {/* Card Header */}
             <div className="p-4 border-b-4 border-[#5c4f4f] bg-[#c9d4d9] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
               <div>
                 <h3 className="font-bold text-2xl text-[#2c2626] tracking-wide">{project.title}</h3>
                 <span className="text-sm font-bold text-[#d97373]">{project.stack}</span>
               </div>
               <span className="text-xs font-bold text-[#5c4f4f] uppercase border-2 border-[#5c4f4f] px-2 py-1 bg-[#f4ece6]">
                 {project.category}
               </span>
             </div>

             {/* Card Body */}
             <div className="p-4 space-y-4 text-[#5c4f4f]">
               <p className="font-bold text-lg leading-snug">
                 {project.description}
               </p>

               {/* Features List */}
               <div>
                 <h4 className="font-bold text-[#2c2626] border-b-2 border-[#8f9ca6] inline-block mb-2 uppercase text-sm tracking-wider">Key Features</h4>
                 <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                   {project.details.features.map((feature, i) => (
                     <li key={i}>{feature}</li>
                   ))}
                 </ul>
               </div>

               {/* Architecture Blurb */}
               <div className="bg-[#f4ece6] p-3 border-2 border-[#8f9ca6] text-sm">
                 <span className="font-bold text-[#d97373] block mb-1">Architecture Pipeline:</span>
                 {project.details.architecture}
               </div>

               {project.github && (
                 <a 
                   href={project.github} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="mt-auto self-start flex items-center justify-center gap-2 px-4 py-2 border-4 border-[#5c4f4f] bg-[#c9d4d9] hover:bg-[#8f9ca6] hover:text-[#f4ece6] transition-all group shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] hover:translate-y-1 hover:shadow-none"
                 >
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#2c2626] group-hover:text-[#f4ece6] transition-colors">
                     <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                   </svg>
                   <span className="font-bold uppercase tracking-wider text-[#2c2626] group-hover:text-[#f4ece6] transition-colors text-sm">
                     View Source
                   </span>
                 </a>
               )}
               
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}

// A dedicated component for the Contact window
function ContactContent() {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto md:pr-2 pb-12 pointer-events-auto">
      
      {/* The Main Header */}
      <h2 className="text-3xl font-bold tracking-widest text-[#2c2626] uppercase border-b-4 border-[#8f9ca6] pb-4">
        Contact
      </h2>

      <div className="space-y-6 text-[#5c4f4f] text-lg mt-2">
        <p>
          The easiest way to reach me is through LinkedIn, but feel free to connect with me on GitHub or shoot me an email as well! I don't use much of social media so LinkedIn or Email would be preffered.
          </p>
        <p className="font-bold text-[#d97373]">
          I am currently looking for internship opportunities and open-source collaborations.
        </p>

        {/* The Contact Links */}
        <div className="flex flex-col gap-4 mt-6">
          
          <a href="mailto:placeholder@wip.com" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 border-4 border-[#5c4f4f] bg-[#e4dcc6] hover:bg-[#d97373] hover:text-[#f4ece6] transition-colors group">
            <span className="font-bold uppercase tracking-wider">Email</span>
            <span className="text-sm opacity-80 group-hover:opacity-100 md:ml-auto break-all sm:break-normal">placeholder@wip.com</span>
          </a>

          <a href="https://github.com/sandeep-ganesan" target="_blank" rel="noopener noreferrer" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 border-4 border-[#5c4f4f] bg-[#e4dcc6] hover:bg-[#d97373] hover:text-[#f4ece6] transition-colors group">
            <span className="font-bold uppercase tracking-wider">GitHub</span>
            <span className="text-sm opacity-80 group-hover:opacity-100 md:ml-auto break-all sm:break-normal">@sandeep-ganesan</span>
          </a>

          <a href="https://linkedin.com/in/sandeep-ganesan-7ab40b366" target="_blank" rel="noopener noreferrer" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 border-4 border-[#5c4f4f] bg-[#e4dcc6] hover:bg-[#d97373] hover:text-[#f4ece6] transition-colors group">
            <span className="font-bold uppercase tracking-wider">LinkedIn</span>
            <span className="text-sm opacity-80 group-hover:opacity-100 md:ml-auto break-all sm:break-normal">Connect with me</span>
          </a>
          
          {/* Resume Download Button */}
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 p-4 border-4 border-[#5c4f4f] bg-[#c9d4d9] hover:bg-[#8f9ca6] hover:text-[#f4ece6] transition-all group mt-4 shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] hover:translate-y-1 hover:shadow-none text-center">
            <span className="font-bold uppercase tracking-wider text-[#2c2626] group-hover:text-[#f4ece6]">View Resume (404 WIP)</span>
          </a>

        </div>
      </div>
    </div>
  );
}

// 2. The Main Manager that renders all open windows
export default function WindowManager() {
  const windows = useStore(openWindows);

  return (
    <>
      {windows.map((win, index) => (
        <DraggableWindow key={win.id} win={win} index={index} />
      ))}
    </>
  );
}