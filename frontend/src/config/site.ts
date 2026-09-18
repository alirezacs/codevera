export const site = {
  name: "Codevera",
  description:
    "Thoughtfully designed websites. Carefully engineered for what comes next.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};
export const navigation = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];
export const services = [
  {
    title: "Website design",
    text: "A clear identity, intuitive journeys, and the small details that make a website feel considered.",
    tags: "UX strategy · UI design · Design systems",
  },
  {
    title: "Web development",
    text: "Fast, accessible websites built with care, from the first component to the final interaction.",
    tags: "Corporate websites · Frontend · Landing pages",
  },
  {
    title: "Custom applications",
    text: "Purpose-built tools that fit the way your business works. Simple on the surface, capable underneath.",
    tags: "Full-stack development · Integrations · Web apps",
  },
  {
    title: "Refinement & support",
    text: "Keep your website working at its best as your business grows and your needs change.",
    tags: "Performance · Accessibility · Ongoing support",
  },
];
export const processSteps = [
  [
    "Discover",
    "We listen first. Your business, your audience, and what a successful project needs to achieve.",
  ],
  [
    "Define",
    "We turn the brief into a clear scope, a sensible structure, and a shared direction.",
  ],
  [
    "Design",
    "We work through the experience and visual details, with your feedback at every milestone.",
  ],
  [
    "Develop",
    "We build a responsive, maintainable website with performance and accessibility in mind.",
  ],
  [
    "Refine",
    "We test real journeys, check devices, and give the details a final, careful pass.",
  ],
  [
    "Launch",
    "We help you go live with confidence, hand over the essentials, and plan ongoing support.",
  ],
];
