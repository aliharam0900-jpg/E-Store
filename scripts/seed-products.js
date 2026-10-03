import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching category mappings from Supabase...");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug, name");

  if (catError || !categories) {
    console.error("Failed to fetch categories:", catError);
    process.exit(1);
  }

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.slug] = c.id;
  });

  console.log("Available categories:", catMap);

  const productsToSeed = [
    {
      title: "Articulated Cargo Trousers",
      slug: "articulated-cargo-trousers",
      description:
        "Reinforced ripstop trousers featuring magnetic Fidlock tensioners, water-repellent DWR coating, and laser-cut modular pocket compartments. Engineered for unrestricted articulation and all-weather tactical utility.",
      base_price: 220.0,
      compare_at_price: 260.0,
      category_id: catMap["trousers"],
      is_published: true,
      seo_title: "Articulated Cargo Trousers | Monolith Technical Pants",
      seo_description: "Durable tactical cargo trousers engineered with ergonomic articulation.",
      variants: [
        { sku: "ACT-BLK-S", size: "S", color: "Obsidian", inventory_count: 12, price_adjustment: 0 },
        { sku: "ACT-BLK-M", size: "M", color: "Obsidian", inventory_count: 24, price_adjustment: 0 },
        { sku: "ACT-BLK-L", size: "L", color: "Obsidian", inventory_count: 18, price_adjustment: 0 },
        { sku: "ACT-CHR-M", size: "M", color: "Charcoal", inventory_count: 15, price_adjustment: 0 },
        { sku: "ACT-CHR-L", size: "L", color: "Charcoal", inventory_count: 10, price_adjustment: 0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000",
          alt_text: "Articulated Cargo Trousers Studio Front",
          display_order: 0,
        },
        {
          image_url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000",
          alt_text: "Articulated Cargo Trousers Detail Pocket",
          display_order: 1,
        },
      ],
    },
    {
      title: "Titanium Chronograph Artifact 01",
      slug: "titanium-chronograph-artifact-01",
      description:
        "Machined grade-5 aerospace titanium chronograph with anti-reflective sapphire crystal lens, Swiss automatic movement, and interchangeable fluororubber and titanium link straps. Pressure-tested and water-resistant to 200 meters.",
      base_price: 495.0,
      compare_at_price: 580.0,
      category_id: catMap["accessories"],
      is_published: true,
      seo_title: "Titanium Chronograph Artifact 01 | Monolith Timepieces",
      seo_description: "Machined grade-5 aerospace titanium timepiece with sapphire crystal.",
      variants: [
        { sku: "TCA-RAW-42", size: "42mm", color: "Raw Titanium", inventory_count: 8, price_adjustment: 0 },
        { sku: "TCA-DLC-42", size: "42mm", color: "DLC Matte Black", inventory_count: 6, price_adjustment: 35.0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000",
          alt_text: "Titanium Chronograph Artifact 01 Front View",
          display_order: 0,
        },
        {
          image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000",
          alt_text: "Titanium Chronograph Bezel & Crown Close-up",
          display_order: 1,
        },
      ],
    },
    {
      title: "Ultra-High Molecular Weight Modular Bag",
      slug: "ultra-high-molecular-modular-bag",
      description:
        "Constructed from Dyneema composite fabric with bonded waterproof taped seams and German-engineered Fidlock magnetic fasteners. Modular laser-cut MOLLE attachment matrix accommodates customized tactical EDC add-ons.",
      base_price: 195.0,
      compare_at_price: 240.0,
      category_id: catMap["accessories"],
      is_published: true,
      seo_title: "Modular Technical Bag | Monolith Equipment",
      seo_description: "Ultra-lightweight, abrasion-proof Dyneema utility pack.",
      variants: [
        { sku: "UHM-BAG-18-BLK", size: "18L", color: "Stealth Black", inventory_count: 14, price_adjustment: 0 },
        { sku: "UHM-BAG-18-GRY", size: "18L", color: "Graphite", inventory_count: 9, price_adjustment: 0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000",
          alt_text: "Dyneema Modular Utility Bag Front View",
          display_order: 0,
        },
        {
          image_url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=1000",
          alt_text: "Modular Utility Bag Strap Detail",
          display_order: 1,
        },
      ],
    },
    {
      title: "Japanese Loopwheel Heavyweight Hoodie",
      slug: "japanese-loopwheel-heavyweight-hoodie",
      description:
        "Slow-knit 500gsm loopwheel cotton jersey crafted without tension for supreme lifetime shape retention. Bonded ergonomic hood construction, articulated raglan sleeves, and custom matte anodized eyelets.",
      base_price: 185.0,
      compare_at_price: null,
      category_id: catMap["outerwear"],
      is_published: true,
      seo_title: "Japanese Loopwheel Heavyweight Hoodie | Monolith Apparel",
      seo_description: "500gsm seamless loopwheel cotton hoodie engineered in Japan.",
      variants: [
        { sku: "JLH-OBS-S", size: "S", color: "Obsidian", inventory_count: 15, price_adjustment: 0 },
        { sku: "JLH-OBS-M", size: "M", color: "Obsidian", inventory_count: 22, price_adjustment: 0 },
        { sku: "JLH-OBS-L", size: "L", color: "Obsidian", inventory_count: 18, price_adjustment: 0 },
        { sku: "JLH-GRY-M", size: "M", color: "Heather Gray", inventory_count: 16, price_adjustment: 0 },
        { sku: "JLH-GRY-L", size: "L", color: "Heather Gray", inventory_count: 12, price_adjustment: 0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000",
          alt_text: "Japanese Loopwheel Hoodie Front",
          display_order: 0,
        },
        {
          image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000",
          alt_text: "Loopwheel Cotton Weave Texture",
          display_order: 1,
        },
      ],
    },
    {
      title: "Ventile Storm Insulated Parka",
      slug: "ventile-storm-insulated-parka",
      description:
        "Extreme-condition outerwear crafted from 100% organic dense-weave Ventile cotton that seals naturally upon moisture contact. Filled with ultra-light PrimaLoft Gold down-alternative insulation and featuring dual storm storm-flaps.",
      base_price: 460.0,
      compare_at_price: 520.0,
      category_id: catMap["outerwear"],
      is_published: true,
      seo_title: "Ventile Storm Parka | Weatherproof Outerwear",
      seo_description: "Dense-weave weatherproof storm parka for extreme environments.",
      variants: [
        { sku: "VSP-OLV-M", size: "M", color: "Dark Olive", inventory_count: 10, price_adjustment: 0 },
        { sku: "VSP-OLV-L", size: "L", color: "Dark Olive", inventory_count: 8, price_adjustment: 0 },
        { sku: "VSP-BLK-M", size: "M", color: "Onyx", inventory_count: 14, price_adjustment: 0 },
        { sku: "VSP-BLK-L", size: "L", color: "Onyx", inventory_count: 11, price_adjustment: 0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000",
          alt_text: "Ventile Storm Parka Back & Hood Detail",
          display_order: 0,
        },
        {
          image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000",
          alt_text: "Storm Parka Waterproof Membrane",
          display_order: 1,
        },
      ],
    },
    {
      title: "Aerospace Anodized Magnetic Belt",
      slug: "aerospace-anodized-magnetic-belt",
      description:
        "Mil-spec high-tenacity nylon webbing with CNC-machined aircraft aluminum buckle featuring a German Fidlock V-buckle magnetic latching system. Tested to 1,200 kg tensile breaking strength.",
      base_price: 85.0,
      compare_at_price: 105.0,
      category_id: catMap["accessories"],
      is_published: true,
      seo_title: "Anodized Magnetic Belt | Monolith Accessories",
      seo_description: "CNC aircraft aluminum buckle with magnetic Fidlock closure.",
      variants: [
        { sku: "AAMB-BLK-OS", size: "One Size", color: "Matte Black", inventory_count: 35, price_adjustment: 0 },
        { sku: "AAMB-GUN-OS", size: "One Size", color: "Gunmetal", inventory_count: 28, price_adjustment: 0 },
      ],
      images: [
        {
          image_url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000",
          alt_text: "Aerospace Magnetic Belt Clasp Detail",
          display_order: 0,
        },
      ],
    },
  ];

  for (const item of productsToSeed) {
    console.log(`\nUpserting product: "${item.title}"...`);

    // 1. Insert product
    const { data: product, error: pError } = await supabase
      .from("products")
      .upsert(
        {
          title: item.title,
          slug: item.slug,
          description: item.description,
          base_price: item.base_price,
          compare_at_price: item.compare_at_price,
          category_id: item.category_id,
          is_published: item.is_published,
          seo_title: item.seo_title,
          seo_description: item.seo_description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (pError || !product) {
      console.error(`Error inserting product "${item.title}":`, pError);
      continue;
    }

    console.log(`✓ Product saved: ${product.id}`);

    // 2. Clear old variants and insert fresh
    await supabase.from("product_variants").delete().eq("product_id", product.id);

    const variantsData = item.variants.map((v) => ({
      product_id: product.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      inventory_count: v.inventory_count,
      price_adjustment: v.price_adjustment,
    }));

    const { error: vError } = await supabase
      .from("product_variants")
      .insert(variantsData);

    if (vError) {
      console.error(`Error inserting variants for "${item.title}":`, vError);
    } else {
      console.log(`✓ Variants inserted: ${variantsData.length} records`);
    }

    // 3. Clear old images and insert fresh
    await supabase.from("product_images").delete().eq("product_id", product.id);

    const imagesData = item.images.map((img) => ({
      product_id: product.id,
      image_url: img.image_url,
      alt_text: img.alt_text,
      display_order: img.display_order,
    }));

    const { error: iError } = await supabase
      .from("product_images")
      .insert(imagesData);

    if (iError) {
      console.error(`Error inserting images for "${item.title}":`, iError);
    } else {
      console.log(`✓ Images inserted: ${imagesData.length} records`);
    }
  }

  console.log("\nAll products seeded successfully into Supabase!");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
