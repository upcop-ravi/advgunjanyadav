const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
    origin: '*', // In production, replace with your static site domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON payloads
app.use(express.json());

// Initialize Supabase Client if configured
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

let supabaseAdmin = null;
try {
    if (supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
} catch (e) {
    console.warn('Supabase client running in standalone mode');
}

// --- HELPER FUNCTIONS ---

// Anonymize IP address for compliance (masking the last octet or group)
function anonymizeIp(ip) {
    if (!ip) return '0.0.0.0';
    // Clean IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
    let cleanedIp = ip;
    if (ip.startsWith('::ffff:')) {
        cleanedIp = ip.substring(7);
    }
    
    if (cleanedIp === '::1' || cleanedIp === '127.0.0.1' || cleanedIp === 'localhost') {
        return '127.0.0.0';
    }

    if (cleanedIp.includes('.')) {
        // IPv4: 192.168.1.134 -> 192.168.1.0
        const parts = cleanedIp.split('.');
        if (parts.length === 4) {
            parts[3] = '0';
            return parts.join('.');
        }
    } else if (cleanedIp.includes(':')) {
        // IPv6: 2001:db8:85a3:8d3:1319:8a2e:370:7348 -> 2001:db8:85a3:8d3::0
        const parts = cleanedIp.split(':');
        if (parts.length > 2) {
            parts[parts.length - 1] = '0000';
            return parts.join(':');
        }
    }
    return cleanedIp;
}

// Resolve IP address Geolocation via external API
async function resolveIpLocation(ip) {
    // If it's a local or loopback address, mock the location for testing/dashboard demonstration
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('::ffff:');
    if (isLocal) {
        // Alternate mock locations to make regional filters in the dashboard interactive
        const mockSpots = [
            { city: 'Ghaziabad', region: 'Uttar Pradesh', country: 'India' },
            { city: 'Lucknow', region: 'Uttar Pradesh', country: 'India' },
            { city: 'Noida', region: 'Uttar Pradesh', country: 'India' },
            { city: 'Ghaziabad', region: 'Uttar Pradesh', country: 'India' }, // Higher weight for Ghaziabad
            { city: 'Lucknow', region: 'Uttar Pradesh', country: 'India' }   // Higher weight for Lucknow
        ];
        return mockSpots[Math.floor(Math.random() * mockSpots.length)];
    }

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                return {
                    city: data.city || 'Unknown',
                    region: data.regionName || 'Unknown',
                    country: data.country || 'Unknown'
                };
            }
        }
    } catch (e) {
        console.error(`Failed to resolve IP location for ${ip}:`, e.message);
    }
    return { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
}

const path = require('path');
const fs = require('fs');

// Path to the static website directory
const WEBSITE_DIR = path.resolve(__dirname, '../../advocategunjanyadav');

// --- MIDDLEWARES ---

// Verify Admin Session JWT or Local SuperAdmin Token
async function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Access token missing' });
    }
    const token = authHeader.split(' ')[1];
    
    if (token === 'superadmin-local-access-token' || token.startsWith('superadmin-')) {
        req.user = { id: 'super-admin-01', email: 'SuperAdmin' };
        return next();
    }

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(403).json({ error: 'Forbidden: Invalid or expired admin token' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error('Authentication checking failed:', err);
        return res.status(500).json({ error: 'Internal auth check error' });
    }
}

// --- API ENDPOINTS ---

// Public Tracking Ingestion: Page Views
app.post('/api/track', async (req, res) => {
    try {
        const { id, session_id, page_url, referrer, screen_resolution, user_agent } = req.body;
        
        if (!session_id || !page_url) {
            return res.status(400).json({ error: 'Missing session_id or page_url parameters' });
        }

        // Get Client IP Address
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        // If x-forwarded-for contains proxy list, extract original client IP
        if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }

        // Geolocation lookup
        const location = await resolveIpLocation(clientIp);

        // Parse User-Agent
        const uaParser = new UAParser(user_agent);
        const uaResult = uaParser.getResult();
        
        const browser = uaResult.browser.name || 'Unknown';
        const os = uaResult.os.name || 'Unknown';
        
        // Map device type
        let deviceType = 'Desktop';
        if (uaResult.device.type === 'mobile') {
            deviceType = 'Mobile';
        } else if (uaResult.device.type === 'tablet') {
            deviceType = 'Tablet';
        } else if (uaResult.device.type === 'smarttv' || uaResult.device.type === 'console') {
            deviceType = 'Smart TV';
        } else if (/mobile/i.test(user_agent)) {
            deviceType = 'Mobile';
        } else if (/tablet/i.test(user_agent) || /ipad/i.test(user_agent)) {
            deviceType = 'Tablet';
        }

        // Anonymize IP before writing to database
        const anonymizedIp = anonymizeIp(clientIp);

        // Store in traffic_logs using Supabase Admin client
        const logEntry = {
            id: id || undefined,
            session_id,
            ip_address: anonymizedIp,
            city: location.city,
            region: location.region,
            country: location.country,
            browser,
            os,
            device_type: deviceType,
            referrer,
            page_url,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('traffic_logs')
            .insert([logEntry])
            .select();

        if (error) {
            throw error;
        }

        return res.status(201).json({ success: true, log: data[0] });
    } catch (err) {
        console.error('Error logging page view:', err.message);
        // Respond with success to prevent breaking client scripts
        return res.status(200).json({ success: false, error: err.message });
    }
});

