import { NextRequest, NextResponse } from 'next/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLaborItem(description: string): boolean {
  const lower = description.toLowerCase()
  return /labor|installation|install|hours|hr\b|haul|demo|removal|prep|service call/.test(lower)
}

function isMaterialItem(description: string): boolean {
  const lower = description.toLowerCase()
  return /material|supply|supplies|fixture|unit|panel|shingle|plank|tile|paint|pipe|wire|lumber|equipment/.test(lower)
}

function categorizeItem(description: string): 'labor' | 'materials' {
  if (isLaborItem(description)) return 'labor'
  if (isMaterialItem(description)) return 'materials'
  // unclear → materials
  return 'materials'
}

/** Returns true if the value looks like junk/placeholder data */
function isJunkField(value: string | undefined | null): boolean {
  if (!value) return true
  const trimmed = value.trim()
  if (!trimmed) return true
  if (/^\d+$/.test(trimmed)) return true   // only digits e.g. "123456"
  if (trimmed.length < 5) return true
  return false
}

function isEmptyField(value: string | undefined | null): boolean {
  return !value || !value.trim()
}

// ── Consumer Estimate Template ─────────────────────────────────────────────────

function buildConsumerEstimateHTML(data: Record<string, any>): string {
  const { lineItems, subtotal, tax, total, quoteNumber, jobDescription, projectLocation, clientName, clientAddress, clientEmail } = data
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Categorize line items
  let materialsTotal = 0
  let laborTotal = 0
  const detailItems: Array<{ description: string; qty: number; unitPrice: number; total: number; category: string }> = []

  for (const item of (lineItems || [])) {
    const cat = categorizeItem(item.description)
    if (cat === 'labor') {
      laborTotal += Number(item.total) || 0
    } else {
      materialsTotal += Number(item.total) || 0
    }
    detailItems.push({ ...item, category: cat })
  }

  const taxAmount = Number(tax) || 0
  const totalAmount = Number(total) || 0

  // Validate / omit junk fields
  const showClientName = !isEmptyField(clientName)
  const showLocation = !isJunkField(projectLocation || clientAddress)
  const locationValue = projectLocation || clientAddress || ''
  const showClientEmail = !isEmptyField(clientEmail)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cost Estimate ${quoteNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 3px solid #991b1b; }
  .logo { font-size: 28px; font-weight: 800; color: #991b1b; letter-spacing: -0.5px; }
  .logo-tagline { font-size: 11px; color: #9ca3af; margin-top: 3px; }
  .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .meta-title { font-size: 22px; font-weight: 700; color: #111; display: block; }
  .meta-sub { font-size: 11px; color: #991b1b; font-weight: 600; display: block; margin-top: 2px; }
  .meta-date { font-size: 11px; color: #9ca3af; display: block; margin-top: 6px; }

  /* Project info */
  .project-info { background: #fef2f2; border-left: 3px solid #991b1b; padding: 14px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
  .project-info label { font-size: 10px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.07em; display: block; margin-bottom: 6px; }
  .project-info p { font-size: 14px; color: #374151; line-height: 1.5; }
  .project-info .location { font-size: 12px; color: #6b7280; margin-top: 6px; }
  .project-info .client-detail { font-size: 12px; color: #6b7280; margin-top: 2px; }

  /* Summary cost breakdown */
  .summary-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
  .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  .summary-table tr td { padding: 12px 0; font-size: 15px; border-bottom: 1px solid #f3f4f6; }
  .summary-table tr td:last-child { text-align: right; font-weight: 600; }
  .summary-table .total-row td { font-size: 18px; font-weight: 800; color: #991b1b; border-top: 2px solid #991b1b; border-bottom: none; padding-top: 16px; }
  .summary-table .category-label { display: inline-flex; align-items: center; gap: 6px; }
  .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .cat-dot.labor { background: #2563eb; }
  .cat-dot.materials { background: #16a34a; }

  /* Detail items */
  .detail-section { margin-top: 28px; }
  .detail-toggle { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
  .detail-table { width: 100%; border-collapse: collapse; font-size: 12px; color: #6b7280; }
  .detail-table th { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
  .detail-table th:not(:first-child) { text-align: right; }
  .detail-table td { padding: 8px 0; border-bottom: 1px solid #f9fafb; color: #6b7280; }
  .detail-table td:not(:first-child) { text-align: right; }
  .detail-table .cat-badge { font-size: 10px; padding: 1px 6px; border-radius: 99px; font-weight: 600; display: inline-block; }
  .cat-badge.labor { background: #dbeafe; color: #1d4ed8; }
  .cat-badge.materials { background: #dcfce7; color: #16a34a; }

  /* Footer */
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
  .disclaimer { font-size: 11px; color: #9ca3af; line-height: 1.6; margin-bottom: 12px; }
  .cta { background: #fef2f2; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .cta-text { font-size: 13px; color: #374151; }
  .cta-link { font-size: 13px; font-weight: 700; color: #991b1b; }
  .footer-brand { text-align: center; margin-top: 16px; font-size: 11px; color: #d1d5db; }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">SnapBid</div>
      <div class="logo-tagline">AI-Powered Home Cost Estimates</div>
    </div>
    <div class="meta">
      <span class="meta-title">Cost Estimate</span>
      <span class="meta-sub">AI-generated estimate based on regional pricing data</span>
      <span class="meta-date">${date}</span>
    </div>
  </div>

  <!-- Project Info -->
  <div class="project-info">
    <label>Project Details</label>
    ${jobDescription ? `<p>${jobDescription}</p>` : ''}
    ${showLocation && !isJunkField(locationValue) ? `<p class="location">📍 ${locationValue}</p>` : ''}
    ${showClientName ? `<p class="client-detail">For: ${clientName}</p>` : ''}
    ${showClientEmail ? `<p class="client-detail">✉ ${clientEmail}</p>` : ''}
  </div>

  <!-- Summary Cost Breakdown -->
  <p class="summary-title">Estimated Cost Breakdown</p>
  <table class="summary-table">
    ${materialsTotal > 0 ? `<tr>
      <td><span class="category-label"><span class="cat-dot materials"></span>Materials &amp; Supplies</span></td>
      <td>$${materialsTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    </tr>` : ''}
    ${laborTotal > 0 ? `<tr>
      <td><span class="category-label"><span class="cat-dot labor"></span>Labor &amp; Installation</span></td>
      <td>$${laborTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    </tr>` : ''}
    ${taxAmount > 0 ? `<tr>
      <td>Tax (estimated)</td>
      <td>$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    </tr>` : ''}
    <tr class="total-row">
      <td>Total Estimate</td>
      <td>$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    </tr>
  </table>

  <!-- Detail Line Items -->
  ${detailItems.length > 0 ? `
  <div class="detail-section">
    <p class="detail-toggle">Itemized Detail</p>
    <table class="detail-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${detailItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td><span class="cat-badge ${item.category}">${item.category === 'labor' ? 'Labor' : 'Material'}</span></td>
          <td>${item.qty}</td>
          <td>$${Number(item.unitPrice).toLocaleString()}</td>
          <td>$${Number(item.total).toLocaleString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <p class="disclaimer">
      This is an AI-generated estimate based on regional averages. Actual contractor quotes may vary based on site conditions, materials chosen, and contractor rates. Always get multiple quotes from licensed contractors before starting any project.
    </p>
    <div class="cta">
      <span class="cta-text">Ready to hire? Get matched with licensed contractors →</span>
      <span class="cta-link">snapbid.app</span>
    </div>
    <p class="footer-brand">Generated by SnapBid · AI-powered home cost estimates · snapbid.app</p>
  </div>

</body>
</html>`
}

// ── Contractor Quote Template ──────────────────────────────────────────────────

function buildContractorQuoteHTML(data: Record<string, any>): string {
  const {
    businessName, trade, clientName, clientAddress, quoteNumber, lineItems, subtotal, tax, total, notes,
    phone, email, businessAddress, licenseNumber, paymentTerms, quoteValidityDays, introMessage,
    scopeOfWork, inclusions, exclusions, showMarkupOnQuote, logoUrl
  } = data

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const filteredLineItems = showMarkupOnQuote
    ? lineItems
    : (lineItems || []).filter((item: any) => !item.description.toLowerCase().includes('markup'))

  const PAYMENT_LABELS: Record<string, string> = {
    '50-deposit': '50% deposit to begin, balance on completion',
    '30-deposit': '30% deposit to begin, balance on completion',
    'on-completion': 'Full payment due on completion',
    'net-15': 'Net 15',
    'net-30': 'Net 30',
    'full-upfront': 'Full payment required upfront',
    'custom': 'As discussed',
  }
  const paymentLabel = PAYMENT_LABELS[paymentTerms] || paymentTerms || 'Net 30'
  const validDays = quoteValidityDays || 30

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Quote ${quoteNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #2563eb; }
  .logo-wrap { display: flex; align-items: center; gap: 14px; }
  .logo-img { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; }
  .logo { font-size: 22px; font-weight: 700; color: #111; }
  .logo-sub { font-size: 13px; color: #6b7280; margin-top: 2px; text-transform: capitalize; }
  .logo-contact { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.6; }
  .meta { text-align: right; font-size: 13px; color: #6b7280; }
  .meta strong { display: block; font-size: 16px; color: #111; font-weight: 700; }
  .intro { background: #f0f9ff; border-left: 3px solid #2563eb; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af; border-radius: 0 6px 6px 0; }
  .bill-to { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
  .bill-to label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .bill-to p { font-size: 14px; color: #111; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
  thead th:not(:first-child) { text-align: right; }
  tbody td { padding: 12px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  tbody td:not(:first-child) { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 240px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; padding: 4px 0; }
  .totals-row.grand { font-size: 16px; font-weight: 700; color: #111; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 6px; }
  .notes { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .notes label { font-size: 11px; font-weight: 600; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; }
  .notes p { font-size: 13px; color: #1e40af; margin-top: 4px; }
  .terms { display: flex; gap: 24px; margin-bottom: 32px; font-size: 12px; color: #6b7280; }
  .terms div { display: flex; flex-direction: column; gap: 2px; }
  .terms strong { color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
  .scope { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .scope label { font-size: 11px; font-weight: 600; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .scope ul { list-style: none; margin: 0; padding: 0; }
  .scope ul li { font-size: 13px; color: #374151; padding: 2px 0; }
  .inclusions { background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .inclusions label { font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .inclusions ul { list-style: none; margin: 0; padding: 0; }
  .inclusions ul li { font-size: 13px; color: #14532d; padding: 2px 0; }
  .exclusions { background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .exclusions label { font-size: 11px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .exclusions ul { list-style: none; margin: 0; padding: 0; }
  .exclusions ul li { font-size: 13px; color: #78350f; padding: 2px 0; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-wrap">
      ${logoUrl ? `<img class="logo-img" src="${logoUrl}" alt="${businessName} logo" />` : ''}
      <div>
        <div class="logo">${businessName}</div>
        <div class="logo-sub">${trade} Services</div>
        <div class="logo-contact">
          ${phone ? `📞 ${phone}` : ''}${phone && email ? ' &nbsp;·&nbsp; ' : ''}${email ? `✉ ${email}` : ''}<br>
          ${businessAddress ? businessAddress : ''}${businessAddress && licenseNumber ? ' &nbsp;·&nbsp; ' : ''}${licenseNumber ? `Lic. ${licenseNumber}` : ''}
        </div>
      </div>
    </div>
    <div class="meta">
      <strong>Quote ${quoteNumber}</strong>
      <span>${date}</span><br>
      <span>Valid for ${validDays} days</span>
    </div>
  </div>

  ${introMessage ? `<div class="intro">${introMessage}</div>` : ''}

  <div class="bill-to">
    <label>Prepared For</label>
    <p><strong>${clientName}</strong></p>
    <p>${clientAddress}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${filteredLineItems.map((item: any) => `
      <tr>
        <td>${item.description}</td>
        <td>${item.qty}</td>
        <td>$${item.unitPrice}</td>
        <td>$${item.total}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>$${subtotal}</span></div>
      <div class="totals-row"><span>Tax (est.)</span><span>$${tax}</span></div>
      <div class="totals-row grand"><span>Total</span><span>$${total}</span></div>
    </div>
  </div>

  ${scopeOfWork ? `<div class="scope"><label>Scope of Work</label><ul>${
    (() => {
      const rawParts = scopeOfWork.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
      const parts = rawParts.length > 1 ? rawParts : scopeOfWork.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean)
      return parts.map((s: string) => `<li>\u2192 ${s}</li>`).join('')
    })()
  }</ul></div>` : ''}

  ${inclusions && inclusions.length > 0 ? `<div class="inclusions"><label>What's Included</label><ul>${inclusions.map((s: string) => `<li>\u2713 ${s}</li>`).join('')}</ul></div>` : ''}

  ${exclusions && exclusions.length > 0 ? `<div class="exclusions"><label>Not Included</label><ul>${exclusions.map((s: string) => `<li>\u2717 ${s}</li>`).join('')}</ul></div>` : ''}

  ${notes ? `<div class="notes"><label>Notes</label><p>${notes}</p></div>` : ''}

  <div class="terms">
    <div><strong>Payment Terms</strong>${paymentLabel}</div>
    <div><strong>Quote Valid Until</strong>${new Date(Date.now() + validDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="footer">
    Generated by <span class="badge">SnapBid</span> · AI-powered quotes for contractors
  </div>
</body>
</html>`
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Template selection: consumer if no businessName set
    const isConsumerEstimate = !data.businessName

    const html = isConsumerEstimate
      ? buildConsumerEstimateHTML(data)
      : buildContractorQuoteHTML(data)

    const filename = isConsumerEstimate
      ? `estimate-${data.quoteNumber}.html`
      : `quote-${data.quoteNumber}.html`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
