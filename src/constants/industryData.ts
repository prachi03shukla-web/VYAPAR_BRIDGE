export interface SubCategory {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  tags: string[];
}

export interface IndustryHub {
  id: string;
  name: string;
  shortName: string;
  hindiName: string;
  icon: string;
  badge: string;
  color: string;
  description: string;
  subcategories: SubCategory[];
}

export const ALL_INDUSTRIES: IndustryHub[] = [
  {
    id: 'tiles_sanitary',
    name: 'Tiles, Sanitaryware & Bathware',
    shortName: 'Tiles & Bath',
    hindiName: 'टाइल्स, सेनेटरी व बाथवेयर उद्योग',
    icon: '🧱',
    badge: 'Ceramic Hub',
    color: 'from-amber-500 to-orange-600',
    description: 'Vitrified tiles, ceramic slabs, faucets, bath fittings, granite, marble & adhesives',
    subcategories: [
      { id: 'all_tiles', name: 'All Tiles & Sanitary', hindiName: 'सभी उत्पाद', description: 'Complete ceramic and bath products', tags: ['tiles', 'sanitary', 'ceramic', 'bathware'] },
      { id: 'vitrified_tiles', name: 'Vitrified Tiles (GVT/PGVT)', hindiName: 'विट्रिफाइड टाइल्स', description: 'Double charge, PGVT, GVT, nano polished tiles', tags: ['vitrified', 'gvt', 'pgvt', 'double charge', 'slab'] },
      { id: 'ceramic_wall_floor', name: 'Ceramic & Wall Tiles', hindiName: 'सिरेमिक व वॉल टाइल्स', description: 'Digital wall tiles, subway tiles, elevation ceramic', tags: ['ceramic', 'wall tiles', 'elevation', 'kitchen tiles'] },
      { id: 'sanitaryware_ewc', name: 'Sanitaryware & EWCs', hindiName: 'सेनेटरीवेयर व कमोड', description: 'Wall hung EWCs, one piece, basins, urinals', tags: ['sanitary', 'sanitaryware', 'ewc', 'commode', 'basin', 'washbasin'] },
      { id: 'bathware_cp', name: 'Bathware & CP Fittings', hindiName: 'बाथ फिटिंग्स व नल', description: 'Brass faucets, overhead showers, diverters, bath sets', tags: ['bathware', 'faucets', 'taps', 'shower', 'cp fittings', 'diverter'] },
      { id: 'granite_marble', name: 'Granite, Marble & Slabs', hindiName: 'ग्रेनाइट, मार्बल व स्लैब', description: 'Natural granite, Italian marble, quartz countertops', tags: ['granite', 'marble', 'stone', 'quartz', 'countertop'] },
      { id: 'adhesives_grout', name: 'Tile Adhesives & Grouts', hindiName: 'टाइल केमिकल व ग्राउट', description: 'Epoxy grout, tile bond adhesive, spacer, cleaner', tags: ['adhesive', 'grout', 'chemical', 'epoxy', 'tile paste'] },
      { id: 'factory_machinery_tiles', name: 'Factory & Raw Materials', hindiName: 'फैक्ट्री व मशीनरी', description: 'Tile glaze, frit, clay, digital printing machinery', tags: ['machinery', 'raw material', 'kiln', 'glaze', 'frit'] },
    ]
  },
  {
    id: 'textile_garments',
    name: 'Textile, Garments & Fashion',
    shortName: 'Textile & Fashion',
    hindiName: 'टेक्सटाइल, गारमेंट्स व फैशन उद्योग',
    icon: '👗',
    badge: 'Apparel Hub',
    color: 'from-pink-500 to-rose-600',
    description: "Men's wear, women ethnic fashion, cotton fabrics, yarns, kidswear & garment mills",
    subcategories: [
      { id: 'all_textile', name: 'All Textile & Garments', hindiName: 'सभी परिधान', description: 'Complete garments, fabrics and knitwear', tags: ['textile', 'clothing', 'garment', 'fashion', 'fabric'] },
      { id: 'mens_wear', name: "Men's Wear & Suiting", hindiName: 'मेंस वियर व शूटिंग', description: 'Formal shirts, trousers, denim jeans, blazers, t-shirts', tags: ['mens wear', 'shirt', 'trouser', 'jeans', 't-shirt', 'suit', 'blazer'] },
      { id: 'womens_fashion', name: "Women's Ethnic & Fashion", hindiName: 'महिला परिधान व साड़ियां', description: 'Sarees, kurtis, lehengas, western dresses, dupattas', tags: ['saree', 'kurti', 'lehenga', 'suit', 'women fashion', 'dress', 'ethnic'] },
      { id: 'cotton_fabrics_yarn', name: 'Fabrics, Yarns & Denim', hindiName: 'फैब्रिक, धागे व डेनिम रोल', description: 'Grey fabric, woven rolls, cotton yarn, printed fabric', tags: ['fabric', 'yarn', 'cotton', 'denim', 'cloth roll', 'weaving'] },
      { id: 'kids_wear', name: "Kids & Baby Wear", hindiName: 'बच्चों के कपड़े', description: 'Boys & girls readymade sets, newborn wear, frocks', tags: ['kids wear', 'baby clothing', 'children garments'] },
      { id: 'hosiery_knitwear', name: 'Hosiery, Undergarments & Knits', hindiName: 'होजरी व इनरवियर', description: 'Vests, briefs, thermal wear, tracksuits, socks', tags: ['hosiery', 'innerwear', 'socks', 'thermal', 'tracksuit'] },
      { id: 'uniforms_bulk', name: 'School & Corporate Uniforms', hindiName: 'यूनिफॉर्म व बल्क ऑर्डर', description: 'Hospital scrubs, industrial workwear, school sets', tags: ['uniform', 'workwear', 'scrubs', 'safety dress'] },
      { id: 'garment_machinery', name: 'Sewing Machines & Loom Units', hindiName: 'सिलाई व बुनाई मशीनें', description: 'Industrial sewing machines, embroidery, looms', tags: ['sewing machine', 'loom', 'embroidery', 'textile machine'] },
    ]
  },
  {
    id: 'grocery_fmcg',
    name: 'Grocery, FMCG & Food Trade',
    shortName: 'Grocery & FMCG',
    hindiName: 'किराना, FMCG व खाद्य व्यापार',
    icon: '🌾',
    badge: 'Mandi & FMCG',
    color: 'from-emerald-500 to-teal-600',
    description: 'Grains, pulses, spices, edible oils, dry fruits, packaged foods & supermart wholesale',
    subcategories: [
      { id: 'all_grocery', name: 'All Grocery & FMCG', hindiName: 'सभी किराना उत्पाद', description: 'Complete staple, food and household trade', tags: ['grocery', 'fmcg', 'kirana', 'food', 'wholesale'] },
      { id: 'staples_grains', name: 'Grains, Rice & Pulses (दाल/चावल)', hindiName: 'अनाज, दाल व चावल', description: 'Basmati rice, wheat, pulses, chana, atta, maida, suji', tags: ['rice', 'wheat', 'dal', 'pulse', 'atta', 'grain', 'chana', 'flour'] },
      { id: 'spices_dryfruits', name: 'Spices & Dry Fruits (मसाले/मेवे)', hindiName: 'मसाले व ड्राई फ्रूट्स', description: 'Cardamom, clove, turmeric, almonds, cashews, raisins', tags: ['spice', 'dry fruits', 'masala', 'kaju', 'badam', 'haldi', 'mirch'] },
      { id: 'edible_oils_ghee', name: 'Edible Oils & Desi Ghee (तेल/घी)', hindiName: 'खाद्य तेल व शुद्ध घी', description: 'Mustard oil, refined soyabean oil, pure cow/buffalo ghee', tags: ['oil', 'ghee', 'mustard oil', 'refined oil', 'edible oil', 'sarson'] },
      { id: 'packaged_snacks', name: 'Packaged Snacks, Biscuits & Sweets', hindiName: 'नमकीन, बिस्कुट व बेकरी', description: 'Namkeen mixtures, chips, biscuits, cookies, chocolates', tags: ['snacks', 'namkeen', 'biscuit', 'chips', 'confectionery', 'bakery'] },
      { id: 'tea_beverages', name: 'Tea, Coffee & Beverages', hindiName: 'चाय, कॉफी व कोल्ड ड्रिंक्स', description: 'Assam CTC tea, roasted coffee, cold drinks, syrups', tags: ['tea', 'coffee', 'beverage', 'chai', 'syrup', 'juice'] },
      { id: 'dairy_frozen', name: 'Dairy Products & Cold Storage', hindiName: 'डेयरी व फ्रोजन प्रोडक्ट्स', description: 'Butter, paneer, cheese, milk powder, frozen peas', tags: ['dairy', 'paneer', 'cheese', 'butter', 'frozen food'] },
      { id: 'cleaning_detergents', name: 'Soaps, Detergents & Cleaning', hindiName: 'डिटर्जेंट व क्लीनिंग सामग्री', description: 'Washing powders, toilet cleaners, dishwashing soaps', tags: ['detergent', 'soap', 'cleaner', 'washing powder', 'toiletries'] },
    ]
  },
  {
    id: 'hardware_electrical',
    name: 'Hardware, Electrical & Building',
    shortName: 'Hardware & Electric',
    hindiName: 'हार्डवेयर, इलेक्ट्रिकल व बिल्डिंग सामग्री',
    icon: '⚙️',
    badge: 'Industrial & Build',
    color: 'from-blue-500 to-indigo-600',
    description: 'Wires, switches, PVC pipes, tools, paints, waterproofing, steel & building supplies',
    subcategories: [
      { id: 'all_hardware', name: 'All Hardware & Electrical', hindiName: 'सभी हार्डवेयर व बिजली', description: 'Complete electrical, plumbing and building hardware', tags: ['hardware', 'electrical', 'building', 'tools'] },
      { id: 'electrical_wiring', name: 'Wires, Cables & Modular Switches', hindiName: 'तार, केबल व स्विच', description: 'Copper house wires, modular switch plates, MCBs, LEDs', tags: ['electrical', 'wire', 'cable', 'switch', 'mcb', 'led light'] },
      { id: 'pipes_plumbing', name: 'PVC/CPVC Pipes & Fittings', hindiName: 'पीवीसी पाइप व फिटिंग्स', description: 'Plumbing pipes, drainage SWR, water storage tanks', tags: ['pipes', 'pvc', 'cpvc', 'plumbing', 'pipe fitting', 'water tank'] },
      { id: 'paints_waterproofing', name: 'Paints, Putty & Waterproofing', hindiName: 'पेंट, पुट्टी व वॉटरप्रूफिंग', description: 'Wall putty, acrylic emulsion, primer, water shield coats', tags: ['paint', 'putty', 'primer', 'waterproofing', 'dr fixit', 'asian paints'] },
      { id: 'tools_fasteners', name: 'Power Tools, Hardware & Locks', hindiName: 'टूल्स, कब्जे व ताले', description: 'Drills, grinders, mortise locks, screws, handles, hinges', tags: ['power tools', 'drill', 'lock', 'hinges', 'screws', 'fasteners'] },
      { id: 'steel_cement_sariya', name: 'TMT Steel, Sariya & Cement Bags', hindiName: 'टीएमटी सरिया व सीमेंट', description: 'Fe550D TMT bars, UltraTech/Ambuja cement, metal sheets', tags: ['steel', 'tmt', 'sariya', 'cement', 'iron', 'construction'] },
      { id: 'glass_aluminum_doors', name: 'Glass, Aluminium & Doors', hindiName: 'ग्लास, एल्युमिनियम व दरवाजे', description: 'Toughened glass, aluminium section, flush doors, plywood', tags: ['glass', 'aluminium', 'plywood', 'door', 'board'] },
    ]
  },
  {
    id: 'packaging_logistics',
    name: 'Packaging, Logistics & Agro Trade',
    shortName: 'Logistics & Agro',
    hindiName: 'पैकेजिंग, लॉजिस्टिक्स व एग्रो व्यापार',
    icon: '📦',
    badge: 'Supply Chain',
    color: 'from-amber-600 to-yellow-600',
    description: 'Corrugated cartons, plastic packaging, transport fleet, agro seeds & industrial units',
    subcategories: [
      { id: 'all_packaging', name: 'All Supply Chain & Agro', hindiName: 'सभी सप्लाई चेन', description: 'Packaging, transport, seeds and trade machinery', tags: ['packaging', 'logistics', 'transport', 'agro'] },
      { id: 'corrugated_cartons', name: 'Corrugated Boxes & Cartons', hindiName: 'कार्टन व डिब्बे', description: '3/5/7 ply shipping boxes, printed mono cartons', tags: ['boxes', 'carton', 'corrugated', 'packaging box'] },
      { id: 'plastic_poly_bags', name: 'BOPP Bags, Rolls & Tapes', hindiName: 'प्लास्टिक बैग व रोल', description: 'Woven sacks, shrink stretch wraps, BOPP tape rolls', tags: ['bopp', 'plastic bag', 'tape', 'stretch film', 'pouches'] },
      { id: 'logistics_freight', name: 'Truck Transporters & Logistics', hindiName: 'ट्रांसपोर्ट व माल ढुलाई', description: 'All India transport fleets, full truck load, part load', tags: ['transport', 'logistics', 'truck', 'freight', 'carrier'] },
      { id: 'agro_seeds_pesticides', name: 'Agro Seeds & Bio Fertilizers', hindiName: 'कृषि बीज व खाद', description: 'Hybrid vegetable seeds, organic fertilizers, pesticides', tags: ['seeds', 'fertilizer', 'pesticide', 'agriculture', 'agro'] },
      { id: 'heavy_machinery_generators', name: 'Industrial Heavy Machinery & Solar', hindiName: 'भारी मशीनरी व सोलर', description: 'Diesel generators, solar plant inverters, processing units', tags: ['machinery', 'generator', 'solar', 'industrial plant'] },
    ]
  }
];

