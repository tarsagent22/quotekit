// Trade template cache — pre-seeded line item templates for the 15 most common trades.
// Used to (1) seed AI prompts with realistic line items for better output,
// (2) serve as a fallback cache if the AI call fails.

export type LineItemTemplate = {
  description: string
  qty: string
  unitPriceMultiplier: number // multiplied by contractor's hourly rate
  type: 'labor' | 'material' | 'flat'
}

export type TradeTemplate = {
  trade: string
  aliases: string[]
  commonJobs: {
    name: string
    description: string
    lineItems: LineItemTemplate[]
    notes: string
  }[]
}

export const TRADE_TEMPLATES: TradeTemplate[] = [
  {
    trade: 'Plumbing',
    aliases: ['plumber', 'plumbing contractor'],
    commonJobs: [
      {
        name: 'Faucet replacement',
        description: 'Remove and replace existing faucet with customer-supplied or contractor-supplied unit',
        lineItems: [
          { description: 'Labor — faucet removal and installation', qty: '1.5 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Shut-off valves (pair)', qty: '1', unitPriceMultiplier: 0.4, type: 'material' },
          { description: 'Supply lines and fittings', qty: '1', unitPriceMultiplier: 0.2, type: 'material' },
        ],
        notes: 'Customer to supply faucet unless noted otherwise. Includes testing and cleanup.'
      },
      {
        name: 'Water heater replacement',
        description: 'Remove old water heater, install new unit, connect gas/electric and water lines',
        lineItems: [
          { description: 'Labor — removal and installation', qty: '3 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Water heater (50 gal)', qty: '1', unitPriceMultiplier: 4, type: 'material' },
          { description: 'Expansion tank', qty: '1', unitPriceMultiplier: 0.6, type: 'material' },
          { description: 'Permit and inspection', qty: '1', unitPriceMultiplier: 1.2, type: 'flat' },
        ],
        notes: 'Old unit hauled away. Permit included in price.'
      }
    ]
  },
  {
    trade: 'Electrical',
    aliases: ['electrician', 'electrical contractor'],
    commonJobs: [
      {
        name: 'Outlet installation',
        description: 'Install new electrical outlet — includes running wire if needed',
        lineItems: [
          { description: 'Labor — outlet installation', qty: '2 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Outlet, box, and cover plate', qty: '1', unitPriceMultiplier: 0.15, type: 'material' },
          { description: 'Wire and connectors', qty: '1', unitPriceMultiplier: 0.2, type: 'material' },
        ],
        notes: 'GFCI outlet where required by code. Permit may be required — not included unless specified.'
      },
      {
        name: 'Panel upgrade',
        description: 'Replace existing electrical panel with new higher-capacity unit',
        lineItems: [
          { description: 'Labor — panel removal and installation', qty: '8 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: '200A panel and breakers', qty: '1', unitPriceMultiplier: 8, type: 'material' },
          { description: 'Permit and inspection', qty: '1', unitPriceMultiplier: 3, type: 'flat' },
        ],
        notes: 'Utility company coordination may add lead time. Final inspection included.'
      }
    ]
  },
  {
    trade: 'Roofing',
    aliases: ['roofer', 'roofing contractor'],
    commonJobs: [
      {
        name: 'Shingle replacement (full)',
        description: 'Remove existing shingles, inspect and repair decking, install new shingles',
        lineItems: [
          { description: 'Tear-off and disposal', qty: '1', unitPriceMultiplier: 2, type: 'labor' },
          { description: 'Labor — installation', qty: '1', unitPriceMultiplier: 3, type: 'labor' },
          { description: 'Architectural shingles (30yr)', qty: '1', unitPriceMultiplier: 5, type: 'material' },
          { description: 'Ice & water shield, felt, ridge cap', qty: '1', unitPriceMultiplier: 1.5, type: 'material' },
          { description: 'Flashings and drip edge', qty: '1', unitPriceMultiplier: 0.8, type: 'material' },
        ],
        notes: 'Includes complete cleanup and magnet sweep. Warranty per manufacturer specs.'
      }
    ]
  },
  {
    trade: 'Painting',
    aliases: ['painter', 'painting contractor', 'interior painting', 'exterior painting'],
    commonJobs: [
      {
        name: 'Interior room painting',
        description: 'Paint walls and ceiling of a standard room — prep, prime, and two coats',
        lineItems: [
          { description: 'Labor — prep, prime, and paint', qty: '4 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Paint — walls (2 coats)', qty: '1 gal', unitPriceMultiplier: 0.4, type: 'material' },
          { description: 'Primer', qty: '1 gal', unitPriceMultiplier: 0.3, type: 'material' },
          { description: 'Supplies (tape, drop cloths, rollers, brushes)', qty: '1', unitPriceMultiplier: 0.2, type: 'material' },
        ],
        notes: 'Customer to move furniture. Minor drywall repairs included. Color changes may require additional coats.'
      }
    ]
  },
  {
    trade: 'HVAC',
    aliases: ['hvac contractor', 'heating and cooling', 'ac repair'],
    commonJobs: [
      {
        name: 'AC unit installation',
        description: 'Install new central air conditioning unit — includes outdoor condenser and indoor air handler',
        lineItems: [
          { description: 'Labor — installation and commissioning', qty: '6 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'AC unit (3 ton)', qty: '1', unitPriceMultiplier: 12, type: 'material' },
          { description: 'Refrigerant lines and fittings', qty: '1', unitPriceMultiplier: 1.5, type: 'material' },
          { description: 'Permit and inspection', qty: '1', unitPriceMultiplier: 2, type: 'flat' },
        ],
        notes: 'Includes 1 year labor warranty. Equipment manufacturer warranty separate.'
      }
    ]
  },
  {
    trade: 'Carpentry',
    aliases: ['carpenter', 'trim carpenter', 'finish carpenter'],
    commonJobs: [
      {
        name: 'Trim and molding installation',
        description: 'Install baseboards, door casing, and crown molding throughout',
        lineItems: [
          { description: 'Labor — measure, cut, and install', qty: '6 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Baseboard molding (linear ft)', qty: '1', unitPriceMultiplier: 0.5, type: 'material' },
          { description: 'Door casing sets', qty: '1', unitPriceMultiplier: 0.4, type: 'material' },
          { description: 'Nails, caulk, and finish supplies', qty: '1', unitPriceMultiplier: 0.15, type: 'material' },
        ],
        notes: 'Includes nail holes filled and caulked. Paint/stain by others unless specified.'
      }
    ]
  },
  {
    trade: 'Flooring',
    aliases: ['flooring contractor', 'floor installer', 'tile', 'hardwood'],
    commonJobs: [
      {
        name: 'Hardwood floor installation',
        description: 'Install engineered or solid hardwood flooring — includes subfloor prep',
        lineItems: [
          { description: 'Labor — prep and installation', qty: '1', unitPriceMultiplier: 3, type: 'labor' },
          { description: 'Hardwood flooring (sq ft)', qty: '1', unitPriceMultiplier: 4, type: 'material' },
          { description: 'Underlayment and moisture barrier', qty: '1', unitPriceMultiplier: 0.5, type: 'material' },
          { description: 'Transitions and reducer strips', qty: '1', unitPriceMultiplier: 0.3, type: 'material' },
        ],
        notes: 'Includes removal of existing flooring. Subfloor repairs billed separately if needed.'
      }
    ]
  },
  {
    trade: 'Landscaping',
    aliases: ['landscaper', 'lawn care', 'hardscaping'],
    commonJobs: [
      {
        name: 'Lawn cleanup and mulching',
        description: 'Spring/fall cleanup, trim shrubs, edge beds, apply fresh mulch',
        lineItems: [
          { description: 'Labor — cleanup and install', qty: '4 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Mulch (cubic yards)', qty: '1', unitPriceMultiplier: 0.8, type: 'material' },
          { description: 'Debris disposal', qty: '1', unitPriceMultiplier: 0.6, type: 'flat' },
        ],
        notes: 'Mulch depth approximately 3 inches. Weed barrier installation available as add-on.'
      }
    ]
  },
  {
    trade: 'Drywall',
    aliases: ['drywall contractor', 'sheetrock', 'drywall repair'],
    commonJobs: [
      {
        name: 'Drywall repair (medium)',
        description: 'Patch and finish drywall damage — holes, cracks, or water damage',
        lineItems: [
          { description: 'Labor — patch, tape, mud, sand', qty: '3 hrs', unitPriceMultiplier: 1, type: 'labor' },
          { description: 'Drywall, joint compound, tape', qty: '1', unitPriceMultiplier: 0.4, type: 'material' },
          { description: 'Primer coat', qty: '1', unitPriceMultiplier: 0.1, type: 'material' },
        ],
        notes: 'Ready for paint after work is complete. Paint matching not included.'
      }
    ]
  },
  {
    trade: 'Concrete',
    aliases: ['concrete contractor', 'concrete work', 'flatwork'],
    commonJobs: [
      {
        name: 'Concrete driveway (new)',
        description: 'Excavate, form, pour, and finish concrete driveway',
        lineItems: [
          { description: 'Labor — form, pour, and finish', qty: '1', unitPriceMultiplier: 5, type: 'labor' },
          { description: 'Concrete (cubic yards)', qty: '1', unitPriceMultiplier: 4, type: 'material' },
          { description: 'Rebar and wire mesh', qty: '1', unitPriceMultiplier: 1, type: 'material' },
          { description: 'Excavation and gravel base', qty: '1', unitPriceMultiplier: 2, type: 'labor' },
          { description: 'Saw cuts for control joints', qty: '1', unitPriceMultiplier: 0.5, type: 'labor' },
        ],
        notes: 'Standard 4-inch thickness. Sealer available as add-on.'
      }
    ]
  },
]

// Get template hints for a given trade to inject into AI prompt
export function getTradeHints(trade: string): string {
  const normalized = trade.toLowerCase()
  const template = TRADE_TEMPLATES.find(t =>
    t.trade.toLowerCase() === normalized ||
    t.aliases.some(a => normalized.includes(a) || a.includes(normalized))
  )
  if (!template) return ''
  const jobs = template.commonJobs.map(j =>
    `- ${j.name}: ${j.lineItems.map(li => li.description).join(', ')}`
  ).join('\n')
  return `\nCommon ${template.trade} line items for reference:\n${jobs}`
}
