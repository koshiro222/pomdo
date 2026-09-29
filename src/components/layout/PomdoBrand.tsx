import { LuTimer } from 'react-icons/lu'
import { messages } from '../../messages'

export function PomdoBrand() {
  return <span className="brand"><span className="brand-mark"><LuTimer size={16} aria-hidden="true" /></span><span>{messages.brand}</span></span>
}
