import React from 'react';
import { ImageIcon, Plus, Quote, Info, BarChart } from 'lucide-react';

export const HeaderBlock = ({ content, isDark, isEditing, updateBlock }: any) => (
  <div className="text-center py-8 border-b border-slate-200 mb-8">
    {isEditing ? (
      <div className="space-y-2">
        <input 
          value={content.title} 
          onChange={(e) => updateBlock({ ...content, title: e.target.value })}
          className={`text-3xl font-bold text-center w-full bg-transparent border-b border-blue-200 focus:outline-none pb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
        />
        <input 
          value={content.intro} 
          onChange={(e) => updateBlock({ ...content, intro: e.target.value })}
          className={`text-center w-full bg-transparent border-b border-blue-200 focus:outline-none pb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </div>
    ) : (
      <>
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.title}</h1>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{content.date} · {content.intro}</p>
      </>
    )}
  </div>
);

/**
 * 텍스트에서 HTML 태그를 제거하여 순수 텍스트만 추출합니다.
 * 에디터의 input/textarea에서 사용합니다.
 */
const stripHtml = (html: string) => {
  if (typeof html !== 'string') return html;
  return html.replace(/<[^>]*>?/gm, '');
};

export const ChapterHeaderBlock = ({ content, isDark, isEditing, updateBlock, index }: any) => (
  <div className={`py-16 px-10 my-12 rounded-3xl text-center transition-all ${isDark ? 'bg-indigo-900 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'}`}>
    <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-xs font-black tracking-[0.2em] mb-4 uppercase">
      Chapter 0{index}
    </div>
    {isEditing ? (
      <textarea 
        value={stripHtml(content.title)} 
        onChange={(e) => updateBlock({ ...content, title: e.target.value })}
        className="w-full bg-transparent border-b-2 border-white/30 focus:outline-none text-center font-black text-4xl leading-tight resize-none placeholder:text-white/50"
        placeholder="챕터 제목을 입력하세요"
      />
    ) : (
      <h2 className="font-black text-4xl leading-tight tracking-tighter">
        {stripHtml(content.title)}
      </h2>
    )}
    <div className="w-12 h-1.5 bg-white/40 mx-auto mt-8 rounded-full" />
  </div>
);

