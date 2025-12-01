'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Package, Monitor, Smartphone, FileArchive } from 'lucide-react';
import Link from 'next/link';

interface DownloadFile {
  name: string;
  platform: 'macOS' | 'Windows' | 'Linux' | 'iOS' | 'Android';
  version: string;
  size: string;
  url: string;
  description?: string;
  date?: string;
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadFile[]>([]);

  useEffect(() => {
    // Fetch available downloads
    // In a real app, you'd fetch this from an API or file system
    const availableDownloads: DownloadFile[] = [
      {
        name: 'We Quack for macOS (ARM64)',
        platform: 'macOS',
        version: '0.1.0',
        size: '3.2 MB',
        url: '/downloads/We Quack_0.1.0_aarch64.dmg',
        description: 'Tauri build - Optimized for Apple Silicon (M1/M2/M3)',
        date: new Date().toLocaleDateString(),
      },
      {
        name: 'We Quack for macOS (Intel)',
        platform: 'macOS',
        version: '0.1.0',
        size: '292 MB',
        url: '/downloads/We Quack-0.1.0-arm64.dmg',
        description: 'Electron build - Compatible with Intel and Apple Silicon',
        date: new Date().toLocaleDateString(),
      },
    ];

    setDownloads(availableDownloads);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'macOS':
        return <Monitor className="h-5 w-5" />;
      case 'Windows':
        return <Monitor className="h-5 w-5" />;
      case 'Linux':
        return <Monitor className="h-5 w-5" />;
      case 'iOS':
        return <Smartphone className="h-5 w-5" />;
      case 'Android':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'macOS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Windows':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'Linux':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Download We Quack</h1>
          <p className="text-muted-foreground text-lg">
            Get the latest version of We Quack for your platform
          </p>
        </div>

        <div className="space-y-6">
          {downloads.length > 0 ? (
            downloads.map((download, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPlatformColor(download.platform)}`}>
                        {getPlatformIcon(download.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{download.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Version {download.version} • {download.size}
                          {download.date && ` • Released ${download.date}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(download.url, download.name)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                {download.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{download.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileArchive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No downloads available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon for new releases!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Installation Instructions</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>macOS:</strong> Download the DMG file, open it, and drag We Quack to your Applications folder.</p>
            <p><strong>Windows:</strong> Download the MSI or EXE installer and follow the installation wizard.</p>
            <p><strong>Linux:</strong> Download the AppImage or DEB package and install using your package manager.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

