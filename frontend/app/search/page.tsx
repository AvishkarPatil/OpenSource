"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ExternalLink, AlertCircle, Search } from "lucide-react"

interface GitHubIssue {
  id: number
  html_url: string
  title: string
  repository_url: string
  user: {
    login: string
  }
  state: string
  created_at: string
}

interface SearchResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubIssue[]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""

  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!query) return

    const fetchIssues = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`http://localhost:8000/api/v1/github/search/issues?query=${encodeURIComponent(query)}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data: SearchResponse = await response.json()
        setIssues(data.items || [])
        setTotalCount(data.total_count || 0)
      } catch (err) {
        console.error("Error fetching search results:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch search results")
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
  }, [query])

  // Function to extract owner/repo from repository_url
  const getRepoPath = (repoUrl: string) => {
    // Repository URL format: https://api.github.com/repos/owner/repo
    const parts = repoUrl.split('/')
    if (parts.length >= 5) {
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
    }
    return "Unknown repository"
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Search Results</h1>
        <div className="flex items-center gap-2 text-gray-400">
          <Search className="h-4 w-4" />
          <p>
            {loading ? "Searching..." :
             `Found ${totalCount} issues matching "${query}"`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1a1f2a] rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#1a1f2a] rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-gray-400">Please try a different search or check your connection.</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-[#1a1f2a] rounded-lg p-6 text-center">
          <p className="text-gray-400">No issues found matching "{query}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-[#1a1f2a] rounded-lg p-4 hover:bg-[#242a38] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-white hover:text-purple-400 transition-colors"
                  >
                    {issue.title}
                  </a>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-purple-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  issue.state === 'open' ? 'bg-green-900 text-green-300' : 'bg-purple-900 text-purple-300'
                }`}>
                  {issue.state}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-400 mb-2">
                <span className="text-gray-300 font-medium">{getRepoPath(issue.repository_url)}</span>
                <span className="mx-2">•</span>
                <span>Opened by {issue.user.login}</span>
                <span className="mx-2">•</span>
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}