type GoogleMapsButtonProps = {
  onOpenDialog: () => void;
  disabled: boolean;
};

export function GoogleMapsButton({
  onOpenDialog,
  disabled,
}: GoogleMapsButtonProps) {
  return (
    <button onClick={onOpenDialog} disabled={disabled}>
      Google Maps で開く
    </button>
  );
}
