// Shared in-memory product store
// In a production app this would be backed by MongoDB

let products = [
    // AUDIO (Category: Audio)
    { id: "ultra-bass-headphones", name: "Ultra-Bass Headphones", brand: "Lumina Audio", price: 129, was: 199, discount: "35%", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", badge: "BESTSELLER", badgeClass: "badge-primary", category: "Audio" },
    { id: "sonic-stream-pro", name: "Sonic Stream Pro", brand: "Sonic Stream", price: 89, was: 139, discount: "36%", image: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=800&auto=format&fit=crop", badge: "HOT", badgeClass: "badge-danger", category: "Audio" },
    { id: "earbuds-x", name: "Earbuds X ANC", brand: "Lumina Audio", price: 59, was: 99, discount: "40%", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop", badge: "SALE", badgeClass: "badge-warning", category: "Audio" },
    { id: "studio-monitor-z", name: "Studio Monitor Z", brand: "Z-Audio", price: 299, was: 399, discount: "25%", image: "https://images.unsplash.com/photo-1599666505327-7758b44a9985?q=80&w=800&auto=format&fit=crop", badge: "PRO", badgeClass: "badge-accent", category: "Audio" },
    { id: "vintage-turntable", name: "Vintage Turntable", brand: "RetroSound", price: 249, was: 349, discount: "28%", image: "https://images.unsplash.com/photo-1603048588665-791ca8ecca0e?q=80&w=800&auto=format&fit=crop", badge: "LIMITED", badgeClass: "badge-primary", category: "Audio" },

    // WEARABLES (Category: Wearables)
    { id: "chrono-series", name: "Chrono Series Watch", brand: "Lumina Watch", price: 194, was: 299, discount: "35%", image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=800&auto=format&fit=crop", badge: "DEAL", badgeClass: "badge-danger", category: "Wearables" },
    { id: "proband-5", name: "ProBand Fitness 5", brand: "ProTech", price: 79, was: 119, discount: "34%", image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=800&auto=format&fit=crop", badge: "BESTSELLER", badgeClass: "badge-primary", category: "Wearables" },
    { id: "sport-fit-band", name: "SportFit Band Plus", brand: "ProTech", price: 49, was: 89, discount: "45%", image: "https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?q=80&w=800&auto=format&fit=crop", badge: "SALE", badgeClass: "badge-warning", category: "Wearables" },
    { id: "titan-smart-pro", name: "Titan Smart Pro", brand: "Lumina Watch", price: 399, was: 499, discount: "20%", image: "https://images.unsplash.com/photo-1508685096489-77a5ad2ba979?q=80&w=800&auto=format&fit=crop", badge: "ELITE", badgeClass: "badge-accent", category: "Wearables" },
    { id: "sleep-ring-track", name: "Sleep Tracker Ring", brand: "BioMetric", price: 199, was: 249, discount: "20%", image: "https://images.unsplash.com/photo-1617043431665-36ae05e94b5f?q=80&w=800&auto=format&fit=crop", badge: "INNOVATIVE", badgeClass: "badge-primary", category: "Wearables" },

    // PHONES (Category: Phones)
    { id: "zenith-14-pro", name: "Zenith 14 Pro", brand: "Zenith", price: 999, was: 1199, discount: "16%", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop", badge: "FLAGSHIP", badgeClass: "badge-primary", category: "Phones" },
    { id: "pixel-flow-s", name: "PixelFlow S", brand: "Lumina", price: 549, was: 699, discount: "21%", image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=800&auto=format&fit=crop", badge: "VALUE", badgeClass: "badge-accent", category: "Phones" },
    { id: "rugged-phone-x", name: "Rugged Phone X", brand: "ToughTech", price: 449, was: 599, discount: "25%", image: "https://images.unsplash.com/photo-1556656793-062ff98782a7?q=80&w=800&auto=format&fit=crop", badge: "TOUGH", badgeClass: "badge-warning", category: "Phones" },
    { id: "fold-ultra-2", name: "Fold Ultra 2", brand: "Nova", price: 1599, was: 1899, discount: "15%", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop", badge: "PREMIUM", badgeClass: "badge-primary", category: "Phones" },
    { id: "nexus-budget", name: "Nexus Budget Lite", brand: "Nexus", price: 199, was: 299, discount: "33%", image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop", badge: "BUDGET", badgeClass: "badge-accent", category: "Phones" },

    // VR (Category: VR)
    { id: "vision-x-vr", name: "Vision X VR Headset", brand: "Vision X", price: 449, was: 599, discount: "25%", image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=800&auto=format&fit=crop", badge: "NEW", badgeClass: "badge-accent", category: "VR" },
    { id: "quest-master-3", name: "Quest Master 3", brand: "MasterVR", price: 349, was: 449, discount: "22%", image: "https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?q=80&w=800&auto=format&fit=crop", badge: "HOT", badgeClass: "badge-danger", category: "VR" },
    { id: "gaming-vr-pro", name: "Gaming VR Pro", brand: "MasterVR", price: 899, was: 1099, discount: "18%", image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop", badge: "PRO", badgeClass: "badge-accent", category: "VR" },
    { id: "lite-vr-box", name: "Lite VR Box", brand: "Vision X", price: 99, was: 149, discount: "33%", image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800&auto=format&fit=crop", badge: "DEAL", badgeClass: "badge-primary", category: "VR" },
    { id: "haptic-suit", name: "Haptic Feedback Suit", brand: "MasterVR", price: 599, was: 799, discount: "25%", image: "https://images.unsplash.com/photo-1616464916356-3a777b2b60b1?q=80&w=800&auto=format&fit=crop", badge: "IMMERSIVE", badgeClass: "badge-accent", category: "VR" },

    // TABLETS (Category: Tablets)
    { id: "pad-air", name: "Pad Air Creative", brand: "Lumina", price: 349, was: 499, discount: "30%", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop", badge: "SALE", badgeClass: "badge-warning", category: "Tablets" },
    { id: "tab-pro-12", name: "Tab Pro 12.9", brand: "Nova", price: 799, was: 999, discount: "20%", image: "https://images.unsplash.com/photo-1561154418-5232785f562a?q=80&w=800&auto=format&fit=crop", badge: "FLAGSHIP", badgeClass: "badge-primary", category: "Tablets" },
    { id: "mini-tablet-7", name: "Mini Tablet 7", brand: "Nexus", price: 149, was: 219, discount: "32%", image: "https://images.unsplash.com/flagged/photo-1557002595-5853f86e3794?q=80&w=800&auto=format&fit=crop", badge: "COMPACT", badgeClass: "badge-accent", category: "Tablets" },
    { id: "drawing-pad-x", name: "Stylus Drawing Pad", brand: "Artisan", price: 499, was: 649, discount: "23%", image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop", badge: "CREATIVE", badgeClass: "badge-primary", category: "Tablets" },
    { id: "education-tab", name: "Education Tab Pro", brand: "Lumina", price: 249, was: 349, discount: "29%", image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?q=80&w=800&auto=format&fit=crop", badge: "EDU", badgeClass: "badge-accent", category: "Tablets" },

    // CINEMA (Category: Cinema)
    { id: "soundbar-x700", name: "SoundBar X700", brand: "Lumina Cinema", price: 299, was: 499, discount: "40%", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop", badge: "40% OFF", badgeClass: "badge-danger", category: "Cinema" },
    { id: "oled-cinema-tv", name: "65-inch OLED 4K TV", brand: "VividView", price: 1299, was: 1799, discount: "28%", image: "https://images.unsplash.com/photo-1593359674241-55cd4bd7e44a?q=80&w=800&auto=format&fit=crop", badge: "ULTRA", badgeClass: "badge-primary", category: "Cinema" },
    { id: "projector-4k", name: "Home Cinema Projector", brand: "VividView", price: 899, was: 1199, discount: "25%", image: "https://images.unsplash.com/photo-1535016120720-40c646bebbfc?q=80&w=800&auto=format&fit=crop", badge: "PRO", badgeClass: "badge-accent", category: "Cinema" },
    { id: "surround-system", name: "7.1 Surround System", brand: "Lumina Cinema", price: 549, was: 749, discount: "27%", image: "https://images.unsplash.com/photo-1545016803-a63d0027d78a?q=80&w=800&auto=format&fit=crop", badge: "IMMERSIVE", badgeClass: "badge-primary", category: "Cinema" },
    { id: "tv-mount-led", name: "Smart TV Mount LED", brand: "VividView", price: 49, was: 79, discount: "38%", image: "https://images.unsplash.com/photo-1552285114-1f6373e3a479?q=80&w=800&auto=format&fit=crop", badge: "DEAL", badgeClass: "badge-warning", category: "Cinema" },

    // CAMERAS (Category: Cameras)
    { id: "snap-pro", name: "Snap Pro Camera", brand: "NovaCam", price: 699, was: 899, discount: "22%", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop", badge: "BUNDLE", badgeClass: "badge-accent", category: "Cameras" },
    { id: "mirrorless-z1", name: "Mirrorless Z1", brand: "NovaCam", price: 1199, was: 1499, discount: "20%", image: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?q=80&w=800&auto=format&fit=crop", badge: "TOP RATED", badgeClass: "badge-primary", category: "Cameras" },
    { id: "vlog-camera-kit", name: "Vlog Camera Kit", brand: "Lumina", price: 449, was: 599, discount: "25%", image: "https://images.unsplash.com/photo-1495707902641-75cac3c27e8a?q=80&w=800&auto=format&fit=crop", badge: "HOT", badgeClass: "badge-danger", category: "Cameras" },
    { id: "lens-wide-35", name: "35mm Wide Angle Lens", brand: "NovaCam", price: 299, was: 399, discount: "25%", image: "https://images.unsplash.com/photo-1617005834873-1c395bc8adbd?q=80&w=800&auto=format&fit=crop", badge: "NEW", badgeClass: "badge-accent", category: "Cameras" },
    { id: "tripod-elite", name: "Tripod Elite Pro", brand: "NovaCam", price: 129, was: 179, discount: "28%", image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=800&auto=format&fit=crop", badge: "ESSENTIAL", badgeClass: "badge-primary", category: "Cameras" },

    // DRONES (Category: Drones)
    { id: "drone-mini", name: "AeroDrone Mini 4K", brand: "Lumina", price: 249, was: 349, discount: "29%", image: "https://images.unsplash.com/photo-1473960104372-8ad7b8d6ed90?q=80&w=800&auto=format&fit=crop", badge: "NEW", badgeClass: "badge-accent", category: "Drones" },
    { id: "falcon-drone-x", name: "Falcon Drone X", brand: "SkyFly", price: 899, was: 1199, discount: "25%", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop", badge: "PRO", badgeClass: "badge-primary", category: "Drones" },
    { id: "racing-drone-r1", name: "Racing Drone R1", brand: "SkyFly", price: 399, was: 499, discount: "20%", image: "https://images.unsplash.com/photo-1521782462922-9318be1cfd04?q=80&w=800&auto=format&fit=crop", badge: "SPEED", badgeClass: "badge-danger", category: "Drones" },
    { id: "underwater-drone", name: "AquaExplorer Drone", brand: "SkyFly", price: 649, was: 799, discount: "19%", image: "https://images.unsplash.com/photo-1506197603152-b208b3b1341d?q=80&w=800&auto=format&fit=crop", badge: "UNIQUE", badgeClass: "badge-accent", category: "Drones" },
    { id: "drone-battery-kit", name: "Drone Battery Kit", brand: "SkyFly", price: 99, was: 149, discount: "33%", image: "https://images.unsplash.com/photo-1504893524553-f859149f3575?q=80&w=800&auto=format&fit=crop", badge: "ACCESSORY", badgeClass: "badge-warning", category: "Drones" },

    // DISPLAYS (Category: Displays)
    { id: "smart-display", name: "Smart Display 10in", brand: "Lumina", price: 149, was: 219, discount: "32%", image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=800&auto=format&fit=crop", badge: "FLASH", badgeClass: "badge-primary", category: "Displays" },
    { id: "curved-monitor-34", name: "34-inch Curved UltraWide", brand: "VividView", price: 699, was: 899, discount: "22%", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop", badge: "GAMING", badgeClass: "badge-danger", category: "Displays" },
    { id: "vertical-monitor", name: "Vertical Monitor S2", brand: "VividView", price: 299, was: 399, discount: "25%", image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=800&auto=format&fit=crop", badge: "CODER", badgeClass: "badge-accent", category: "Displays" },
    { id: "portable-display", name: "Portable USB-C Monitor", brand: "Lumina", price: 199, was: 279, discount: "29%", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop", badge: "TRAVEL", badgeClass: "badge-primary", category: "Displays" },
    { id: "dual-screen-mount", name: "Dual Screen Desk Mount", brand: "Nexus", price: 89, was: 129, discount: "31%", image: "https://images.unsplash.com/photo-1616422285623-13ff0167c95c?q=80&w=800&auto=format&fit=crop", badge: "OFFICE", badgeClass: "badge-accent", category: "Displays" },

    // ACCESSORIES (Category: Accessories)
    { id: "gaming-chair", name: "ErgoMax Gaming Chair", brand: "ProTech", price: 199, was: 299, discount: "33%", image: "https://images.unsplash.com/photo-1598550476439-6847785fce6c?q=80&w=800&auto=format&fit=crop", badge: "DEAL", badgeClass: "badge-danger", category: "Accessories" },
    { id: "mechanical-keyboard", name: "RGB Mechanical Keyboard", brand: "ToughTech", price: 129, was: 179, discount: "28%", image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop", badge: "HOT", badgeClass: "badge-danger", category: "Accessories" },
    { id: "mouse-pad-extra", name: "Extra Large Mouse Pad", brand: "Lumina", price: 29, was: 49, discount: "40%", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop", badge: "SALE", badgeClass: "badge-warning", category: "Accessories" },
    { id: "usb-c-hub", name: "7-in-1 USB-C Hub", brand: "Nexus", price: 59, was: 89, discount: "33%", image: "https://images.unsplash.com/photo-1586810165616-94c631fc2f79?q=80&w=800&auto=format&fit=crop", badge: "ESSENTIAL", badgeClass: "badge-primary", category: "Accessories" },
    { id: "laptop-stand", name: "Aluminium Laptop Stand", brand: "Nexus", price: 39, was: 59, discount: "33%", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop", badge: "OFFICE", badgeClass: "badge-accent", category: "Accessories" },
];

function generateId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

module.exports = {
    getAll: () => products,

    getById: (id) => products.find(p => p.id === id),

    create: (data) => {
        const product = {
            id: generateId(data.name),
            name: data.name,
            brand: data.brand,
            price: parseFloat(data.price) || 0,
            was: parseFloat(data.was) || 0,
            discount: data.discount || '0%',
            image: data.image || 'https://via.placeholder.com/600',
            badge: data.badge || 'NEW',
            badgeClass: data.badgeClass || 'badge-primary',
            category: data.category || 'Other',
        };
        products.push(product);
        return product;
    },

    update: (id, data) => {
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return null;
        products[idx] = {
            ...products[idx],
            name: data.name || products[idx].name,
            brand: data.brand || products[idx].brand,
            price: parseFloat(data.price) || products[idx].price,
            was: parseFloat(data.was) || products[idx].was,
            discount: data.discount || products[idx].discount,
            image: data.image || products[idx].image,
            badge: data.badge || products[idx].badge,
            badgeClass: data.badgeClass || products[idx].badgeClass,
            category: data.category || products[idx].category,
        };
        return products[idx];
    },

    delete: (id) => {
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return false;
        products.splice(idx, 1);
        return true;
    },
};
