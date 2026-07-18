(function() {
    // Analytics & Telemetry Tracker for Adv Gunjan Legal Associates
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://advocategunjanyadav-admin.onrender.com'; // Fallback / Production URL placeholder

    // Helper to generate a standard UUID (v4)
    function generateUUID() {
        try {
            return crypto.randomUUID();
        } catch (e) {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    // Retrieve or create persistent session_id
    let sessionId = sessionStorage.getItem('adv_gunjan_session_id');
    if (!sessionId) {
        sessionId = generateUUID();
        sessionStorage.setItem('adv_gunjan_session_id', sessionId);
    }

    // Helper to transmit data to the ingestion server
    function sendEvent(endpoint, payload) {
        const url = `${BACKEND_URL}${endpoint}`;
        const blobPayload = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blobPayload);
        } else {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(function() {
                // Fail silently to avoid breaking UX
            });
        }
    }

    // Capture Page View
    const pageViewPayload = {
        session_id: sessionId,
        page_url: window.location.pathname + window.location.search,
        referrer: document.referrer || '',
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        user_agent: navigator.userAgent
    };
    
    // Store current page view ID to link with click events (will be returned by server or generated locally)
    // To ensure exact relation, generate a unique page view ID locally and send it
    const pageViewId = generateUUID();
    pageViewPayload.id = pageViewId;

    // Send page view log
    sendEvent('/api/track', pageViewPayload);

    // Dynamic service category extraction based on link keywords
    function detectServiceCategory(text, href) {
        const lowerText = text.toLowerCase();
        const lowerHref = href.toLowerCase();
        
        if (lowerText.includes('bail') || lowerHref.includes('bail')) return 'Bail Support';
        if (lowerText.includes('criminal') || lowerHref.includes('criminal')) return 'Criminal Defense';
        if (lowerText.includes('cyber') || lowerHref.includes('cyber')) return 'Cyber Crime';
        if (lowerText.includes('family') || lowerHref.includes('family') || lowerText.includes('marriage') || lowerHref.includes('marriage') || lowerText.includes('divorce') || lowerHref.includes('divorce')) return 'Family Law';
        if (lowerText.includes('civil') || lowerHref.includes('civil')) return 'Civil Litigation';
        if (lowerText.includes('cheque') || lowerHref.includes('cheque') || lowerText.includes('bounce') || lowerHref.includes('bounce')) return 'Cheque Bounce';
        if (lowerText.includes('consumer') || lowerHref.includes('consumer')) return 'Consumer Court';
        if (lowerText.includes('corporate') || lowerHref.includes('corporate')) return 'Corporate Law';
        if (lowerText.includes('drafting') || lowerHref.includes('drafting')) return 'Legal Drafting';
        if (lowerText.includes('property') || lowerHref.includes('property') || lowerText.includes('land') || lowerHref.includes('land')) return 'Property Dispute';
        
        return null;
    }

    // Attach Click event listeners to track user intent
    document.addEventListener('DOMContentLoaded', function() {
        document.body.addEventListener('click', function(event) {
            // Check for phone (tel:) links
            const anchor = event.target.closest('a');
            if (anchor) {
                const href = anchor.getAttribute('href') || '';
                const text = anchor.innerText || anchor.textContent || '';
                
                if (href.startsWith('tel:')) {
                    sendEvent('/api/track/click', {
                        session_id: sessionId,
                        traffic_log_id: pageViewId,
                        element_id: `phone-link:${href}`,
                        service_category: detectServiceCategory(text, window.location.pathname) || 'General Inquiry'
                    });
                } else {
                    // Check if clicking a practice area / service link
                    const category = detectServiceCategory(text, href);
                    if (category) {
                        sendEvent('/api/track/click', {
                            session_id: sessionId,
                            traffic_log_id: pageViewId,
                            element_id: `service-link:${href}`,
                            service_category: category
                        });
                    }
                }
            }

            // Check if clicking service cards or buttons containing service identification
            const button = event.target.closest('button, [role="button"], .service-card');
            if (button && !anchor) {
                const text = button.innerText || button.textContent || '';
                const id = button.id || button.className || 'button';
                const category = detectServiceCategory(text, '');
                if (category) {
                    sendEvent('/api/track/click', {
                        session_id: sessionId,
                        traffic_log_id: pageViewId,
                        element_id: `element-click:${id.split(' ')[0]}`,
                        service_category: category
                    });
                }
            }
        }, true);
    });
})();
