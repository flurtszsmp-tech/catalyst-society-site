import type { Metadata } from 'next';
import { ProjectsSection } from '@/components/passport/sections/ProjectsSection';
import '@/styles/passport-sections.css';

export const metadata: Metadata = { title: 'Projek' };

export default function ProjectsPage() {
  return <ProjectsSection />;
}
