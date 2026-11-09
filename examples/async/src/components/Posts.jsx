export default function Posts({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.objectID}>{post.title}</li>
      ))}
    </ul>
  )
}