// Helper to find industry and subcategory by text or id
export function matchIndustryOrSubcategory(searchText: string): { industry?: IndustryHub; subcategory?: SubCategory } | null {
  if (!searchText) return null;
  const q = searchText.toLowerCase();

  for (const ind of ALL_INDUSTRIES) {
    if (ind.name.toLowerCase().includes(q) || ind.shortName.toLowerCase().includes(q) || ind.id.toLowerCase().includes(q)) {
      return { industry: ind };
    }
    for (const sub of ind.subcategories) {
      if (sub.name.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q) || sub.tags.some(t => q.includes(t) || t.includes(q))) {
        return { industry: ind, subcategory: sub };
      }
    }
  }
  return null;
}

// Flat list of all available categories for dropdowns & selectors
export const ALL_CATEGORY_OPTIONS: string[] = [
  // Tiles & Sanitary
  'Vitrified Tiles (GVT/PGVT)',
  'Ceramic & Wall Tiles',
  'Sanitaryware & EWCs',
  'Bathware & CP Fittings',
  'Granite, Marble & Slabs',
  'Tile Adhesives & Grouts',
  'Factory & Tile Machinery',
  // Textile & Garments
  "Men's Wear & Suiting",
  "Women's Ethnic & Fashion",
  'Fabrics, Yarns & Denim',
  'Kids & Baby Wear',
  'Hosiery, Undergarments & Knits',
  'School & Corporate Uniforms',
  'Sewing Machines & Loom Units',
  // Grocery & FMCG
  'Grains, Rice & Pulses (दाल/चावल)',
  'Spices & Dry Fruits (मसाले/मेवे)',
  'Edible Oils & Desi Ghee (तेल/घी)',
  'Packaged Snacks, Biscuits & Sweets',
  'Tea, Coffee & Beverages',
  'Dairy Products & Cold Storage',
  'Soaps, Detergents & Cleaning',
  // Hardware & Electrical
  'Wires, Cables & Modular Switches',
  'PVC/CPVC Pipes & Fittings',
  'Paints, Putty & Waterproofing',
  'Power Tools, Hardware & Locks',
  'TMT Steel, Sariya & Cement Bags',
  'Glass, Aluminium & Doors',
  // Packaging & Logistics
  'Corrugated Boxes & Cartons',
  'BOPP Bags, Rolls & Tapes',
  'Truck Transporters & Logistics',
  'Agro Seeds & Bio Fertilizers',
  'Industrial Heavy Machinery & Solar'
];
