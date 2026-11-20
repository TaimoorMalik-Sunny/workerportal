import { Metadata } from 'next';
import { RoleGateway } from '@/components/gateway/RoleGateway';

export const metadata: Metadata = {
  title: 'HEC Portal Gateway | Higher Education Commission Pakistan',
  description:
    'Digital Degree Verification & Attestation Ecosystem - Unified National Academic Accreditation & Biometric Scrutiny Gateway',
};

/**
 * Role-Segregated Landing Page (/)
 * Official HEC Portal Gateway with interactive role selection for evaluator simulation.
 */
export default function HomePage() {
  return <RoleGateway />;
}
