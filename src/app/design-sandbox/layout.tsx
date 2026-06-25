import { Instrument_Serif } from 'next/font/google';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${instrumentSerif.variable}`}>
      {children}
    </div>
  );
}
