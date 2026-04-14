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
    footer: string;
  };
}
