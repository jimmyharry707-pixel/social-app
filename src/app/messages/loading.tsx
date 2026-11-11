export default function MessagesLoading() {
  return (
    <main aria-busy="true" className="messages-page" aria-label="Loading messages">
      <div className="loading-block messages-loading" />
      <span className="visually-hidden" role="status">Loading your conversations…</span>
    </main>
  );
}
