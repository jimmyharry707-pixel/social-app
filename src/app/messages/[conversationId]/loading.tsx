export default function ConversationLoading() {
  return (
    <main aria-busy="true" className="messages-page" aria-label="Loading conversation">
      <div className="loading-block chat-loading" />
      <span className="visually-hidden" role="status">Loading conversation…</span>
    </main>
  );
}
