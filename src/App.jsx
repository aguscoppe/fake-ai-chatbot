import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronRight, Copy, Feather, Lightbulb, LockKeyhole, MessageCircle, PanelLeft, Search, Sparkles, Square, SquarePen, Trash2, X } from 'lucide-react';
import { getNextResponse, getVisibleText } from './responses.js';

const storageKey = 'echo-conversations-v1';
const suggestions = [
  { icon: Lightbulb, title: 'Make something', label: 'Give an idea a little spark', prompt: 'Help me brainstorm a creative side project.', color: 'amber' },
  { icon: Feather, title: 'Find the words', label: 'Turn a thought into a story', prompt: 'Help me find the words for something I want to write.', color: 'blue' },
  { icon: MessageCircle, title: 'Think it through', label: 'See a different perspective', prompt: "I'd like a fresh perspective on an idea.", color: 'rose' },
  { icon: Sparkles, title: 'Surprise me', label: 'Follow your curiosity', prompt: 'Give me an unexpected idea to think about today.', color: 'green' },
];

function readConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(chat => typeof chat.id === 'string' && typeof chat.title === 'string' && Number.isInteger(chat.replyIndex) && Array.isArray(chat.messages) && chat.messages.every(message => typeof message.id === 'string' && typeof message.content === 'string' && ['user', 'assistant'].includes(message.role)));
  } catch {
    return [];
  }
}

function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied && !failed) return;
    const timer = setTimeout(() => { setCopied(false); setFailed(false); }, 1800);
    return () => clearTimeout(timer);
  }, [copied, failed]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  }

  return <span className="copy-action"><IconButton label={copied ? 'Copied' : 'Copy response'} onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}</IconButton>{failed && <span role="status">Could not copy</span>}</span>;
}

