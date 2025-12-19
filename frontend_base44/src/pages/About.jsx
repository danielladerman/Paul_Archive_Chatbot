import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, BookOpen, Users, Lightbulb, Camera, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { appendZl } from "@/lib/utils/index.js";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  const [guestName, setGuestName] = useState("");
  const [guestRelationship, setGuestRelationship] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestMemory, setGuestMemory] = useState("");
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);
  const [memoryStatusMessage, setMemoryStatusMessage] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE;
  const apiKey = import.meta.env.VITE_API_KEY;

  async function handleSubmitGuestMemory(event) {
    event.preventDefault();

    if (!guestMemory.trim()) {
      setMemoryStatusMessage("Please share at least a few words about Paul.");
      return;
    }

    if (!apiBaseUrl) {
      setMemoryStatusMessage("The service is not fully configured right now. Please try again later.");
      return;
    }

    setIsSubmittingMemory(true);
    setMemoryStatusMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/guest_memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-KEY": apiKey } : {}),
        },
        body: JSON.stringify({
          name: guestName || null,
          relationship: guestRelationship || null,
          email: guestEmail || null,
          memory: guestMemory,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      setGuestName("");
      setGuestRelationship("");
      setGuestEmail("");
      setGuestMemory("");
      setMemoryStatusMessage("Thank you for sharing. Your memory has been saved for the family and will be used to enrich the chatbot and the memorial.");
    } catch (error) {
      console.error("Failed to submit guest memory:", error);
      setMemoryStatusMessage("Sorry, something went wrong while saving this memory. Please try again later.");
    } finally {
      setIsSubmittingMemory(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12">

        <div className="paul-card rounded-2xl p-6 md:p-8 paul-glow">
          <div className="flex justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d4284c277_Screenshot2025-08-18at121929AM.png"
              alt="Paul Laderman"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover paul-portrait border-4 border-amber-200/50" />

          </div>
          <h1 className="text-3xl md:text-4xl font-light paul-text-gradient mb-4">{appendZl("About Rabbi Paul S. Laderman Z\"L")}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            {appendZl("A remarkable man whose wisdom, experiences, and insights continue to inspire and guide us through the power of preserved memory and conversation.")}
          </p>
        </div>
      </motion.div>

      {/* Overview: what this website is */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="paul-card border-amber-200 paul-glow">
          <CardHeader>
            <CardTitle className="text-2xl paul-text-gradient text-center">
              A Digital Memorial for Rabbi Paul Z&quot;L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-slate-700 mb-4">
              {appendZl("This website is a living, digital memorial built from Paul's writings, letters, talks, and documents so that his wisdom can continue to be discovered in conversation.")}
            </p>
            <p className="text-lg leading-relaxed text-slate-700">
              {appendZl("Below you can learn how the AI scholar works, how to explore topics and people, and how to share your own memories to help keep his story alive.")}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* How to use this website */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-12"
      >
        <Card className="paul-card border-amber-200 paul-glow">
          <CardHeader>
            <CardTitle className="text-2xl paul-text-gradient text-center">
              How to Use This Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-slate-700">
              <li>
                <strong>Chat with the AI scholar:</strong>{" "}
                {appendZl("Go to the Chat tab to ask your own questions about Paul or his world, or click on dynamically suggested questions to get started.")}
              </li>
              <li>
                <strong>Explore topics and events:</strong>{" "}
                {appendZl("Visit the Topics page to browse curated topics and questions you can click to launch a conversation.")}
              </li>
              <li>
                <strong>Look up people and places:</strong>{" "}
                {appendZl("Visit the People Tab and use its search bar, or just click on a family to find names, relationships, and communities from Paul's life.")}
              </li>
              <li>
                <strong>Walk down Rabbi Paul's life timeline:</strong>{" "}
                {appendZl("Visit the Life Timeline Tab and go down Paul's memory lane.")}
              </li>
              <li>
                <strong>Enjoy the Photo Gallery:</strong>{" "}
                {appendZl("Go to the Gallery Tab to see photos of Paul.")}
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Share a Memory Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <Card className="paul-card border-amber-200 paul-glow">
          <CardHeader>
            <CardTitle className="text-2xl paul-text-gradient text-center">
              Share a Memory or Your Connection to Paul Z"L 
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 text-center mb-6">
              If you knew Paul Z'L, we invite you to share a story, reflection, or moment. These notes are kept
              privately for the family and may help enrich this memorial and the chatbot over time. If you don't show up in the People Tab, please share your relation to Paul Z"L.
              <br />
              <br />
              * For attachments please email to <a href="mailto:danielladerman@gmail.com" className="text-slate-700 hover:text-slate-900">danielladerman@gmail.com</a>
            </p>
            <form onSubmit={handleSubmitGuestMemory} className="space-y-4 max-w-xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    className="w-full rounded-md border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Relationship to Paul Z"L (optional)
                  </label>
                  <input
                    type="text"
                    value={guestRelationship}
                    onChange={(event) => setGuestRelationship(event.target.value)}
                    placeholder="e.g., grandson, friend, colleague"
                    className="w-full rounded-md border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (optional, for follow-up)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  className="w-full rounded-md border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your memory, reflection, or connection to Paul Z"L
                </label>
                <textarea
                  value={guestMemory}
                  onChange={(event) => setGuestMemory(event.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/70"
                  required
                />
              </div>

              {memoryStatusMessage && (
                <p className="text-sm text-slate-700 text-center">
                  {memoryStatusMessage}
                </p>
              )}

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmittingMemory}
                  className="inline-flex items-center justify-center rounded-full bg-slate-800 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900 disabled:opacity-60"
                >
                  {isSubmittingMemory ? "Saving..." : "Submit Memory"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Biography Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12">

        <Card className="paul-card border-amber-200 paul-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl paul-text-gradient">
              <BookOpen className="w-7 h-7" />
              His Story
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p className="text-lg leading-relaxed text-slate-700 mb-6">
              {appendZl("Paul Laderman lived a life rich with experience, wisdom, and deep human connection. Through decades of thoughtful writing, correspondence, and documentation, he created a treasure trove of insights that reflect not just his personal journey, but the broader human experience of his generation.")}
            </p>
            <p className="text-lg leading-relaxed text-slate-700 mb-6">
              {appendZl("His writings span personal reflections, professional experiences, family memories, and philosophical observations. Each document in his collection offers a window into his thoughtful approach to life, his relationships with others, and his understanding of the world around him.")}
            </p>
            <p className="text-lg leading-relaxed text-slate-700">
              {appendZl("This digital memorial ensures that Paul Laderman's wisdom remains accessible, allowing future generations to learn from his experiences and insights through the power of conversation and technology.")}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Values Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[
        {
          icon: Heart,
          title: "Family & Relationships",
          description: "Paul understood that the bonds we form with others are the foundation of a meaningful life.",
          color: "text-red-500",
          targetPath: "/Content", // People section
        },
        {
          icon: Lightbulb,
          title: "Lifelong Learning",
          description: "His curiosity about the world never dimmed, always seeking to understand and grow.",
          color: "text-yellow-500",
          targetPath: "/Timeline", // Topics section
        },
        {
          icon: Globe,
          title: "Broader Perspective",
          description: "Paul viewed life through a lens of understanding, empathy, and global consciousness.",
          color: "text-blue-500",
          targetPath: "/Timeline", // Topics section
        },
        {
          icon: Users,
          title: "Community Impact",
          description: "He believed in contributing to his community and making a positive difference.",
          color: "text-green-500",
          targetPath: "/Timeline", // Topics section
        },
        {
          icon: BookOpen,
          title: "Written Legacy",
          description: "Through extensive documentation, he preserved thoughts and experiences for posterity.",
          color: "text-purple-500",
          targetPath: "/Timeline", // Topics section
        },
        {
          icon: Camera,
          title: "Captured Moments",
          description: "Paul understood the importance of preserving memories and documenting life's journey.",
          color: "text-indigo-500",
          targetPath: "/Gallery", // Gallery section
        }].
        map((value, index) =>
        <motion.div
          key={value.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.1 }}>

            <Card
              onClick={() => navigate(value.targetPath)}
              className="paul-card border-amber-200 h-full hover:paul-glow transition-all duration-300 cursor-pointer"
            >
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 ${value.color} bg-opacity-10 rounded-full flex items-center justify-center`}>
                  <value.icon className={`w-6 h-6 ${value.color}`} />
                </div>
                <h3 className="text-lg font-semibold paul-text-gradient mb-3">
                  {value.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {appendZl(value.description)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>


      {/* Project Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}>

        <Card className="paul-card border-amber-200 paul-glow">
          <CardHeader>
            <CardTitle className="text-2xl paul-text-gradient text-center">
              About This Digital Memorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <p className="text-lg leading-relaxed text-slate-700 mb-6">
                {appendZl("This interactive digital memorial was created to preserve and share Paul Laderman's wisdom with family, friends, and future generations. Through advanced AI technology, his documented thoughts, experiences, and insights remain accessible through natural conversation.")}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold paul-text-gradient mb-3">How It Works</h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>AI trained on Paul's extensive writings and documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Natural conversation interface for easy interaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Searchable timeline and document archive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Preserved for future generations</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold paul-text-gradient mb-3">Created With Love</h3>
                <p className="text-slate-700 leading-relaxed mb-4">{appendZl("This memorial was prepared by his grandson Daniel Laderman as a labor of love, ensuring that Paul's remarkable insights and experiences continue to inspire and guide us all.")}

                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm italic text-center">
                    "The best way to honor a life well-lived is to ensure its lessons live on."
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}