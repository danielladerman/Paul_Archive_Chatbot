

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils/index.js";
import { MessageCircle, Image, User, BookOpen, Users, Sparkles } from "lucide-react";
import { appendZl } from "@/lib/utils/index.js";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navigationItems = [
    { name: "About", url: createPageUrl("About"), icon: User },
    { name: "Chat", url: createPageUrl("Chat"), icon: MessageCircle },
    { name: "Family & Friends", url: createPageUrl("Content"), icon: Users },
    { name: "Topics", url: createPageUrl("Timeline"), icon: Sparkles },
    { name: "Life Timeline", url: createPageUrl("LifeTimeline"), icon: BookOpen },
    { name: "Gallery", url: createPageUrl("Gallery"), icon: Image }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-100 pb-20 md:pb-0">
      <style>{`
        :root {
          --paul-navy: #1e3a5f;
          --paul-gold: #d4af37;
          --paul-cream: #faf8f3;
          --paul-sage: #8fbc8f;
          --paul-warm: #2c5282;
        }
        
        .paul-gradient {
          background: linear-gradient(135deg, var(--paul-navy) 0%, var(--paul-warm) 100%);
        }
        
        .paul-text-gradient {
          background: linear-gradient(135deg, var(--paul-navy), var(--paul-gold));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .paul-glow {
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
        }
        
        .paul-card {
          background: rgba(250, 248, 243, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 175, 55, 0.2);
        }
        
        .paul-portrait {
          box-shadow: 0 8px 32px rgba(212, 175, 55, 0.3);
        }
      `}</style>

      {/* Header */}
      <header className="paul-gradient shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="mx-auto my-1 px-2 container md:px-6 md:py-8 relative">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/374dfbfd9_Screenshot2025-08-18at121929AM.png"
                  alt="Paul Laderman"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover paul-portrait border-4 border-white/20" />

                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
            <h1 className="text-3xl md:text-1xl font-light text-white mb-2 tracking-wide">{appendZl("Rabbi Paul S. Laderman Z\"L")}

            </h1>
            <p className="text-2xl md:text-2xl text-white mb-0 -mt-1 tracking-wide font-serif">"Rabbi For Many"</p>
            <p className="text-lg md:text-xl text-amber-100 font-light italic">
              A Legacy Preserved Through Conversation
            </p>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-4"></div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white/70 backdrop-blur-sm border-b border-amber-200/30 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex justify-center space-x-1 py-4">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.name}
                  to={item.url}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                  isActive ?
                  "bg-slate-800 text-white paul-glow" :
                  "text-slate-600 hover:bg-white/50 hover:text-slate-800"}`
                  }>

                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>);

            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-light">In Memory of Paul Laderman Z"L</span>
            </div>
            <p className="text-slate-400 font-light leading-relaxed max-w-2xl mx-auto">{appendZl("This digital memorial preserves the wisdom, experiences, and insights of Paul Laderman Z\"L, making his legacy accessible to family, researchers, and future generations through the power of conversation and technology.")}



            </p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-6"></div>
            <p className="text-sm text-slate-500 mt-4">
              Created with love by family • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-amber-200/50 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={`mobile-${item.name}`}
                to={item.url}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 ${
                isActive ?
                "text-slate-800" :
                "text-slate-500 hover:bg-amber-50"}`
                }>

                <item.icon className="w-5 h-5" />
                <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
                {isActive &&
                <div className="w-8 h-1 bg-slate-800 rounded-full absolute top-0"></div>
                }
              </Link>);

          })}
        </div>
      </nav>
    </div>);

}
