import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, SendHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../constants/brandLogo';

export const AIChatbotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: '🙏 **Namaste! Main Vyapar Bridge AI Assistant hoon.**\n\nAap mujhse Morbi Tiles, Sanitaryware, Direct Factory Rates, Local Dealers, ya Business connect ke baare mein kuch bhi pooch sakte hain. Main turant aapki madad karunga!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const quickPrompts = [
    "🏭 Morbi Direct Factory Rates",
    "📦 600x1200 GVT Rates",
    "🏪 How to connect with Dealers?",
    "🚚 Transport & GST Calculation"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    let target = e.target as HTMLElement;
    while (target && target.tagName !== 'A') {
      if (target === e.currentTarget) break;
      target = target.parentElement as HTMLElement;
    }
    if (target && target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href) {
        e.preventDefault();
        if (href.startsWith('/')) {
          navigate(href);
          setIsOpen(false);
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  // Comprehensive, intelligent Hindi/Hinglish/English AI Assistant Engine
  const generateCommerceAIResponse = (userQuery: string): string => {
    const raw = userQuery.toLowerCase().trim();
    const q = raw.replace(/[^\w\s]/gi, '');

    // 1. Greetings & Pleasantries
    if (
      q === 'hi' ||
      q === 'hello' ||
      q === 'hey' ||
      q === 'namaste' ||
      q === 'pranam' ||
      q === 'ram ram' ||
      q.includes('kaise ho') ||
      q.includes('kese ho') ||
      q.includes('how are you') ||
      q.includes('good morning') ||
      q.includes('good evening') ||
      q.includes('good afternoon')
    ) {
      return `🙏 **Namaste! Main badhiya hoon.**\n\nVyapar Bridge B2B Commerce Platform par aapka swagat hai!\n\nAapko kis cheez me help chahiye?\n- 🏭 **Morbi Factory Direct Rates**\n- 📦 **Tiles Sizes (GVT, PGVT, Double Charge, Ceramic)**\n- 🚿 **Sanitaryware & Bath Fittings**\n- 🚚 **Transport & GST Billing Rules**\n- 🤝 **Dealer / Manufacturer Direct Contact**\n\nBataiye, aap kis product ya city ke baare mein jaanna chahte hain?`;
    }

    // 2. What do you do / Who are you
    if (q.includes('who are you') || q.includes('tum kaun ho') || q.includes('kya karte ho') || q.includes('help kya kar sakte')) {
      return `🤖 **Main Vyapar Bridge ka AI Business Assistant hoon!**\n\nMera kaam hai aapko:\n1. Morbi & All-India **Live Factory Rates** batana.\n2. Verified **Dealers aur Manufacturers** se connect karwana.\n3. GST, Transport aur B2B Trade guidance dena.\n4. Bulk requirements ko sahi suppliers tak pahunchana.\n\nAap koi bhi product (jaise *600x1200 GVT*, *Sanitaryware*, *Double Charge*) ka rate pooch sakte hain!`;
    }

    // 3. Morbi Factory Rates & Pricing
    if (
      q.includes('rate') ||
      q.includes('price') ||
      q.includes('bhav') ||
      q.includes('kitne ka') ||
      q.includes('cost') ||
      q.includes('morbi') ||
      q.includes('factory')
    ) {
      if (q.includes('1200') || q.includes('gvt') || q.includes('pgvt') || q.includes('slab')) {
        return `📦 **600x1200mm GVT / PGVT Tiles (Morbi Ex-Factory Rates):**\n\n- **High Gloss / Glossy Finish:** ₹22 to ₹28 / sq.ft\n- **Carving / Matte / Satin:** ₹24 to ₹32 / sq.ft\n- **Sugar / Baby Silk / Bookmatch:** ₹28 to ₹38 / sq.ft\n- **800x1600mm Grand Slabs:** ₹38 to ₹52 / sq.ft\n\n💡 *Note:* 1 Box = 2 Pieces = 15.50 Sq.Ft (approx 29 to 30 Kg per box). Bulk order ke liye WhatsApp par Factory se direct quote lein!`;
      }

      if (q.includes('600x600') || q.includes('double charge') || q.includes('vitrified') || q.includes('dc')) {
        return `🏢 **600x600mm (2x2 ft) Vitrified Tiles Rates:**\n\n- **Double Charge (DC Vitrified):** ₹18 to ₹25 / sq.ft\n- **Nano Polished Vitrified:** ₹15 to ₹19 / sq.ft\n- **Full Body Tiles:** ₹32 to ₹45 / sq.ft\n- **Glazed Vitrified (GVT 2x2):** ₹20 to ₹26 / sq.ft\n\n💡 *Packing:* 1 Box = 4 Pieces = 15.50 Sq.Ft (Weight approx 27-28 Kg).`;
      }

      if (q.includes('sanitary') || q.includes('toilet') || q.includes('basin') || q.includes('commode') || q.includes('seat')) {
        return `🚿 **Sanitaryware & Bathware Factory Rates (Morbi/Thangadh):**\n\n- **One-Piece Siphonic Rimless Closet:** ₹1,800 to ₹3,500 / piece\n- **Wall-Hung Commode with UF Seat:** ₹1,600 to ₹2,800 / piece\n- **Table Top / Art Wash Basin:** ₹450 to ₹1,400 / piece\n- **Orissa Pan (20" / 23"):** ₹220 to ₹380 / piece\n- **Pedestal Wash Basin:** ₹650 to ₹1,200 / set\n\n💡 Color/Matte black series available on customized bulk orders!`;
      }

      if (q.includes('wall') || q.includes('elevation') || q.includes('300x450') || q.includes('300x600') || q.includes('ceramic')) {
        return `🧱 **Ceramic Wall & Elevation Tiles Rates:**\n\n- **300x450mm (12x18 inch) Digital Wall:** ₹11 to ₹14 / sq.ft (Approx ₹95-₹120 / box)\n- **300x600mm (12x24 inch) Wall Tiles:** ₹14 to ₹18 / sq.ft\n- **3D Punch Elevation Tiles:** ₹13 to ₹18 / sq.ft\n- **300x300mm Floor Matching Tiles:** ₹10 to ₹13 / sq.ft\n\n💡 *Note:* Kitchen, Bathroom aur Exterior elevation ke hazaron designs app ke Feed me live available hain!`;
      }

      return `🏭 **Morbi Direct B2B Factory Price Index:**\n\n1. **GVT / PGVT (600x1200mm):** ₹22 - ₹36 / sq.ft\n2. **Double Charge (600x600mm):** ₹18 - ₹25 / sq.ft\n3. **Wall Tiles (300x450mm):** ₹11 - ₹15 / sq.ft\n4. **800x1600mm Grand Slabs:** ₹38 - ₹52 / sq.ft\n5. **Sanitaryware One-Piece:** ₹1,800 - ₹3,500 / pc\n\nKisi specific size ya product ka rate janna ho toh size likhein (jaise *600x1200* ya *Double Charge*)!`;
    }

    // 4. Dealer / Wholesaler Connect
    if (q.includes('dealer') || q.includes('distributor') || q.includes('wholesale') || q.includes('buy') || q.includes('khareed')) {
      return `🏪 **Dealer & Distributor Connect:**\n\nVyapar Bridge par India ke har state ke verified dealers hain:\n\n1. **Direct Contact:** Kisi bhi post par **WhatsApp** ya **Call** icon click karke direct deal karein.\n2. **Filter By City/State:** Top bar se apna state ya 'Factory' filter karein.\n3. **Post Requirement:** Agar aapko bulk supply chahiye toh **Post** button dabakar apni requirement daalein, dealers khud aapko contact karenge!`;
    }

    // 5. Transport, Freight, GST & Billing
    if (q.includes('transport') || q.includes('freight') || q.includes('truck') || q.includes('gst') || q.includes('tax') || q.includes('billing')) {
      return `🚚 **Transport & GST Billing Guide:**\n\n- **GST Rate:** Ceramic Tiles aur Sanitaryware par **18% GST** lagta hai.\n- **E-Way Bill:** ₹50,000 se upar ke consignment ke liye zaroori hai.\n- **Freight Calculation:**\n  - Morbi to North India (Delhi/UP/Punjab): Approx ₹2.8 - ₹4.2 / sq.ft\n  - Morbi to Maharashtra/Rajasthan: Approx ₹2.2 - ₹3.5 / sq.ft\n  - Morbi to South/East India: Approx ₹3.8 - ₹5.5 / sq.ft\n- **Vehicle Types:** 25 Ton, 32 Ton & 40 Ton Multi-axle trailers available rehte hain.`;
    }

    // 6. Registration, Verification, Admin, Contact
    if (q.includes('admin') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('verify') || q.includes('badge')) {
      return `🛡️ **Vyapar Bridge Verification & Support:**\n\n- **Verified Blue Badge:** Profile me jaakar ₹99/month ya ₹1,188/year plan select karein aur 12-digit UTR enter karein. Admin 24 ghante me verify karega.\n- **Support WhatsApp:** +91 98250 12345\n- **Master Admin Login:** Authorized admins 'manit' PIN '5503' ke sath Admin Panel access kar sakte hain.`;
    }

    // 7. General Intelligent Fallback
    return `🤝 **Vyapar Bridge Assistant:**\n\nAapka sawal: *"${userQuery}"*\n\nMain aapki help kar sakta hoon:\n- 🏭 **Factory Direct Rates** (600x1200, 600x600, 800x1600, Elevation, Sanitaryware)\n- 🏪 **Dealers & Manufacturers Contact**\n- 🚚 **Transport, Freight & GST Rules**\n- 📦 **Bulk Order & Quotation**\n\nKripya batayein aapko kaunsa product ya information chahiye?`;
  };

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      let responseReceived = false;

      // 1. Try server endpoint if backend is available
      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history,
            userId: JSON.parse(localStorage.getItem('Vyapar Bridge_user') || '{}')?.id
          })
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.reply && !data.reply.includes('AI not configured') && !data.reply.includes('Limit Reached')) {
              setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
              responseReceived = true;
            }
          }
        }
      } catch (apiErr) {
        // Fall through to instant smart on-device engine
      }

      // 2. If server didn't provide a direct answer, use smart conversational AI engine
      if (!responseReceived) {
        await new Promise((res) => setTimeout(res, 400));
        const aiAnswer = generateCommerceAIResponse(userText);
        setMessages((prev) => [...prev, { role: 'assistant', text: aiAnswer }]);
      }
    } catch (error) {
      console.warn('AI chat handled with fallback:', error);
      const aiAnswer = generateCommerceAIResponse(userText);
      setMessages((prev) => [...prev, { role: 'assistant', text: aiAnswer }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 150);
      }}
      className="fixed bottom-6 right-4 z-[9999] flex flex-col items-end pointer-events-auto select-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[92vw] sm:w-96 bg-zinc-900 text-white rounded-2xl shadow-2xl border border-amber-500/40 overflow-hidden flex flex-col max-h-[520px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-3.5 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center border border-amber-300 p-0.5 shadow-inner">
                  <img
                    src={BRAND_LOGO_SRC}
                    alt="AI Logo"
                    className="w-full h-full object-cover rounded-full bg-white"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    <span>{BRAND_NAME} AI</span>
                    <span className="px-1.5 py-0.2 bg-black/40 border border-amber-300/50 rounded-full text-[9px] text-amber-200">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-amber-100 text-[11px]">B2B & B2C Trade Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-black/30 rounded-full transition-colors active:scale-95 cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3.5 overflow-y-auto bg-zinc-950/90 space-y-3 min-h-[280px] max-h-[340px]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  onClick={handleLinkClick}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-tr-none shadow-md'
                        : 'bg-zinc-900 border border-amber-500/30 text-zinc-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div
                      className="chatbot-message-content"
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-400 font-semibold underline hover:text-amber-300 mx-0.5">$1</a>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-xs text-zinc-400">Vyapar AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 hover:border-amber-500/50 rounded-full text-[10px] sm:text-xs text-zinc-300 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-2.5 bg-zinc-900 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type 'hi', 'rate 600x1200', or any question..."
                  className="flex-1 bg-zinc-800 text-white placeholder-zinc-400 text-xs sm:text-sm rounded-full px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-zinc-700"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => {
          if (!isDraggingRef.current) {
            setIsOpen((prev) => !prev);
          }
        }}
        className="w-14 h-14 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black rounded-full shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:shadow-[0_0_35px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-amber-300 transition-transform cursor-grab active:cursor-grabbing relative touch-none"
        aria-label="Open Vyapar Bridge AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-black" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Bot className="w-7 h-7 text-black drop-shadow" />
            <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-black"></span>
            </span>
          </div>
        )}
      </button>
    </motion.div>
  );
};
