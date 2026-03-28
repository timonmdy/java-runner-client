interface Props {
  onClick: () => void;
}

export function FolderBtn({ onClick }: Props) {
  return (
    <button onClick={onClick} className="text-text-muted hover:text-accent transition-colors">
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1 3.5h4l1.5 2H13v7H1V3.5z" />
      </svg>
    </button>
  );
}
