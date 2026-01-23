export const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  summary
}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  summary,
  image,
  body
}`

export const postSlugsQuery = `*[_type == "post"] {
  "slug": slug.current
}`
