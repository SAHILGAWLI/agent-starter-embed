import { Button } from '@/components/ui/button';

type WelcomeViewProps = {
  disabled: boolean;
  onStartCall: () => void;
};

export const WelcomeView = ({
  disabled,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} inert={disabled} className="absolute inset-0">
      <div className="flex h-full items-center justify-center px-3">
        <div
          className="w-80 rounded-full overflow-hidden"
          style={{ boxShadow: '0 0 0 2px #38BDF8' }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onStartCall}
            className="w-full h-12 rounded-none font-mono bg-transparent hover:bg-transparent focus:bg-transparent text-black"
            style={{
              background:
                'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.6), transparent 70%), linear-gradient(135deg, #e7f5ff 0%, #74c0fc 100%)',
            }}
          >
            Chat with Agent
          </Button>
        </div>
      </div>
    </div>
  );
};
