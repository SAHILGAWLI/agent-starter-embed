import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useVoiceAssistant } from '@livekit/components-react';
import { PhoneDisconnectIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const AnimatedButton = motion.create(Button);

interface TriggerProps {
  error: boolean;
  popupOpen: boolean;
  onToggle: () => void;
}

export function Trigger({ error = false, popupOpen, onToggle }: TriggerProps) {
  const { state: agentState } = useVoiceAssistant();

  const isAgentConnecting = agentState === 'connecting' || agentState === 'initializing';
  const isAgentConnected =
    popupOpen &&
    agentState !== 'disconnected' &&
    agentState !== 'connecting' &&
    agentState !== 'initializing';

  // Compute inner circle style: explicit red glow when error, cyan outline when idle/connecting
  const innerStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (error) {
      return {
        backgroundColor: '#ef4444',
        boxShadow: '0 0 0 2px #ef4444, 0 0 14px 4px rgba(239,68,68,0.35)',
      };
    }
    if (agentState === 'disconnected' || isAgentConnecting) {
      return {
        background:
          'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.6), transparent 70%), linear-gradient(135deg, #e7f5ff 0%, #74c0fc 100%)',
        boxShadow: isAgentConnecting ? '0 0 0 2px rgba(56,189,248,0.35)' : '0 0 0 2px #38BDF8',
      };
    }
    return undefined;
  }, [error, agentState, isAgentConnecting]);

  return (
    <AnimatePresence>
      <AnimatedButton
        key="trigger-button"
        size="lg"
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        exit={{ scale: 0 }}
        transition={{
          type: 'spring',
          duration: 1,
          bounce: 0.2,
        }}
        onClick={onToggle}
        className={cn(
          'relative m-0 block size-12 p-0 drop-shadow-md',
          // keep wrapper neutral so our custom ring stays consistent
          'order-0 bg-transparent outline-none hover:border-transparent hover:bg-transparent hover:shadow-none focus:border-transparent focus:bg-transparent focus:shadow-none focus-visible:border-transparent focus-visible:ring-0',
          'scale-100 transition-[scale] duration-300 hover:scale-105 focus:scale-105',
          'fixed right-4 bottom-4 z-50'
        )}
      >
        {/* ring */}
        <motion.div
          className={cn(
            'absolute inset-0 z-10 rounded-full transition-colors',
            !error &&
              isAgentConnecting &&
              'bg-fgAccent/30 animate-spin [background-image:conic-gradient(from_0deg,transparent_0%,transparent_30%,var(--color-fgAccent)_50%,transparent_70%,transparent_100%)] [--color-fgAccent:#38BDF8]',
            // Hide the ring entirely when disconnected; border will be drawn by inner circle shadow
            !error && agentState === 'disconnected' && 'hidden',
            (error || isAgentConnected) && 'bg-destructive-foreground'
          )}
        />
        {/* inner circle (also draws neon border via outer box-shadow when disconnected) */}
        <div
          className={cn(
            'absolute z-20 grid place-items-center overflow-hidden rounded-full transition-colors',
            isAgentConnecting ? 'inset-[2px]' : 'inset-0',
            (error || isAgentConnected) && 'bg-destructive'
          )}
          style={innerStyle}
        >
          <AnimatePresence>
            {!error && isAgentConnected && (
              <motion.div
                key="disconnect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: popupOpen ? -20 : 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <PhoneDisconnectIcon
                  size={20}
                  weight="bold"
                  className="text-destructive-foreground size-5"
                />
              </motion.div>
            )}
            {!error && agentState === 'disconnected' && (
              <motion.div
                key="custom-initial"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: popupOpen ? 20 : -20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex size-11 items-center justify-center">
                  <span
                    className="leading-none font-extrabold text-black"
                    style={{ fontSize: 32, transform: 'translateY(-1px)' }}
                  >
                    R
                  </span>
                </div>
              </motion.div>
            )}
            {(error || isAgentConnecting) && (
              <motion.div
                key="dismiss"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: popupOpen ? -20 : 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <XIcon
                  size={20}
                  weight="bold"
                  className={cn(
                    'size-5',
                    // show black while loading so it stands out on light gradient in dark mode
                    isAgentConnecting ? 'text-black' : 'text-fg0',
                    error && 'text-white'
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedButton>
    </AnimatePresence>
  );
}
