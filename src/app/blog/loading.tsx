export default function BlogLoading() {
  return (
    <main aria-busy="true" className="blog-page" aria-label="Loading blog">
      <div className="loading-block blog-loading" />
      <span className="visually-hidden" role="status">Loading post…</span>
    </main>
  );
}