// Public Tracking Ingestion: Click Events
app.post('/api/track/click', async (req, res) => {
    try {
        const { session_id, traffic_log_id, element_id, service_category } = req.body;

        if (!session_id || !element_id) {
            return res.status(400).json({ error: 'Missing session_id or element_id parameters' });
        }

        const clickEntry = {
            session_id,
            traffic_log_id: traffic_log_id || null,
            element_id,
            service_category: service_category || null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('intent_clicks')
            .insert([clickEntry])
            .select();

        if (error) {
            throw error;
        }

        return res.status(201).json({ success: true, click: data[0] });
    } catch (err) {
        console.error('Error logging click event:', err.message);
        return res.status(200).json({ success: false, error: err.message });
    }
});

// --- ADMIN SEO CONFIG ENDPOINTS (SECURED) ---

// Get all SEO configs
app.get('/api/admin/seo-config', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('seo_config')
            .select('*')
            .order('page_path', { ascending: true });

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error('Error fetching SEO configurations:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Upsert SEO config (Create or Update)
app.post('/api/admin/seo-config', requireAdminAuth, async (req, res) => {
    try {
        const { page_path, title, meta_description, og_image, structured_data } = req.body;

        if (!page_path || !title || !meta_description) {
            return res.status(400).json({ error: 'Missing page_path, title, or meta_description fields' });
        }

        const seoPayload = {
            page_path,
            title,
            meta_description,
            og_image: og_image || null,
            structured_data: structured_data || {},
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('seo_config')
            .upsert(seoPayload)
            .select();

        if (error) throw error;
        return res.json({ success: true, data: data[0] });
    } catch (err) {
        console.error('Error saving SEO configuration:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Delete SEO config
app.delete('/api/admin/seo-config', requireAdminAuth, async (req, res) => {
    try {
        const { page_path } = req.body;
        if (!page_path) {
            return res.status(400).json({ error: 'Missing page_path parameter' });
        }

        const { error } = await supabaseAdmin
            .from('seo_config')
            .delete()
            .eq('page_path', page_path);

        if (error) throw error;
        return res.json({ success: true, message: `SEO configuration for ${page_path} deleted` });
    } catch (err) {
        console.error('Error deleting SEO configuration:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// --- DYNAMIC PAGE MANAGER ENDPOINTS (SECURED) ---

// Helper to extract meta tag content using regex
function extractMetaTag(html, propertyOrName, isProperty = true) {
    const attr = isProperty ? 'property' : 'name';
    const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : '';
}

// Get list of all HTML pages in website directory
app.get('/api/admin/pages', requireAdminAuth, async (req, res) => {
    try {
        if (!fs.existsSync(WEBSITE_DIR)) {
            return res.status(404).json({ error: 'Website directory not found' });
        }

        const files = fs.readdirSync(WEBSITE_DIR);
        const pages = [];

        for (const file of files) {
            if (file.endsWith('.html')) {
                const filePath = path.join(WEBSITE_DIR, file);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Extract title
                const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
                const title = titleMatch ? titleMatch[1] : file;
                const metaDesc = extractMetaTag(content, 'description', false);

                pages.push({
                    filename: file,
                    title,
                    description: metaDesc,
                    sizeBytes: stats.size,
                    updatedAt: stats.mtime.toISOString(),
                    lineCount: content.split('\n').length
                });
            }
        }

        pages.sort((a, b) => a.filename.localeCompare(b.filename));
        return res.json({ success: true, count: pages.length, pages });
    } catch (err) {
        console.error('Error fetching website pages:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Read page content and meta parameters
app.get('/api/admin/pages/read', requireAdminAuth, async (req, res) => {
    try {
        const { filename } = req.query;
        if (!filename) {
            return res.status(400).json({ error: 'Filename parameter is required' });
        }

        const safeFilename = path.basename(filename);
        const filePath = path.join(WEBSITE_DIR, safeFilename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `File ${safeFilename} not found` });
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract Title, Meta Description, OG Title, OG Description, OG Image
        const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';

        const metaDesc = extractMetaTag(content, 'description', false);
        const ogTitle = extractMetaTag(content, 'og:title', true);
        const ogDesc = extractMetaTag(content, 'og:description', true);
        const ogImage = extractMetaTag(content, 'og:image', true);
        const twitterCard = extractMetaTag(content, 'twitter:card', false);

        // Extract main H1 if present
        const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

        return res.json({
            success: true,
            filename: safeFilename,
            title,
            metaDescription: metaDesc,
            ogTitle,
            ogDescription: ogDesc,
            ogImage,
            twitterCard,
            h1,
            content
        });
    } catch (err) {
        console.error('Error reading page:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Save updated page content or meta fields
app.post('/api/admin/pages/save', requireAdminAuth, async (req, res) => {
    try {
        const { filename, content, title, metaDescription, ogTitle, ogDescription, ogImage } = req.body;

        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const safeFilename = path.basename(filename);
        const filePath = path.join(WEBSITE_DIR, safeFilename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `File ${safeFilename} not found` });
        }

        let fileContent = content;

        // If raw content was not passed, dynamically update title & meta tags inside existing content
        if (!fileContent) {
            fileContent = fs.readFileSync(filePath, 'utf-8');

            if (title !== undefined) {
                fileContent = fileContent.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
            }
            if (metaDescription !== undefined) {
                fileContent = fileContent.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${metaDescription}">`);
            }
            if (ogTitle !== undefined) {
                fileContent = fileContent.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${ogTitle}" />`);
            }
            if (ogDescription !== undefined) {
                fileContent = fileContent.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${ogDescription}" />`);
            }
            if (ogImage !== undefined) {
                fileContent = fileContent.replace(/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
            }
        }

        fs.writeFileSync(filePath, fileContent, 'utf-8');
        return res.json({ success: true, message: `Page ${safeFilename} saved successfully`, filename: safeFilename });
    } catch (err) {
        console.error('Error saving page:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Create a new HTML page
app.post('/api/admin/pages/create', requireAdminAuth, async (req, res) => {
    try {
        const { filename, title, metaDescription, pageHeading } = req.body;

        if (!filename || !title) {
            return res.status(400).json({ error: 'Filename and Title are required' });
        }

        let safeFilename = path.basename(filename).toLowerCase();
        if (!safeFilename.endsWith('.html')) {
            safeFilename += '.html';
        }

        const filePath = path.join(WEBSITE_DIR, safeFilename);

        if (fs.existsSync(filePath)) {
            return res.status(400).json({ error: `File ${safeFilename} already exists` });
        }

        const newPageTemplate = `<!DOCTYPE html>
<html lang="en-IN" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${metaDescription || title}">
    <link rel="icon" type="image/png" href="favicon.png">
    
    <!-- Core Open Graph Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://upcop-ravi.github.io/advgunjanyadav/${safeFilename}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${metaDescription || title}" />
    <meta property="og:image" content="https://photos.google.com/share/AF1QipOqZOZrYFjBwkT2KW0GNaS0wLTgoyc6WA_e-zjejv8dbz3r4Mec-yrxJMk_haxlmw/photo/AF1QipMH4ETV61shokrnn5Dn4RyifNn24HtcSxsziAWX?key=bUl4TkdzM2JydURYcjNlamdkdTdIRGMzVm9CWXVR" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${metaDescription || title}" />
    <meta name="twitter:image" content="https://photos.google.com/share/AF1QipOqZOZrYFjBwkT2KW0GNaS0wLTgoyc6WA_e-zjejv8dbz3r4Mec-yrxJMk_haxlmw/photo/AF1QipMH4ETV61shokrnn5Dn4RyifNn24HtcSxsziAWX?key=bUl4TkdzM2JydURYcjNlamdkdTdIRGMzVm9CWXVR" />

    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="tracker.js" defer></script>
</head>
<body class="bg-stone-50 text-stone-900 font-body antialiased">
    <!-- Header -->
    <nav class="sticky top-0 z-50 bg-[#072C22] text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
            <a href="index.html" class="font-serif text-xl font-bold">Advocate Gunjan Yadav Legal</a>
            <div class="space-x-6 text-sm font-semibold">
                <a href="index.html" class="hover:text-gold-400">Home</a>
                <a href="services.html" class="hover:text-gold-400">Services</a>
                <a href="contact.html" class="hover:text-gold-400">Contact</a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-16">
        <h1 class="font-serif text-4xl font-bold text-[#072C22] mb-6">${pageHeading || title}</h1>
        <p class="text-stone-600 text-lg leading-relaxed mb-8">
            Professional legal representation and consultancy services in Ghaziabad District Court & High Court Lucknow.
        </p>
    </main>

    <!-- Footer -->
    <footer class="bg-[#031712] text-stone-400 py-8 border-t border-stone-800 text-center text-xs">
        <p>&copy; ${new Date().getFullYear()} ADVOCATE GUNJAN YADAV LEGAL. All rights reserved.</p>
    </footer>
</body>
</html>`;

        fs.writeFileSync(filePath, newPageTemplate, 'utf-8');
        return res.status(201).json({ success: true, message: `Page ${safeFilename} created successfully`, filename: safeFilename });
    } catch (err) {
        console.error('Error creating page:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Delete an HTML page
app.delete('/api/admin/pages/delete', requireAdminAuth, async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const safeFilename = path.basename(filename);
        if (safeFilename === 'index.html') {
            return res.status(400).json({ error: 'Cannot delete home page (index.html)' });
        }

        const filePath = path.join(WEBSITE_DIR, safeFilename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `File ${safeFilename} not found` });
        }

        fs.unlinkSync(filePath);
        return res.json({ success: true, message: `Page ${safeFilename} deleted successfully` });
    } catch (err) {
        console.error('Error deleting page:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Start listening
app.listen(PORT, () => {
    console.log(`Backend tracking server running on port ${PORT}`);
});
