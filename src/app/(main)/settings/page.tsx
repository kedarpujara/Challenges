'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Globe, Bell, Shield, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', href: '#' },
        { icon: Globe, label: 'Timezone', href: '#' },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Push Notifications', href: '#' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & FAQ', href: '#' },
        { icon: Shield, label: 'Privacy Policy', href: '#' },
      ],
    },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {settingsSections.map(section => (
          <div key={section.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {section.title}
            </h2>
            <Card className="divide-y divide-border">
              {section.items.map(item => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              ))}
            </Card>
          </div>
        ))}

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">Challenges v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
