import { useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { openWindows, closeWindow, focusWindow } from '../store/windows';
import { currentLang } from '../store/locale';

function DraggableWindow({ win, index }) {
  const windowRef = useRef(null);
  const lang = useStore(currentLang);

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
          {lang === 'en' 
            ? win.title 
              : (win.id === 'about' ? '自己紹介' 
              : win.id === 'projects' ? 'プロジェクト' 
              : win.id === 'contact' ? '連絡先' 
              : win.id === 'credits' ? 'クレジット' 
              : win.title)}
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
                <h2 className="text-3xl font-bold tracking-widest text-[#2c2626]">{lang === 'en' ? 'Sandeep Ganesan' : 'サンディープ　ガネーサン'}</h2>
                <p className="text-[#d97373] font-bold text-lg mt-1">{lang === 'en' ? 'University Student and Freelance Developer' : '大学生・フリーランス開発者'}</p>
              </div>
            </div>

            {/* Bio Content Area */}
            <div className="space-y-5 text-lg">
              <p>
                {lang === 'en' ? 'Hello! I\'m a third-year university student currently based in Japan. ' : 'こんにちは！現在、日本に住んでいる大学3年生です。'}
              </p>
              <p>
                {lang === 'en' ? 'I\'m passionate about creating engaging digital experiences, whether that\'s through building interactive web applications or solving real-world problems through mobile applications. I also love dabbling in AI, NLP and robotics.' : 'インタラクティブなウェブアプリの開発や、モバイルアプリで実社会の課題を解決することに、やりがいを感じています。また、AI、自然言語処理（NLP）、ロボティクスにも興味があります。'}
              </p>
              <p>
                {lang === 'en' ? 'My current technical focuses include creating mobile applications using Flutter and React. I also use ROS2 for my robotics projects.' : '現在は、FlutterとReactを使ってモバイルアプリを作ることに力を入れています。また、ロボットのプロジェクトではROS2も使っています。'}
              </p>

              <div>
                <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                  {lang === 'en' ? 'Education' : '学歴'}
                </h3>
                <p>
                  {lang === 'en' ? (<>B.Engg. in Information Systems Science and Engineering, <strong>Ritsumeikan University</strong>, Expected Graduation: <strong>2028</strong></>) : (<><strong>立命館大学</strong> 情報理工学部 在学中、<strong>2028</strong>年卒業見込み</>)}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                  {lang === 'en' ? 'Other Interests' : '趣味'}
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{lang === 'en' ? (<><strong>Gaming:</strong> I like to play some video games in my free time. Current favorite is <em>Rainbow Six Siege</em>.</>) : (<><strong>ゲーム:</strong> 暇なときはよくゲームをします。最近は<em>レインボーシックス シージ</em>でよく遊びます。</>)}</li>
                  <li>{lang === 'en' ? (<><strong>Drawing silly art:</strong> I draw silly art when I am bored. The current profile picture is something I drew.</>) : (<><strong>イラスト:</strong> 暇なときに、ゆるい感じのイラストを描きます。現在のプロフィール画像も自分で描いたものです。</>)}</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#d97373] border-b-2 border-[#d97373]/30 inline-block mb-2">
                {lang === 'en' ? 'Language Proficiency' : '語学力'}
              </h3>
              <p>
                {lang === 'en' ? 'I am fluent in English and Tamil and have conversational proficiency in Japanese.' : '英語とタミル語は流暢に話すことができます。日本語は日常会話ができます。'}
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
              {lang === 'en' ? 'Credits & Resources' : 'クレジットと参考資料'}
            </h2>
            
            <div className="space-y-6 text-lg mt-2">
              <p>
                {lang === 'en' ? 'A huge thank you to the creators, developers, and artists whose tools and inspiration made this portfolio possible:' : 'このポートフォリオを作るにあたって、ツールやアイデアのきっかけをくれたクリエイター、開発者、アーティストの皆さんに心から感謝します。'}
              </p>
              
              <ul className="space-y-4">
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">{lang === 'en' ? 'Design Inspiration' : 'デザインのインスピレーション'}</span>
                  <span><a href="https://www.sharyap.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">{lang === 'en' ? "Sharlene Yap's Website" : "Sharlene Yapのホームページ"}</a></span>
                </li>
                
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">{lang === 'en' ? 'Music' : '音楽'}</span>
                  <span><a href="https://incompetech.com/" target="_blank" rel="noopener noreferrer" className="hover:underline break-all sm:break-normal">{lang === 'en' ? "Gymnopedie No. 1 by Erik Satie (performed by Kevin MacLeod)" : "エリック・サティ作『ジムノペディ第1番』（ケビン・マクレオド演奏）"}</a></span>
                </li>

                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">{lang === 'en' ? 'Typography' : 'タイポグラフィ'}</span>
                  <span>{lang === 'en' ? "DotGothic16 via Google Fonts" : "Google FontsのDotGothic16"}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold text-[#d97373]">{lang === 'en' ? 'Icons' : 'アイコン'}</span>
                  <span>
                    <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {lang === 'en' ? "Material Design Icons by Google" : "GoogleのMaterial Design Icons"}
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
  const lang = useStore(currentLang);

  const projects = [
    {
      id: 1,
      title: "Streamoo",
      category: "personal",
      stack: "Flutter • Flask • Firebase",
      description: {
        en: "A modern application to keep track of your favorite streamers across Twitch and YouTube with real-time visibility.",
        ja: "お気に入りの配信者がTwitchやYouTubeで配信中かどうかを、リアルタイムで確認できるモダンなアプリです。"
      },
      github: "https://github.com/sandeep-ganesan/Streamoo",
      apkLink: "https://dl.sandeepganesan.com/streamoo.apk",
      details: {
        features: {
          en: [
            "Live Status Widget for the home screen",
            "Multi-Platform Support (Twitch & YouTube)",
            "Account Sync via Firebase Auth",
            "Dark Mode interface"
          ],
          ja: [
            "配信状況を表示するホーム画面ウィジェット",
            "マルチプラットフォーム対応（Twitch・YouTube）",
            "Firebase Authによるアカウント同期",
            "ダークモード対応のUI"
          ]
        },
        architecture: {
          en: "Polling-based architecture where a Flask backend queries APIs every 15 minutes and syncs live status changes directly to Firestore for the app and widget.",
          ja: "ポーリング方式のアーキテクチャです。Flaskのバックエンドが15分ごとに各APIへ問い合わせ、配信状況の変化をFirestoreに直接同期して、アプリとウィジェットに反映します。"
        }
      }
    },
    {
      id: 2,
      title: "読READER",
      category: "personal",
      stack: "React Native • Llama 3.2 • llama.rn",
      description: {
        en: "A minimalist application for reading EPUB files and conversing with an on-device AI assistant—completely offline.",
        ja: "EPUBファイルを読みながら、端末上で動くAIアシスタントと会話できるミニマルなアプリです。完全にオフラインで動作します。"
      },
      github: "https://github.com/sandeep-ganesan/YomiREADER",
      apkLink: "https://dl.sandeepganesan.com/yomireader.apk",
      details: {
        features: {
          en: [
            "On-Device RAG for book-specific chatting",
            "Native C++ Engine powered by llama.rn",
            "Vector Caching for optimized local storage",
            "Custom reader core with gesture navigation"
          ],
          ja: [
            "本の内容に基づいて会話できるオンデバイスRAG",
            "llama.rnによるネイティブC++エンジン",
            "ローカルストレージを最適化するベクトルキャッシュ",
            "ジェスチャー操作に対応した独自のリーダー機能"
          ]
        },
        architecture: {
          en: "EPUBs are chunked and embedded via Nomic Embed Text v1.5. User queries trigger cosine similarity search, and Meta Llama 3.2 3B processes segments for a grounded response directly on mobile hardware.",
          ja: "EPUBをチャンクに分割し、Nomic Embed Text v1.5でベクトル化します。ユーザーの質問に対してコサイン類似度検索を行い、Meta Llama 3.2 3Bが該当箇所をもとに、本の内容に基づいた回答をスマートフォン上で直接生成します。"
        }
      }
    },
    {
      id: 3,
      title: "Dynamic VAA Updater",
      category: "lab",
      stack: "Python • BERT • YouTube API",
      description: {
        en: "A team-based machine learning pipeline that dynamically updates Voting Advice Applications (VAAs) by tracking politicians' social media statements.",
        ja: "政治家のSNSでの発言を追跡し、投票支援アプリ（VAA）を動的に更新する、チームで開発した機械学習パイプラインです。"
      },
      details: {
        features: {
          en: [
            "Automated YouTube API data collection & scraping",
            "BERTopic modeling for data noise reduction",
            "Fine-tuned BERT sentiment analysis",
            "Semantic similarity matching for manifesto deviations"
          ],
          ja: [
            "YouTube APIによるデータ収集とスクレイピングの自動化",
            "BERTopicによるトピックモデリングでノイズを削減",
            "ファインチューニングしたBERTによる感情分析",
            "意味的類似度を使った、マニフェストとの違いの検出"
          ]
        },
        architecture: {
          en: "Collects real-time social media data, filtering it via BERTopic. Processed text undergoes sentiment analysis using a BERT model fine-tuned on political manifestos, then uses semantic algorithms to flag orientation shifts for VAA updates.",
          ja: "SNSのデータをリアルタイムで収集し、BERTopicで絞り込みます。処理したテキストは、政党のマニフェストでファインチューニングしたBERTモデルで感情分析を行い、意味的類似度のアルゴリズムで立場の変化を検出してVAAの更新に反映します。"
        }
      }
    },
    {
      id: 4,
      title: "Cozy Portfolio",
      category: "personal",
      stack: "Astro • React • Tailwind • Nanostores",
      description: {
        en: "A highly interactive, custom-built portfolio website, featuring a fully functional window manager and retro aesthetics.",
        ja: "本格的なウィンドウマネージャーとレトロなデザインを備えた、インタラクティブな自作ポートフォリオサイトです。"
      },
      github: "https://github.com/sandeep-ganesan/portfolio",
      details: {
        features: {
          en: [
            "Custom React window manager with draggable bounds clamping",
            "Simplistic design that is easy to navigate and mobile-friendly",
            "Features background music and language options (WIP)",
            "Global state management across UI components using Nanostores"
          ],
          ja: [
            "画面外に出ないようドラッグ範囲を制限した、React製の独自ウィンドウマネージャー",
            "操作しやすく、モバイルにも対応したシンプルなデザイン",
            "BGMと言語切り替え機能（開発中）",
            "NanostoresによるUIコンポーネント間のグローバル状態管理"
          ]
        },
        architecture: {
          en: "Built on an Astro foundation to ship zero-JavaScript static HTML by default. Interactive elements like the draggable windows and dock are injected as React 'Islands', utilizing Nanostores to share global state (like active windows and focus hierarchy) across isolated components.",
          ja: "Astroをベースに、デフォルトではJavaScriptを含まない静的HTMLを配信しています。ドラッグできるウィンドウやドックなどのインタラクティブな要素はReactの「アイランド」として組み込み、Nanostoresを使って、開いているウィンドウやフォーカス順などのグローバル状態を独立したコンポーネント間で共有しています。"
        }
      }
    },
    {
      id: 5,
      title: "gomigomi",
      category: "school",
      stack: "Next.js • PostgreSQL • Prisma",
      description: {
        en: "A gamified, point-based lottery platform for the second-hand goods market that replaces traditional sales with verifiable draws.",
        ja: "中古品の取引を、従来の販売ではなく検証可能な抽選で行う、ゲーム感覚のポイント制抽選プラットフォームです。"
      },
      details: {
        features: {
          en: [
            "Probability Proportional to Size (PPS) Algorithm",
            "Virtual Economy & Entry Boosting",
            "Secure OAuth & Role Management",
            "Automated Draw Resolution"
          ],
          ja: [
            "確率比例抽出（PPS）アルゴリズム",
            "ポイントによる仮想経済と当選確率アップ機能",
            "安全なOAuth認証とロール管理",
            "抽選結果の自動確定"
          ]
        },
        architecture: {
          en: "Built on a Next.js App Router frontend with a PostgreSQL/Prisma backend, utilizing Upstash rate-limiting and distributed cron locking to safely automate lottery finalization and point transfers.",
          ja: "フロントエンドはNext.jsのApp Router、バックエンドはPostgreSQLとPrismaで構築しています。Upstashによるレート制限と分散cronロックを使い、抽選の確定やポイントの移動を安全に自動化しています。"
        }
      }
    }
  ];

  const categoryLabels = {
    school: { en: 'school', ja: '学校' },
    lab: { en: 'lab', ja: '研究室' },
    personal: { en: 'personal', ja: '個人' }
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto md:pr-2 pb-12 pointer-events-auto">
      
      {/* The Main Header */}
      <h2 className="text-3xl font-bold tracking-widest text-[#2c2626] uppercase border-b-4 border-[#8f9ca6] pb-4 sticky top-0 bg-[#f4ece6] z-10 pt-2">
        {lang === 'en' ? 'Projects' : 'プロジェクト'}
      </h2>
      
      {/* The Filter Buttons */}
      <div className="flex flex-wrap gap-3 md:gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'all' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          {lang === 'en' ? 'All' : 'すべて'}
        </button>
        <button
          onClick={() => setFilter('school')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'school' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          {lang === 'en' ? 'School' : '学校'}
        </button>
        <button
          onClick={() => setFilter('lab')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)]
            ${filter === 'lab' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          {lang === 'en' ? 'Lab' : '研究室'}
        </button>
        <button
          onClick={() => setFilter('personal')}
          className={`px-4 py-2 border-4 border-[#5c4f4f] font-bold transition-transform shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] 
            ${filter === 'personal' ? 'bg-[#d97373] text-[#f4ece6] translate-y-1 shadow-none' : 'bg-[#e4dcc6] text-[#5c4f4f] hover:-translate-y-1'}`}
        >
          {lang === 'en' ? 'Personal' : '個人'}
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
                 {categoryLabels[project.category]?.[lang] ?? project.category}
               </span>
             </div>

             {/* Card Body */}
             <div className="p-4 space-y-4 text-[#5c4f4f]">
               <p className="font-bold text-lg leading-snug">
                 {project.description[lang]}
               </p>

               {/* Features List */}
               <div>
                 <h4 className="font-bold text-[#2c2626] border-b-2 border-[#8f9ca6] inline-block mb-2 uppercase text-sm tracking-wider">{lang === 'en' ? 'Key Features' : '主な機能'}</h4>
                 <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                   {project.details.features[lang].map((feature, i) => (
                     <li key={i}>{feature}</li>
                   ))}
                 </ul>
               </div>

               {/* Architecture Blurb */}
               <div className="bg-[#f4ece6] p-3 border-2 border-[#8f9ca6] text-sm">
                 <span className="font-bold text-[#d97373] block mb-1">{lang === 'en' ? 'Architecture Pipeline:' : 'アーキテクチャ：'}</span>
                 {project.details.architecture[lang]}
               </div>

<div className="mt-auto w-full flex gap-4">
  
  {/* GitHub Button */}
  {project.github && (
    <a 
      href={project.github} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-4 border-[#5c4f4f] bg-[#c9d4d9] hover:bg-[#8f9ca6] hover:text-[#f4ece6] transition-all group shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] hover:translate-y-1 hover:shadow-none"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#2c2626] group-hover:text-[#f4ece6] transition-colors">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
      <span className="font-bold uppercase tracking-wider text-[#2c2626] group-hover:text-[#f4ece6] transition-colors text-sm">
        {lang === 'en' ? 'View Source' : 'ソースを見る'}
      </span>
    </a>
  )}

  {/* APK Download Button */}
  {project.apkLink && (
    <a 
      href={project.apkLink} 
      download 
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-4 border-[#5c4f4f] bg-[#c9d4d9] hover:bg-[#8f9ca6] hover:text-[#f4ece6] transition-all group shadow-[4px_4px_0px_0px_rgba(92,79,79,0.3)] hover:translate-y-1 hover:shadow-none"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#2c2626] group-hover:text-[#f4ece6] transition-colors">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
      </svg>
      <span className="font-bold uppercase tracking-wider text-[#2c2626] group-hover:text-[#f4ece6] transition-colors text-sm">
        {lang === 'en' ? 'Download APK' : 'APKをダウンロード'}
      </span>
    </a>
  )}
  
</div>
               
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}

// A dedicated component for the Contact window
function ContactContent() {

  const lang = useStore(currentLang);
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto md:pr-2 pb-12 pointer-events-auto">
      
      {/* The Main Header */}
      <h2 className="text-3xl font-bold tracking-widest text-[#2c2626] uppercase border-b-4 border-[#8f9ca6] pb-4">
        {lang === 'en' ? 'Contact' : '連絡先'}
      </h2>

      <div className="space-y-6 text-[#5c4f4f] text-lg mt-2">
        <p>
          {lang === 'en' 
            ? "The easiest way to reach me is through email, but feel free to connect with me on GitHub or LinkedIn as well! I don't use much of social media so LinkedIn or Email would be preferred." 
            : "連絡はメールが一番簡単です。GitHubやLinkedInでも気軽に連絡してください。SNSはあまり使わないので、メールかLinkedInのほうがありがたいです。"
          }
        </p>
        <p className="font-bold text-[#d97373]">
          {lang === 'en' 
            ? "I am currently looking for internship opportunities and collaborations." 
            : "現在、インターンシップの機会やコラボレーションを探しています。"
          }
        </p>

        {/* The Contact Links */}
        <div className="flex flex-col gap-4 mt-6">
          
          <a href="mailto:hi@sandeepganesan.com" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 border-4 border-[#5c4f4f] bg-[#e4dcc6] hover:bg-[#d97373] hover:text-[#f4ece6] transition-colors group">
            <span className="font-bold uppercase tracking-wider">{lang === 'en' ? 'Email' : 'メール'}</span>
            <span className="text-sm opacity-80 group-hover:opacity-100 md:ml-auto break-all sm:break-normal">hi@sandeepganesan.com</span>
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
            <span className="font-bold uppercase tracking-wider text-[#2c2626] group-hover:text-[#f4ece6]">{lang === 'en' ? 'View Resume' : '履歴書を見る'}</span>
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
