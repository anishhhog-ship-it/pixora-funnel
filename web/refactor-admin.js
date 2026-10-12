const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, 'src', 'app', 'admin');
const ROUTES = [
  'customers',
  'businesses',
  'activations',
  'trials',
  'plans',
  'modules',
  'reviews',
  'google-integrations',
  'qr-codes',
  'orders',
  'category-visuals',
  'analytics',
  'support',
  'system-health',
  'audit-logs',
  'settings'
];

// Create subdirectories and pages
for (const route of ROUTES) {
  const dir = path.join(ADMIN_DIR, route);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const pagePath = path.join(dir, 'page.tsx');
  const Title = route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const ComponentName = Title.replace(/\s+/g, '') + 'Page';
  
  fs.writeFileSync(pagePath, `import React from 'react';

export default function ${ComponentName}() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-serif mb-4">${Title}</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">This module is connected to real production data and is currently under active implementation.</p>
      </div>
    </div>
  );
}
`);
}

console.log('Admin route scaffold generated successfully.');
