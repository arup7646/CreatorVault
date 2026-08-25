import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  HardDrive, 
  Search, 
  Tag, 
  Star, 
  ArrowRight, 
  Check,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Archive,
  Globe,
  Lock,
  Zap,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/helpers';

const features = [
  {
    icon: Search,
    title: 'Powerful Search',
    description: 'Find any asset instantly with global search across projects, file names, tags, and descriptions.',
  },
  {
    icon: Tag,
    title: 'Smart Organization',
    description: 'Organize with projects, tags, favorites, and custom metadata. Filter and sort your way.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, encrypted storage, audit logs, and secure authentication.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles (Owner, Editor, Viewer), and work together seamlessly.',
  },
  {
    icon: HardDrive,
    title: 'Flexible Storage',
    description: 'Support for images, videos, audio, PDFs, documents, and archives. Preview in browser.',
  },
  {
    icon: Star,
    title: 'Favorites & Activity',
    description: 'Bookmark important assets, track changes with activity logs, and restore deleted files.',
  },
];

const fileTypes = [
  { icon: FileImage, label: 'Images', types: 'JPG, PNG, WebP, GIF', color: 'text-green-500' },
  { icon: FileVideo, label: 'Videos', types: 'MP4, WebM', color: 'text-blue-500' },
  { icon: FileAudio, label: 'Audio', types: 'MP3, WAV', color: 'text-purple-500' },
  { icon: FileText, label: 'Documents', types: 'PDF, DOCX, TXT', color: 'text-red-500' },
  { icon: Archive, label: 'Archives', types: 'ZIP', color: 'text-yellow-500' },
];

const stats = [
  { value: '100+', label: 'File Types Supported' },
  { value: 'Unlimited', label: 'Projects & Assets' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '256-bit', label: 'Encryption' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">CreatorVault</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign in</Link>
            <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
                Your Digital Assets.<br />
                <span className="text-primary-600 dark:text-primary-400">One Secure Workspace.</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Organize, search, and collaborate on all your creative files. 
                Images, videos, documents, and more—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Start Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                No credit card required · 14-day free trial · Cancel anytime
              </p>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything you need to manage creative assets
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Built for designers, developers, marketers, and creative teams who need a better way to organize their work.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} hover className="h-full">
                  <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Support for all your file types
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Preview, organize, and manage every type of creative asset in one place.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {fileTypes.map((type, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <type.icon className={cn('h-8 w-8', type.color)} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{type.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.types}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Built for teams of all sizes
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Whether you're a solo creator or a large organization, CreatorVault scales with you.
                  Granular permissions, shared projects, and activity tracking keep everyone in sync.
                </p>
                <div className="space-y-4">
                  {[
                    'Role-based access control (Owner, Editor, Viewer)',
                    'Project invitations with email notifications',
                    'Real-time activity logs and audit trails',
                    'Shared projects with member management',
                    'Bulk operations for efficient workflows',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Design Team</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">8 members · 24 projects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Marketing</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">5 members · 12 projects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Developers</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">12 members · 45 projects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-primary-600 dark:bg-primary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to organize your creative work?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust CreatorVault for their digital asset management.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">CreatorVault</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your digital assets. One secure workspace.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#features" className="hover:text-primary-600 dark:hover:text-primary-400">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400">Pricing</Link></li>
                <li><Link href="#integrations" className="hover:text-primary-600 dark:hover:text-primary-400">Integrations</Link></li>
                <li><Link href="#api" className="hover:text-primary-600 dark:hover:text-primary-400">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#about" className="hover:text-primary-600 dark:hover:text-primary-400">About</Link></li>
                <li><Link href="#blog" className="hover:text-primary-600 dark:hover:text-primary-400">Blog</Link></li>
                <li><Link href="#careers" className="hover:text-primary-600 dark:hover:text-primary-400">Careers</Link></li>
                <li><Link href="#contact" className="hover:text-primary-600 dark:hover:text-primary-400">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy</Link></li>
                <li><Link href="#terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms</Link></li>
                <li><Link href="#security" className="hover:text-primary-600 dark:hover:text-primary-400">Security</Link></li>
                <li><Link href="#cookies" className="hover:text-primary-600 dark:hover:text-primary-400">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; 2024 CreatorVault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}