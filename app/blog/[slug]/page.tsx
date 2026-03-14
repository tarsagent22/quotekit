import { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

function getPost(slug: string) {
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { frontmatter: data, content }
}

function getAllSlugs(): string[] {
  const blogDir = path.join(process.cwd(), 'content/blog')
  if (!fs.existsSync(blogDir)) return []
  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}

/**
 * Parse markdown content to extract H2 sections as FAQ Q&A pairs.
 * Each H2 heading becomes the question; the first non-empty paragraph
 * immediately following it becomes the answer.
 */
function extractFaqEntries(content: string): Array<{ question: string; answer: string }> {
  const lines = content.split('\n')
  const entries: Array<{ question: string; answer: string }> = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // Match H2 headings (## but not ###)
    const h2Match = line.match(/^##\s+(.+)$/)
    if (h2Match) {
      const question = h2Match[1].trim()
      // Find the first non-empty paragraph after this heading
      let answer = ''
      let j = i + 1
      while (j < lines.length) {
        const candidate = lines[j].trim()
        // Stop at the next heading
        if (candidate.startsWith('#')) break
        // Skip blank lines until we find content
        if (candidate.length > 0 && !candidate.startsWith('#')) {
          // Skip sub-headings (###), blockquote markers, table rows, list items for cleaner answers
          if (!candidate.startsWith('###') && !candidate.startsWith('|') && !candidate.startsWith('>') && !candidate.startsWith('-') && !candidate.startsWith('*') && !candidate.startsWith('1.')) {
            answer = candidate
              .replace(/\*\*/g, '')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .trim()
            break
          } else if (candidate.startsWith('>')) {
            // Use blockquote text as answer if nothing else
            answer = candidate.replace(/^>\s*\*?\*?/, '').replace(/\*\*/g, '').trim()
            break
          } else {
            // For list items, use the first one as a short answer
            answer = candidate.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
            break
          }
        }
        j++
      }
      if (question && answer) {
        entries.push({ question, answer })
      }
    }
    i++
  }

  return entries
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Not Found' }
  const { frontmatter } = post
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    authors: [{ name: frontmatter.author || 'SnapBid' }],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: 'article',
      publishedTime: frontmatter.date,
      authors: [frontmatter.author || 'SnapBid'],
      siteName: 'SnapBid',
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.description,
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const { frontmatter, content } = post
  const htmlContent = await marked(content)

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    dateModified: frontmatter.date,
    author: {
      '@type': 'Organization',
      name: 'SnapBid',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SnapBid',
      url: 'https://snapbid.app',
    },
    url: `https://snapbid.app/blog/${slug}`,
    keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords.join(', ') : frontmatter.keywords,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://snapbid.app/blog/${slug}`,
    },
  }

  // FAQPage schema — built from H2 sections
  const faqEntries = extractFaqEntries(content)
  const faqSchema = faqEntries.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      }
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--background, #faf8f5)' }}>
      {/* Article Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* FAQPage Schema JSON-LD */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Header */}
      <header className="bg-[#faf8f5] border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.svg" alt="SnapBid" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← All guides
            </Link>
            <Link href="/" className="text-sm bg-[#991b1b] hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Get estimate
            </Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Meta */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-[#991b1b] bg-red-50 px-2.5 py-1 rounded-full">
              Cost Guide
            </span>
            <span className="text-xs text-gray-400">{frontmatter.readTime}</span>
            {frontmatter.date && (
              <span className="text-xs text-gray-400">
                {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
            {frontmatter.title}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {frontmatter.description}
          </p>
        </div>

        {/* CTA inline */}
        <div className="bg-[#1C1917] rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white text-sm font-semibold">Get an instant cost estimate</p>
            <p className="text-stone-400 text-xs mt-0.5">For your specific project and location</p>
          </div>
          <Link href="/" className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#991b1b] hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
            Try it free →
          </Link>
        </div>

        {/* Body */}
        <article
          className="prose prose-gray prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-[#991b1b] prose-a:no-underline hover:prose-a:underline max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="bg-gradient-to-br from-[#1C1917] to-[#2d2520] rounded-2xl p-8 text-center text-white">
            <div className="text-3xl mb-3">🏠</div>
            <h2 className="text-xl font-bold mb-2">Ready to check your project cost?</h2>
            <p className="text-stone-400 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
              Enter your project details and get a free itemized estimate calibrated to your city.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#991b1b] hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg">
              Get my free estimate →
            </Link>
            <p className="text-stone-500 text-xs mt-3">Free · No account required · Results in seconds</p>
          </div>
        </div>
      </main>

    </div>
  )
}
