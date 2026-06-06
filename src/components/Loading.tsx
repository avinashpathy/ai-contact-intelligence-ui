export default function Loading() {

  return (
    <div
      className="status-message status-message--loading"
      role="status"
      aria-live="polite"
    >
      <span
        className="spinner"
        aria-hidden="true"
      />
      Searching contacts...
    </div>
  );
}