export const MainStoryBlock = ({ content, isDark, isEditing, updateBlock }: any) => {
  const renderBody = (text: string) => ({ __html: (text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') });

  return (
    <div className={`rounded-3xl overflow-hidden mb-12 border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
      <div 
        className={`aspect-video flex items-center justify-center mb-4 rounded-lg relative overflow-hidden transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${!content.image_url ? 'border-2 border-dashed border-slate-300' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const imageUrl = e.dataTransfer.getData('text/plain');
          if (imageUrl) updateBlock({ ...content, image_url: imageUrl });
        }}
      >
        {content.image_url ? (
          <img src={content.image_url} className="w-full h-full object-cover" alt="Content" />
        ) : (
          <div className="text-center p-4 text-slate-400">
            <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm font-medium">이미지를 여기에 드래그하세요</p>
            <p className="text-xs mt-1 opacity-70">프롬프트: {content.image_prompt}</p>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="p-6 space-y-4">
          <input 
            value={stripHtml(content.title)} 
            onChange={(e) => updateBlock({ ...content, title: e.target.value })}
            className={`text-xl font-black w-full bg-transparent border-b-2 border-blue-100 focus:border-blue-500 focus:outline-none pb-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}
            placeholder="기사 제목"
          />
          <textarea 
            value={content.body} 
            onChange={(e) => updateBlock({ ...content, body: e.target.value })}
            className={`w-full h-40 bg-slate-50/50 rounded-xl p-4 focus:outline-none leading-relaxed resize-none border-0 ${isDark ? 'text-slate-300 bg-slate-900/50' : 'text-slate-600'}`}
            placeholder="내용을 입력하세요 (**텍스트** 로 볼드 처리 가능)"
          />
        </div>
      ) : (
        <div className="p-8 break-keep">
          <h2 className={`text-2xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{stripHtml(content.title)}</h2>
          <div 
            className={`leading-relaxed mb-6 whitespace-pre-wrap text-left text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            dangerouslySetInnerHTML={renderBody(content.body)}
          />
          {content.link && (
            <a href={content.link} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors">
              {content.link_text || "자세히 보기"}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export const DeepDiveBlock = ({ content, isDark, isEditing, updateBlock, chapterNumber }: any) => {
  const renderBody = (text: string) => ({ __html: (text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') });

  return (
    <div className={`p-10 rounded-3xl mb-12 border-l-8 transition-all ${isDark ? 'bg-slate-800 border-indigo-500' : 'bg-indigo-50/30 border-indigo-400 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em]">
          <span className="px-2 py-1 bg-indigo-600 text-white rounded-md mr-1">Deep Dive</span>
        </div>
        {chapterNumber && <span className="text-[10px] font-black text-indigo-300">SECTION {chapterNumber}</span>}
      </div>
      {isEditing ? (
        <div className="space-y-4 text-left">
          <input 
            value={stripHtml(content.title)} 
            onChange={(e) => updateBlock({ ...content, title: e.target.value })}
            className={`text-xl font-black w-full bg-transparent border-b-2 border-indigo-100 focus:outline-none pb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
            placeholder="심층 분석 제목"
          />
          <textarea 
            value={content.body} 
            onChange={(e) => updateBlock({ ...content, body: e.target.value })}
            className={`w-full h-56 bg-white/50 rounded-xl p-4 focus:outline-none leading-relaxed resize-none border-0 ${isDark ? 'text-slate-300 bg-slate-900/50' : 'text-slate-700'}`}
            placeholder="심층 분석 내용을 입력하세요"
          />
        </div>
      ) : (
        <div className="break-keep">
          <h3 className={`text-2xl font-black mb-5 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{stripHtml(content.title)}</h3>
          <div 
            className={`leading-relaxed whitespace-pre-wrap text-left text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            dangerouslySetInnerHTML={renderBody(content.body)}
          />
        </div>
      )}
    </div>
  );
};

export const ToolSpotlightBlock = ({ content, isDark }: any) => (
  <div className={`flex gap-5 p-6 rounded-2xl mb-8 border-2 transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50 shadow-sm'}`}>
    <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
      <Plus size={28} />
    </div>
    <div className="flex-1 min-w-0 break-keep">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md">Featured Tool</span>
      </div>
      <h3 className={`text-xl font-black mb-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.name}</h3>
      <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{content.description}</p>
      <a href={content.link} className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 group">
        무료로 시작하기 <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </a>
    </div>
  </div>
);

export const StatBoxBlock = ({ content, isDark }: any) => (
  <div className={`p-6 rounded-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
    <div className="flex-1 min-w-0">
      <h4 className={`text-xs md:text-sm font-bold uppercase tracking-wider mb-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{content.label}</h4>
      <p className={`text-sm leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{content.description}</p>
    </div>
    <div className={`font-black text-blue-600 tracking-tighter break-words text-left md:text-right ${
      (content.value || '').length > 12 ? 'text-xl md:text-2xl' : 
      (content.value || '').length > 6 ? 'text-2xl md:text-3xl' : 
      'text-4xl'
    }`}>
      {content.value}
    </div>
  </div>
);

export const BridgeBlock = ({ content, isDark, isEditing, updateBlock }: any) => (
  <div className={`py-10 px-8 text-center border-y-2 border-dashed my-8 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-blue-50 bg-blue-50/20'}`}>
    {isEditing ? (
      <textarea 
        value={content.text} 
        onChange={(e) => updateBlock({ ...content, text: e.target.value })}
        className={`w-full bg-transparent border-b-2 border-blue-400 focus:outline-none text-center font-bold text-lg leading-relaxed resize-none ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
        placeholder="브릿지 문구를 입력하세요..."
      />
    ) : (
      <p className={`font-bold text-lg leading-relaxed tracking-tight ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
        {content.text}
      </p>
    )}
  </div>
);

export const InsightBlock = ({ content, isEditing, updateBlock }: any) => (
  <div className="border-l-4 border-blue-500 pl-6 py-2 mb-8 bg-blue-50 rounded-r-lg">
    <h3 className="font-bold text-blue-800 mb-1">💡 Insight</h3>
    {isEditing ? (
      <textarea 
        value={content.text} 
        onChange={(e) => updateBlock({ ...content, text: e.target.value })}
        className="w-full bg-transparent border-b border-blue-200 focus:outline-none text-blue-900 leading-relaxed resize-none"
      />
    ) : (
      <div 
        className="text-blue-900 italic leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: (content.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
      />
    )}
  </div>
);