export default function App() {
  const [chats, setChats] = useState(readConversations);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState(null);
  const [visibleText, setVisibleText] = useState('');
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const followRef = useRef(true);
  const generationLock = useRef(false);
  const activeChat = chats.find(chat => chat.id === activeId);
  const messages = activeChat?.messages ?? [];
  const isEmpty = messages.length === 0;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(chats));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [chats]);

  useEffect(() => {
    if (!generation) return;
    let frame;
    const startedAt = performance.now() + 320;
    function tick(now) {
      const next = getVisibleText(generation.text, now - startedAt);
      setVisibleText(next);
      if (next === generation.text) {
        setChats(previous => previous.map(chat => chat.id === generation.chatId ? { ...chat, messages: chat.messages.map(message => message.id === generation.messageId ? { ...message, content: next } : message) } : chat));
        setGeneration(null);
        generationLock.current = false;
      } else {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [generation]);

  useEffect(() => {
    if (followRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleText, messages.length, activeId]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }, [draft]);

  useEffect(() => {
    if (!sidebarOpen || window.innerWidth > 760) return;
    function dismiss(event) {
      if (event.key === 'Escape') setSidebarOpen(false);
    }
    window.addEventListener('keydown', dismiss);
    const main = document.querySelector('.main');
    main.inert = true;
    document.querySelector('.sidebar .icon-button')?.focus();
    return () => { window.removeEventListener('keydown', dismiss); main.inert = false; };
  }, [sidebarOpen]);

  function stopGeneration() {
    if (!generation) return;
    setChats(previous => previous.map(chat => chat.id === generation.chatId ? { ...chat, messages: chat.messages.map(message => message.id === generation.messageId ? { ...message, content: visibleText, stopped: true } : message) } : chat));
    setGeneration(null);
    generationLock.current = false;
  }

  function openChat(id) {
    stopGeneration();
    setActiveId(id);
    setDraft('');
    setVisibleText('');
    followRef.current = true;
    setAwayFromBottom(false);
    if (window.innerWidth <= 760) setSidebarOpen(false);
    inputRef.current?.focus();
  }

  function deleteChat(id) {
    if (activeId === id) openChat(null);
    setChats(previous => previous.filter(chat => chat.id !== id));
  }

  function sendMessage(value = draft) {
    const content = value.trim();
    if (!content || generationLock.current) return;
    generationLock.current = true;
    const chatId = activeChat?.id ?? crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const nextMessages = [
      { id: crypto.randomUUID(), role: 'user', content },
      { id: messageId, role: 'assistant', content: '' },
    ];
    const replyIndex = activeChat?.replyIndex ?? 0;
    setChats(previous => activeChat
      ? previous.map(chat => chat.id === chatId ? { ...chat, replyIndex: replyIndex + 1, messages: [...chat.messages, ...nextMessages] } : chat)
      : [{ id: chatId, title: content.slice(0, 70), replyIndex: 1, messages: nextMessages }, ...previous]);
    setActiveId(chatId);
    setDraft('');
    setVisibleText('');
    followRef.current = true;
    setAwayFromBottom(false);
    setGeneration({ chatId, messageId, text: getNextResponse(replyIndex) });
    inputRef.current?.focus();
  }

  function scrollToBottom() {
    followRef.current = true;
    setAwayFromBottom(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
      <aside className="sidebar" aria-label="Chat history" inert={!sidebarOpen}>
        <div className="sidebar-heading">
          <a href="/" className="brand" onClick={event => { event.preventDefault(); openChat(null); }}><img src="/echo.svg" alt="" />echo<span className="brand-dot">.</span></a>
          <IconButton label="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeft size={19} /></IconButton>
        </div>
        <button className="new-chat" onClick={() => openChat(null)}><SquarePen size={18} /><span>New chat</span><span className="new-chat-plus">+</span></button>
        <button className={`search-button ${searchOpen ? 'selected' : ''}`} onClick={() => { setSearchOpen(!searchOpen); setQuery(''); }}><Search size={18} />Search conversations</button>
        {searchOpen && <div className="search-field"><input autoFocus aria-label="Search conversations" placeholder="Search chats..." value={query} onChange={event => setQuery(event.target.value)} /><IconButton label="Clear search" onClick={() => { setQuery(''); setSearchOpen(false); }}><X size={15} /></IconButton></div>}
        <div className="history-heading">Your conversations<span>{chats.length > 0 ? chats.length : ''}</span></div>
        <nav className="history" aria-label="Conversations">
          {chats.length === 0 ? <div className="history-empty"><MessageCircle size={22} strokeWidth={1.4} /><p>A little space for your thoughts.</p><span>Your conversations live here.</span></div> : chats.filter(chat => chat.title.toLowerCase().includes(query.toLowerCase())).map(chat => <div className={`history-item ${chat.id === activeId ? 'active' : ''}`} key={chat.id}><button className="chat-link" onClick={() => openChat(chat.id)} title={chat.title}><MessageCircle size={15} /><span>{chat.title}</span></button><IconButton className="delete-chat" label={`Delete conversation: ${chat.title}`} onClick={() => deleteChat(chat.id)}><Trash2 size={14} /></IconButton></div>)}
          {chats.length > 0 && !chats.some(chat => chat.title.toLowerCase().includes(query.toLowerCase())) && <p className="no-results">No conversations found.</p>}
        </nav>
        <div className="sidebar-bottom"><div className="workspace-avatar">Y</div><div><strong>Your workspace</strong><span>Personal account</span></div><span className="online-dot" title="Available locally" /></div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="topbar-left">{!sidebarOpen && <IconButton label="Open sidebar" onClick={() => setSidebarOpen(true)}><PanelLeft size={20} /></IconButton>}<span className="model-name">Echo</span><span className="model-label">CHAT</span></div><div className="topbar-right"><span className="privacy-label"><LockKeyhole size={13} />Just for you</span><IconButton label="Start new chat" onClick={() => openChat(null)}><SquarePen size={19} /></IconButton></div></header>

        <div className={`conversation-scroll ${isEmpty ? 'empty' : ''}`} ref={scrollRef} onScroll={event => { const element = event.currentTarget; const away = element.scrollHeight - element.scrollTop - element.clientHeight > 90; followRef.current = !away; setAwayFromBottom(away); }}>
          {isEmpty ? <section className="welcome"><div className="welcome-mark"><img src="/echo.svg" alt="Echo" /></div><p className="welcome-eyebrow">A little space for big ideas</p><h1>Where should we start?</h1><div className="suggestions">{suggestions.map(({ icon: Icon, title, label, prompt, color }) => <button className="suggestion" key={title} onClick={() => sendMessage(prompt)}><span className={`suggestion-icon ${color}`}><Icon size={21} strokeWidth={1.6} /></span><span className="suggestion-title">{title}</span><span className="suggestion-label">{label}</span><ArrowRight className="suggestion-arrow" size={15} /></button>)}</div><div className="welcome-note"><span />A fresh conversation. Endless possibilities.</div></section> : <div className="messages">{messages.map(message => {
            const isTyping = generation?.messageId === message.id;
            const content = isTyping ? visibleText : message.content;
            return <article className={`message ${message.role}`} key={message.id} aria-label={message.role === 'user' ? 'You' : 'Echo'}>{message.role === 'assistant' && <img className="assistant-avatar" src="/echo.svg" alt="" />}<div className="message-body">{message.role === 'assistant' && <div className="message-author">Echo</div>}<div className="message-text">{content}{isTyping && <span className={content ? 'typing-cursor' : 'thinking-dot'} aria-label="Typing" />}</div>{message.stopped && <span className="stopped-label">Response stopped</span>}{message.role === 'assistant' && !isTyping && content && <CopyButton text={content} />}</div></article>;
          })}<span className="sr-only" role="status">{generation ? 'Echo is typing' : 'Ready'}</span></div>}
        </div>

        <div className="composer-area">{awayFromBottom && <IconButton className="scroll-bottom" label="Scroll to latest message" onClick={scrollToBottom}><ArrowDown size={18} /></IconButton>}<form className={`composer ${generation ? 'generating' : ''}`} onSubmit={event => { event.preventDefault(); sendMessage(); }}><textarea ref={inputRef} rows={1} aria-label="Message Echo" placeholder="Message Echo..." value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage(); } }} /><div className="composer-bottom"><span className="composer-model"><img src="/echo.svg" alt="" />Echo<span className="composer-model-dot" /></span>{generation ? <IconButton className="send-button stop-button" label="Stop response" onClick={stopGeneration}><Square size={14} fill="currentColor" /></IconButton> : <button className="send-button" type="submit" aria-label="Send message" title="Send message" disabled={!draft.trim()}><ArrowUp size={20} strokeWidth={2} /></button>}</div></form><p className="disclaimer">{storageError ? 'Browser storage is unavailable. Chats will not be saved.' : <>A little imagination, a little conversation.<span className="disclaimer-divider">·</span>Powered by a script, not AI.</>}</p></div>
      </main>
    </div>
  );
}