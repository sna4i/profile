export type Locale = 'ja' | 'en';

export interface Profile {
  name: string;
  titles: string[];
  tagline: string;
  about: {
    description: string;
    experience: {
      period: string;
      title: string;
      detail: string;
    }[];
  };
  skills: Record<string, string[]>;
  projects: {
    name: string;
    description: string;
    tags: string[];
    repoUrl?: string;
    liveUrl?: string;
  }[];
  links: {
    name: string;
    url: string;
    icon: string;
  }[];
  ui: {
    welcome: string;
    sections: {
      about: string;
      skills: string;
      projects: string;
      links: string;
    };
    projectLinks: {
      repo: string;
      live: string;
    };
    github: GithubLabels;
    footer: string;
  };
}

export interface LanguageStat {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export interface GithubStats {
  username: string;
  profileUrl: string;
  publicRepos: number;
  memberSinceYear: number;
  yearsOnGithub: number;
  languages: LanguageStat[];
  source: 'live' | 'fallback';
}

export interface GithubLabels {
  heading: string;
  repos: string;
  years: string;
  sincePrefix: string;
  languages: string;
}
