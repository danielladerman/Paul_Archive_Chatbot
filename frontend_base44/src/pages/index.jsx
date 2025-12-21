import Layout from "./Layout.jsx";

import Chat from "./Chat";

import Timeline from "./Timeline";
import LifeTimeline from "./LifeTimeline";

import About from "./About";

import Gallery from "./Gallery";

import ContentPage from "./Content"; // Import the new Content page

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const PAGES = {
    About: About,
    Chat: Chat,
    Timeline: Timeline,
    LifeTimeline: LifeTimeline,
    Gallery: Gallery,
};

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    // Send pageview to Vercel Analytics on every route change
    useEffect(() => {
        try {
            if (window.va) {
                window.va('pageview');
            }
        } catch (e) {
            // no-op in non-browser contexts
        }
    }, [location.pathname, location.search]);

    // Scroll to hash targets (e.g., #share-memory) after route changes
    useEffect(() => {
        if (!location.hash) return;
        const targetId = location.hash.replace('#', '');
        if (!targetId) return;
        // Delay to allow the new page content to render
        const handle = window.setTimeout(() => {
            try {
                const el = document.getElementById(targetId);
                if (el) {
                    // Position element in upper-middle of screen for better visibility
                    const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - (window.innerHeight / 4.5);
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            } catch {
                // ignore
            }
        }, 50);
        return () => window.clearTimeout(handle);
    }, [location.pathname, location.hash]);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Default landing route goes to About */}
                <Route path="/" element={<About />} />

                {/* Explicit routes for each page */}
                <Route path="/Chat" element={<Chat />} />
                <Route path="/Timeline" element={<Timeline />} />
                <Route path="/LifeTimeline" element={<LifeTimeline />} />
                <Route path="/About" element={<About />} />
                <Route path="/Gallery" element={<Gallery />} />
                <Route path="/Content" element={<ContentPage />} /> {/* Add the route for the new page */}
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}