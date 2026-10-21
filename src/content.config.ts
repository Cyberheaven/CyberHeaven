import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Field names here must stay in sync with public/admin/config.yml (the CMS form).
const articles = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    date: z.coerce.date(),
    // The file name (without .md) of a person in src/content/people.
    author: reference("people"),
    excerpt: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false), // not in the CMS (it has its own review workflow); set it in the file to hide a published article
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Only used by the About page (src/pages/about.astro).
    heading: z.string().optional(),
    storyHeading: z.string().optional(),
    waysHeading: z.string().optional(),
    ways: z.array(z.object({ name: z.string(), sub: z.string(), text: z.string(), href: z.string() })).default([]),
  }),
});

// Team members, authors and supporters. One Markdown file each; the body is their bio.
const people = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    headline: z.string().default(""),
    pronouns: z.string().default(""),
    avatar: z.string().default(""),
    // Role names from src/data/categories.json "roles" (e.g. Maintainer, Author, Supporter).
    roles: z.array(z.string()).default([]),
    location: z.string().default(""),
    // The CMS saves a cleared date as '', so treat that as "not set".
    joined: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    // Past members stay on the team page under "With thanks".
    alumni: z.boolean().default(false),
  }),
});

export const collections = { articles, pages, people };
