"use client"

import { useState } from "react"
import { Code, ThumbsDown, ThumbsUp } from "lucide-react"
import { motion } from "framer-motion"

interface Issue {
  id: number
  title: string
  repo: string
  description: string
  skillMatch: number
  skills: string[]
  matchColor: string
  issueUrl: string
}

interface IssueCardProps {
  issue: Issue
}

export function IssueCard({ issue }: IssueCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isInterested, setIsInterested] = useState(null as boolean | null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const getMatchColorClass = () => {
    if (issue.skillMatch >= 90) return "bg-purple-600"
    if (issue.skillMatch >= 80) return "bg-purple-500"
    if (issue.skillMatch >= 70) return "bg-pink-500"
    return "bg-orange-500"
  }

  const handleContribute = () => {
    setIsAnimating(true)
    setIsInterested(true)
    setTimeout(() => setIsAnimating(false), 600)
  }

  const handleNotInterested = () => {
    setIsAnimating(true)
    setIsInterested(false)
    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <div
      className={`bg-[#1a1f2a] rounded-lg overflow-hidden transition-all duration-300 ${
        isHovered ? "shadow-lg shadow-purple-900/20 translate-y-[-2px]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        {/* Title & Skill Match */}
        <div className="flex items-center justify-between mb-3">
          <a
            href={issue.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-medium text-white hover:text-purple-400 transition-colors truncate max-w-[75%]"
          >
            {issue.title}
          </a>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getMatchColorClass()} transition-all duration-500`}
                style={{ width: `${issue.skillMatch}%` }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: issue.matchColor }}>
              {issue.skillMatch}%
            </span>
          </div>
        </div>

        {/* Repo URL */}
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{issue.repo}</span>
        </div>

        {/* Description */}
        <p
          className={`text-gray-400 mb-4 transition-all duration-300 cursor-pointer ${
            isExpanded ? "" : "line-clamp-2"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {issue.description}
        </p>

        {/* Skills + Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {issue.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-[#242a38] text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isInterested === true
                  ? "bg-purple-600 text-white"
                  : "bg-[#242a38] text-gray-400 hover:bg-purple-600/20 hover:text-purple-400"
              }`}
              onClick={handleContribute}
              whileTap={{ scale: 0.95 }}
              animate={
                isAnimating && isInterested === true
                  ? { scale: [1, 1.1, 1], transition: { duration: 0.4 } }
                  : {}
              }
            >
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                Contribute
              </span>
            </motion.button>

            <motion.button
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isInterested === false
                  ? "bg-red-600 text-white"
                  : "bg-[#242a38] text-gray-400 hover:bg-red-600/20 hover:text-red-400"
              }`}
              onClick={handleNotInterested}
              whileTap={{ scale: 0.95 }}
              animate={
                isAnimating && isInterested === false
                  ? { scale: [1, 1.1, 1], transition: { duration: 0.4 } }
                  : {}
              }
            >
              <span className="flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4" />
                Not Interested
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Hover Gradient Underline */}
      <div
        className={`h-1 w-full transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
        style={{
          background: `linear-gradient(to right, ${issue.matchColor}, #8b5cf6)`,
        }}
      />
    </div>
  )
}
