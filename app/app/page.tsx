import { Suspense } from 'react';
import { SimulatorShell } from '@/components/simulator/simulator-shell';

export default function AppRoutePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<SimulatorShell />
		</Suspense>
	);
}
