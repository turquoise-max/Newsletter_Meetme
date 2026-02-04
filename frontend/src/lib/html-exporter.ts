interface Block {
  type: string;
  content: any;
}

/**
 * 에디터와 내보내기에서 공통으로 사용할 마크다운 렌더러
 */
export const commonMarkdownRenderer = (text: string) => {
  return (text || '').replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 800; color: inherit;">$1</strong>');
};

export function exportToHtml(blocks: Block[], template: string = 'modern'): string {
  const styles = getStyles(template);
  
  let htmlBody = '';

  blocks.forEach(block => {
    switch (block.type) {
      case 'header':
        htmlBody += `
          <div style="${styles.headerContainer}">
            <h1 style="${styles.headerTitle}">${block.content.title || ''}</h1>
            <p style="${styles.headerIntro}">${block.content.date || ''} · ${block.content.intro || ''}</p>
          </div>
        `;
        break;
      
      case 'main_story':
        htmlBody += `
          <div style="${styles.card}">
            ${block.content.image_url ? `<img src="${block.content.image_url}" alt="${block.content.title}" style="${styles.mainImage}" />` : ''}
            <div style="${styles.cardContent}">
              <h2 style="${styles.cardTitle}">${block.content.title || ''}</h2>
              <div style="${styles.text}">${commonMarkdownRenderer(block.content.body || '').replace(/\n/g, '<br/>')}</div>
              ${block.content.link ? `
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${block.content.link}" style="${styles.button}">${block.content.link_text || '자세히 보기'}</a>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        break;

      case 'quick_hits':
        const itemsHtml = (block.content.items || []).map((item: any) => `
          <li style="margin-bottom: 10px;">
            <a href="${item.link}" style="${styles.link}">${item.text}</a>
          </li>
        `).join('');
        
        htmlBody += `
          <div style="${styles.section}">
            <h3 style="${styles.sectionTitle}">${block.content.title || 'Quick Hits'}</h3>
            <ul style="${styles.list}">
              ${itemsHtml}
            </ul>
          </div>
        `;
        break;

      case 'image':
        if (block.content.image_url) {
          htmlBody += `
            <div style="${styles.imageContainer}">
              <img src="${block.content.image_url}" alt="${block.content.caption || ''}" style="${styles.image}" />
              ${block.content.caption ? `<p style="${styles.caption}">${block.content.caption}</p>` : ''}
            </div>
          `;
        }
        break;

      case 'text':
        htmlBody += `
          <div style="${styles.textSection}">
            <div style="${styles.text}">${(block.content.text || '').replace(/\n/g, '<br/>')}</div>
          </div>
        `;
        break;
        
      case 'button':
        htmlBody += `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${block.content.link}" style="${styles.button}">${block.content.text || 'Click here'}</a>
          </div>
        `;
        break;

      case 'divider':
        htmlBody += `<hr style="${styles.divider}" />`;
        break;

      case 'bridge':
        htmlBody += `
          <div style="${styles.bridgeContainer}">
            <p style="${styles.bridgeText}">${block.content.text || ''}</p>
          </div>
        `;
        break;

      case 'chapter_header':
        htmlBody += `
          <div style="${styles.chapterContainer}">
            <div style="${styles.chapterBadge}">Chapter</div>
            <h2 style="${styles.chapterTitle}">${block.content.title || ''}</h2>
            <div style="${styles.chapterLine}"></div>
          </div>
        `;
        break;

      case 'deep_dive':
        htmlBody += `
          <div style="${styles.deepDiveContainer}">
            <div style="margin-bottom: 20px;">
              <span style="background-color: #4f46e5; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 8px;">DEEP DIVE</span>
            </div>
            <h3 style="${styles.deepDiveTitle}">${block.content.title || ''}</h3>
            <div style="${styles.text}">${commonMarkdownRenderer(block.content.body || '').replace(/\n/g, '<br/>')}</div>
          </div>
        `;
        break;

      case 'tool_spotlight':
        htmlBody += `
          <div style="${styles.toolContainer}">
            <div style="${styles.toolLabel}">TOOL SPOTLIGHT</div>
            <h3 style="${styles.toolName}">${block.content.name || ''}</h3>
            <p style="${styles.text}">${block.content.description || ''}</p>
            ${block.content.link ? `
              <a href="${block.content.link}" style="${styles.link}">도구 확인하기 →</a>
            ` : ''}
          </div>
        `;
        break;

      case 'quote':
        htmlBody += `
          <blockquote style="${styles.quoteContainer}">
            <p style="${styles.quoteText}">"${block.content.text || ''}"</p>
            <cite style="${styles.quoteAuthor}">— ${block.content.author || ''}</cite>
          </blockquote>
        `;
        break;

      case 'stat_box':
        htmlBody += `
          <div style="${styles.statContainer}">
            <div style="${styles.statValue}">${block.content.value || ''}</div>
            <div style="${styles.statLabel}">${block.content.label || ''}</div>
            <div style="${styles.statDesc}">${block.content.description || ''}</div>
          </div>
        `;
        break;

      case 'insight':
        htmlBody += `
          <div style="${styles.insightContainer}">
            <div style="font-weight: bold; margin-bottom: 5px; color: ${styles.colors.primary};">💡 에디터의 인사이트</div>
            <div style="${styles.text}">${commonMarkdownRenderer(block.content.text || '').replace(/\n/g, '<br/>')}</div>
          </div>
        `;
        break;

      default:
        break;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter</title>
    </head>
    <body style="${styles.body}">
      <div style="${styles.container}">
        ${htmlBody}
        <div style="${styles.footer}">
          <p>© ${new Date().getFullYear()} MUST AXS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getStyles(template: string) {
  const isDark = template === 'dark';
  const isClassic = template === 'classic';
  
  const colors = {
    bg: isDark ? '#0f172a' : (isClassic ? '#fdfbf7' : '#f8fafc'),
    containerBg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#cbd5e1' : '#334155',
    heading: isDark ? '#f8fafc' : '#1e293b',
    primary: '#3b82f6',
    border: isDark ? '#334155' : '#e2e8f0',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const fonts = {
    body: isClassic ? 'Georgia, serif' : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    heading: isClassic ? 'Georgia, serif' : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  return {
    colors,
    body: `margin: 0; padding: 0; background-color: ${colors.bg}; font-family: ${fonts.body}; line-height: 1.6; color: ${colors.text};`,
    container: `max-width: 600px; margin: 0 auto; background-color: ${colors.containerBg}; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); word-break: keep-all; overflow-wrap: break-word;`,
    
    headerContainer: `text-align: center; padding: 80px 40px 60px; border-bottom: 1px solid ${colors.border}; margin-bottom: 0;`,
    headerTitle: `margin: 0 0 15px; font-size: 32px; font-weight: 900; color: ${colors.heading}; font-family: ${fonts.heading}; letter-spacing: -0.04em;`,
    headerIntro: `margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: #64748b;`,
    
    card: `margin: 40px; border: 1px solid ${colors.border}; border-radius: 24px; overflow: hidden; background-color: ${colors.containerBg}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`,
    mainImage: `width: 100%; height: auto; display: block; object-fit: cover;`,
    cardContent: `padding: 32px;`,
    cardTitle: `margin: 0 0 15px; font-size: 24px; font-weight: 900; color: ${colors.heading}; font-family: ${fonts.heading}; line-height: 1.2; letter-spacing: -0.02em;`,
    
    section: `margin-bottom: 30px; padding: 24px; background-color: ${isDark ? '#334155' : '#f8fafc'}; border: 1px solid ${colors.border}; border-radius: 12px;`,
    sectionTitle: `margin: 0 0 20px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${colors.primary};`,
    list: `margin: 0; padding: 0; list-style: none;`,
    
    textSection: `margin-bottom: 20px;`,
    text: `font-size: 15px; margin-bottom: 15px; line-height: 1.7; letter-spacing: -0.01em; word-break: keep-all;`,
    
    link: `color: ${colors.primary}; text-decoration: underline; font-weight: 600;`,
    
    button: `display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;`,
    
    imageContainer: `margin-bottom: 20px; text-align: center;`,
    image: `max-width: 100%; height: auto; border-radius: 4px;`,
    caption: `margin: 5px 0 0; font-size: 12px; color: #94a3b8;`,
    
    deepDiveContainer: `margin: 40px; padding: 40px; border-left: 8px solid ${isDark ? '#6366f1' : '#4f46e5'}; background-color: ${isDark ? '#1e293b' : '#f5f7ff'}; border-radius: 24px;`,
    deepDiveTitle: `margin: 0 0 20px; font-size: 22px; font-weight: 900; color: ${colors.heading}; font-family: ${fonts.heading}; letter-spacing: -0.02em;`,
    
    toolContainer: `margin: 40px; padding: 32px; border: 2px solid ${isDark ? '#334155' : '#eef2ff'}; border-radius: 24px; background-color: ${isDark ? '#0f172a' : '#ffffff'}; text-align: left; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);`,
    toolLabel: `display: inline-block; font-size: 10px; font-weight: 900; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; background-color: ${isDark ? '#1e293b' : '#eff6ff'}; padding: 4px 8px; border-radius: 6px;`,
    toolName: `margin: 0 0 12px; font-size: 20px; font-weight: 900; color: ${colors.heading};`,
    
    quoteContainer: `margin: 30px 0; padding: 20px 40px; border-top: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border}; text-align: center;`,
    quoteText: `margin: 0 0 10px; font-size: 18px; font-style: italic; color: ${colors.heading};`,
    quoteAuthor: `font-size: 14px; color: #64748b;`,
    
    statContainer: `margin-bottom: 30px; padding: 32px 24px; text-align: center; background-color: ${isDark ? '#3b82f6' : '#eff6ff'}; border: 1px solid ${isDark ? '#2563eb' : '#dbeafe'}; border-radius: 16px;`,
    statValue: `font-size: 48px; font-weight: 800; color: ${isDark ? '#ffffff' : '#2563eb'}; margin-bottom: 8px; line-height: 1;`,
    statLabel: `font-size: 16px; font-weight: 700; color: ${isDark ? '#bfdbfe' : '#1e40af'}; text-transform: uppercase; letter-spacing: 0.05em;`,
    statDesc: `font-size: 13px; color: ${isDark ? '#93c5fd' : '#64748b'}; margin-top: 12px; line-height: 1.5;`,
    
    insightContainer: `margin-bottom: 30px; padding: 20px; background-color: ${isDark ? '#334155' : '#eff6ff'}; border-radius: 8px; border: 1px solid ${isDark ? '#475569' : '#dbeafe'};`,
    
    divider: `border: 0; border-top: 1px solid ${colors.border}; margin: 30px 0;`,

    bridgeContainer: `margin: 30px 0; text-align: center; padding: 30px 40px; border-top: 2px dashed ${isDark ? '#334155' : '#e2e8f0'}; border-bottom: 2px dashed ${isDark ? '#334155' : '#e2e8f0'}; background-color: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(239, 246, 255, 0.2)'};`,
    bridgeText: `margin: 0; font-size: 17px; font-weight: 700; color: ${isDark ? '#93c5fd' : '#1d4ed8'}; line-height: 1.6; letter-spacing: -0.02em;`,
    
    chapterContainer: `margin: 0; padding: 80px 40px; background-color: ${isDark ? '#312e81' : '#4f46e5'}; border-radius: 0; text-align: center; color: #ffffff;`,
    chapterBadge: `display: inline-block; padding: 6px 16px; background-color: rgba(255,255,255,0.2); border-radius: 100px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; margin-bottom: 24px;`,
    chapterTitle: `margin: 0; font-size: 42px; font-black: 900; line-height: 1.1; letter-spacing: -0.05em;`,
    chapterLine: `width: 60px; height: 6px; background-color: rgba(255,255,255,0.3); margin: 40px auto 0; border-radius: 3px;`,

    footer: `text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid ${colors.border}; padding-top: 20px;`,
  };
}
