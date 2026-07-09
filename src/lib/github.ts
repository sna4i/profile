import fallback from '../data/github-stats.json';
import type { GithubStats, LanguageStat } from '../types';

/** GitHub Linguist convention colors for the languages this profile uses. */
const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5',
  HTML: '#e34c26',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Astro: '#ff5a03',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
};
const DEFAULT_COLOR = '#9CA3AF';

interface RawSnapshot {
  username: string;
  publicRepos: number;
  memberSinceYear: number;
  languages: { name: string; count: number }[];
}

/** Shape a raw snapshot into the display model: percentages, colors, years. */
function shape(raw: RawSnapshot, source: 'live' | 'fallback'): GithubStats {
  const total = raw.languages.reduce((sum, l) => sum + l.count, 0) || 1;
  const languages: LanguageStat[] = [...raw.languages]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((l) => ({
      name: l.name,
      count: l.count,
      percent: Math.round((l.count / total) * 100),
      color: LANG_COLORS[l.name] ?? DEFAULT_COLOR,
    }));

  const currentYear = new Date().getFullYear();
  return {
    username: raw.username,
    profileUrl: `https://github.com/${raw.username}`,
    publicRepos: raw.publicRepos,
    memberSinceYear: raw.memberSinceYear,
    yearsOnGithub: currentYear - raw.memberSinceYear,
    languages,
    source,
  };
}

/**
 * Fetch public GitHub stats at build time. Falls back to a committed snapshot
 * (src/data/github-stats.json) on any failure so the build never breaks and
 * the widget always renders.
 */
export async function getGithubStats(username: string): Promise<GithubStats> {
  try {
    const headers = {
      'User-Agent': `${username}-profile-site`,
      Accept: 'application/vnd.github+json',
    };
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    ]);
    if (!userRes.ok || !reposRes.ok) {
      throw new Error(`GitHub API returned ${userRes.status} / ${reposRes.status}`);
    }
    const user = await userRes.json();
    const repos: { language: string | null }[] = await reposRes.json();

    const counts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1;
    }

    return shape(
      {
        username,
        publicRepos: user.public_repos,
        memberSinceYear: new Date(user.created_at).getFullYear(),
        languages: Object.entries(counts).map(([name, count]) => ({ name, count })),
      },
      'live',
    );
  } catch (error) {
    console.warn(`[github] live fetch failed, using snapshot fallback: ${error}`);
    return shape(fallback as RawSnapshot, 'fallback');
  }
}
