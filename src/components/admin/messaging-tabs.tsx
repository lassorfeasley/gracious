'use client';

import { useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface MessagingTab {
  value: string;
  label: string;
  content: ReactNode;
}

export function MessagingTabs({ tabs }: { tabs: MessagingTab[] }) {
  const [value, setValue] = useState(tabs[0]?.value);

  return (
    <Tabs value={value} onValueChange={setValue} className="w-full">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-8 pt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
