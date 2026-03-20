// AdminModal component - to be implemented in Task 2 of plan 06-01

export interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'list' | 'add' | 'edit'
}

export function AdminModal({ isOpen, onClose, mode }: AdminModalProps) {
  // Placeholder implementation
  return null
}
