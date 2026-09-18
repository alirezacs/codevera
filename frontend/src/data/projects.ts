export type Project = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  year: string;
  featured: boolean;
  featuredImage: string;
  services: string[];
  technologies: string[];
  challenge: string;
  solution: string;
  outcome: string;
  demo: boolean;
  projectType?: string;
  gallery?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }[];
};
