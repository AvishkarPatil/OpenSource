import httpx
import base64
import asyncio
from fastapi import HTTPException, status
from typing import Dict, List, Optional, Set, Any

# Base URL for GitHub API
GITHUB_API_URL = "https://api.github.com"

async def get_user_profile(token: str) -> Dict[str, Any]:
    """
    Fetches the authenticated user's GitHub profile.
    """
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        response = await client.get(f"{GITHUB_API_URL}/user", headers=headers)
        response.raise_for_status()
        return response.json()

async def get_user_repos(token: str) -> List[Dict[str, Any]]:
    """
    Fetches the authenticated user's repositories.
    """
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        response = await client.get(f"{GITHUB_API_URL}/user/repos", headers=headers)
        response.raise_for_status()
        return response.json()

async def search_issues(token: str, query: str) -> Dict[str, Any]:
    """
    Searches for issues on GitHub.
    """
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        params = {"q": query}
        response = await client.get(f"{GITHUB_API_URL}/search/issues", headers=headers, params=params)
        response.raise_for_status()
        return response.json()

# --- Helper function to fetch a single README ---
async def _fetch_readme_content(repo_url: str, headers: Dict[str, str], client: httpx.AsyncClient) -> Optional[str]:
    """Fetches and decodes README content for a single repo."""
    readme_url = f"{repo_url}/readme"
    try:
        readme_resp = await client.get(readme_url, headers=headers, timeout=10.0) # Add timeout
        if readme_resp.status_code == 404:
            return None
        readme_resp.raise_for_status()
        readme_data = readme_resp.json()

        if readme_data.get("encoding") == "base64" and readme_data.get("content"):
            try:
                decoded_content = base64.b64decode(readme_data["content"]).decode('utf-8', errors='ignore')
                cleaned_content = ' '.join(decoded_content.split())
                return cleaned_content
            except Exception as decode_err:
                print(f"Error decoding README for {repo_url}: {decode_err}")
                return None
        return None
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code != 404:
            print(f"HTTP error fetching README {repo_url}: {exc}")
        return None
    except Exception as exc:
        print(f"Error fetching README {repo_url}: {exc}")
        return None

# --- Main function to get profile text data ---
async def get_profile_text_data(token: str, max_repos_for_readme: int = 7) -> Dict[str, List[str] | str]:
    """
    Fetches repository data (languages, topics, descriptions) and
    README content for a user's top repositories using their GitHub token.

    Args:
        token: The user's GitHub OAuth access token.
        max_repos_for_readme: Max number of recent repos to fetch READMEs for.

    Returns:
        A dictionary containing lists of languages, topics, and a
        single string blob of combined descriptions and README content.
    """
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="GitHub token not found")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    # Fetch repos sorted by push date, limit page size
    repos_url = f"{GITHUB_API_URL}/user/repos?sort=pushed&per_page=30"

    languages: Set[str] = set()
    topics: Set[str] = set()
    descriptions: List[str] = []
    readme_tasks = []

    async with httpx.AsyncClient() as client:
        try:
            repo_response = await client.get(repos_url, headers=headers, timeout=15.0)
            repo_response.raise_for_status()
            repos_data = repo_response.json()

            if not isinstance(repos_data, list):
                 print(f"Warning: Unexpected repo data format: {repos_data}")
                 repos_data = []

            # Process repos and create tasks to fetch READMEs in parallel
            for i, repo in enumerate(repos_data):
                 if not isinstance(repo, dict): continue

                 lang = repo.get("language")
                 if lang:
                     languages.add(lang.lower())

                 repo_topics = repo.get("topics", [])
                 if repo_topics:
                     topics.update([topic.lower() for topic in repo_topics])

                 desc = repo.get("description")
                 if desc:
                     descriptions.append(desc)

                 # Schedule README fetch for top N repos
                 if i < max_repos_for_readme and repo.get("url"):
                     readme_tasks.append(_fetch_readme_content(repo['url'], headers, client))

            # --- Fetch READMEs concurrently ---
            readme_contents = []
            if readme_tasks:
                results = await asyncio.gather(*readme_tasks) # Run fetch tasks in parallel
                readme_contents = [content for content in results if content] # Filter out None results

        except httpx.HTTPStatusError as exc:
            detail = f"GitHub API error fetching repos: {exc.response.status_code}"
            if exc.response.status_code == 401: detail = "GitHub token invalid or expired."
            elif exc.response.status_code == 403: detail = "GitHub API rate limit likely exceeded or token lacks permissions."
            raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to GitHub API: {exc}") from exc
        except Exception as exc:
            print(f"Unexpected error fetching GitHub data: {exc}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred fetching GitHub data.") from exc

    # --- Combine Text ---
    text_blob = "\n".join(descriptions + readme_contents)
    max_length = 15000 # Increased limit slightly for more context
    text_blob = text_blob[:max_length]

    # Return unique languages, topics, and the combined text
    return {
        "languages": sorted(list(languages)),
        "topics": sorted(list(topics)),
        "text_blob": text_blob,
    }