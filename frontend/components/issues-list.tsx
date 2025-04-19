"use client"

import { useEffect, useState } from "react"
import { IssueCard } from "@/components/issue-card"

const MATCH_COLORS = ["#8b5cf6", "#ec4899", "#f97316", "#10b981", "#3b82f6"]

interface APIIssue {
  issue_id: number
  issue_url: string
  repo_url: string
  title: string
  created_at: string
  user_login: string
  labels: string[]
  similarity_score: number
  short_description: string
}

interface IssuesListProps {
  type: "recommended" | "trending" | "favorite" | "recent"
}

export function IssuesList({ type }: IssuesListProps) {
  const [issues, setIssues] = useState<APIIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const MAX_LOADING_TIME = 20000 // 20 seconds maximum loading time

    // Function to fetch data
    const fetchData = async () => {
      try {
        // Make the API call with AbortController to handle timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), MAX_LOADING_TIME)

        const response = await fetch(`http://localhost:8000/api/v1/match/match-issue?keywords=machine-learning&keywords=java&max_results=5`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        // Parse the response
        const data = await response.json()

        // Update state if component is still mounted
        if (isMounted) {
          if (data.recommendations && Array.isArray(data.recommendations)) {
            setIssues(data.recommendations)
          } else {
            setIssues([])
          }

          setLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching issues:", err)

        if (isMounted) {
          setLoading(false)

          if (err instanceof Error) {
            if (err.name === 'AbortError') {
              setError("Request timed out. The server took too long to respond.")
            } else {
              setError(`Failed to fetch issues: ${err.message}`)
            }
          } else {
            setError("Failed to fetch issues. Please try again later.")
          }
        }
      }
    }

    // Start the fetch process
    fetchData()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [type])

  return (
    <div className="grid gap-4">
      {loading ? (
        <div className="bg-[#1a1f2a] rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
          <p className="text-gray-400 text-center mt-4">
            Loading issues... This may take a moment.
          </p>
        </div>
      ) : error ? (
        <div className="bg-[#1a1f2a] rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <p className="text-gray-400 mt-2">Please check your connection and try again.</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-[#1a1f2a] rounded-lg p-6 text-center">
          <p className="text-gray-400">No matching issues found.</p>
        </div>
      ) : (
        issues.map((issue, index) => (
          <IssueCard
            key={issue.issue_id}
            issue={{
              id: issue.issue_id,
              title: issue.title,
              description: issue.short_description,
              repo: issue.repo_url.replace("https://github.com/", ""),
              skills: issue.labels.slice(0, 3),
              skillMatch: Math.round(issue.similarity_score * 100 + 55),
              matchColor: MATCH_COLORS[index % MATCH_COLORS.length],
              issueUrl: issue.issue_url,
            }}
          />
        ))
      )}
    </div>
  )
}