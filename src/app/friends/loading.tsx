export default function FriendsLoading() {
  return (
    <main aria-busy="true" className="friends-page" aria-label="Loading friends">
      <div className="friends-shell">
        <div className="loading-block friends-loading-heading" />
        <div className="loading-block friends-loading-card" />
        <div className="friends-columns">
          <div className="loading-block friends-loading-card" />
          <div className="loading-block friends-loading-card" />
        </div>
      </div>
      <span className="visually-hidden" role="status">Loading your friends and requests…</span>
    </main>
  );
}
