interface Props {
  message: string;
}

export default function ErrorMessage({
  message
}: Props) {

  return (
    <div
      className="status-message status-message--error"
      role="alert"
    >
      {message}
    </div>
  );
}
