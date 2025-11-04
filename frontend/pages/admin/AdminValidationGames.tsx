import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Server, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ValidationGame {
  name: string;
  api: string;
  endpoint: string;
  fullUrl: string;
  needsServer: boolean;
  status: "active" | "inactive";
  category: string;
  exampleUserId?: string;
  exampleServer?: string;
}

export default function AdminValidationGames() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const validationGames: ValidationGame[] = [
    {
      name: "Mobile Legends: Bang Bang (ID)",
      api: "Isan.eu.org",
      endpoint: "/ml",
      fullUrl: "https://api.isan.eu.org/nickname/ml?id={userId}&server={serverId}",
      needsServer: true,
      status: "active",
      category: "MOBA",
      exampleUserId: "123456789",
      exampleServer: "1234",
    },
    {
      name: "Magic Chess Go Go",
      api: "Isan.eu.org",
      endpoint: "/mcgg",
      fullUrl: "https://api.isan.eu.org/nickname/mcgg?id={userId}&server={serverId}",
      needsServer: true,
      status: "active",
      category: "Strategy",
      exampleUserId: "6722335",
      exampleServer: "4088",
    },
    {
      name: "Free Fire",
      api: "Isan.eu.org",
      endpoint: "/ff",
      fullUrl: "https://api.isan.eu.org/nickname/ff?id={userId}",
      needsServer: false,
      status: "active",
      category: "Battle Royale",
      exampleUserId: "1234567890",
    },
    {
      name: "Genshin Impact",
      api: "cek-username",
      endpoint: "/game/genshinimpact",
      fullUrl: "https://cek-username.onrender.com/game/genshinimpact?uid={userId}&zone={serverId}",
      needsServer: false,
      status: "active",
      category: "RPG",
      exampleUserId: "800000000",
      exampleServer: "os_asia",
    },
    {
      name: "Valorant",
      api: "Isan.eu.org",
      endpoint: "/valo",
      fullUrl: "https://api.isan.eu.org/nickname/valo?id={userId}",
      needsServer: false,
      status: "active",
      category: "FPS",
      exampleUserId: "username%23tag",
    },
    {
      name: "Arena of Valor",
      api: "Isan.eu.org",
      endpoint: "/aov",
      fullUrl: "https://api.isan.eu.org/nickname/aov?id={userId}",
      needsServer: false,
      status: "active",
      category: "MOBA",
      exampleUserId: "1234567890123",
    },
    {
      name: "Honkai Impact 3rd",
      api: "Isan.eu.org",
      endpoint: "/hi",
      fullUrl: "https://api.isan.eu.org/nickname/hi?id={userId}",
      needsServer: false,
      status: "active",
      category: "Action RPG",
      exampleUserId: "100000001",
    },
  ];

  const inactiveGames: ValidationGame[] = [
    {
      name: "PUBG Mobile",
      api: "Isan.eu.org",
      endpoint: "/pubgm",
      fullUrl: "https://api.isan.eu.org/nickname/pubgm?id={userId}",
      needsServer: false,
      status: "inactive",
      category: "Battle Royale",
    },
    {
      name: "Call of Duty Mobile",
      api: "Isan.eu.org",
      endpoint: "/codm",
      fullUrl: "https://api.isan.eu.org/nickname/codm?id={userId}",
      needsServer: false,
      status: "inactive",
      category: "FPS",
    },
    {
      name: "Honkai Star Rail",
      api: "Isan.eu.org",
      endpoint: "/hsr",
      fullUrl: "https://api.isan.eu.org/nickname/hsr?id={userId}",
      needsServer: false,
      status: "inactive",
      category: "RPG",
    },
    {
      name: "Zenless Zone Zero",
      api: "Isan.eu.org",
      endpoint: "/zzz",
      fullUrl: "https://api.isan.eu.org/nickname/zzz?id={userId}",
      needsServer: false,
      status: "inactive",
      category: "Action RPG",
    },
    {
      name: "Point Blank",
      api: "Isan.eu.org",
      endpoint: "/pb",
      fullUrl: "https://api.isan.eu.org/nickname/pb?id={userId}",
      needsServer: false,
      status: "inactive",
      category: "FPS",
    },
  ];

  const copyToClipboard = async (url: string, gameName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: "Link Disalin! ✓",
        description: `API endpoint untuk ${gameName} berhasil disalin`,
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      toast({
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin link ke clipboard",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url.replace("{userId}", "test").replace("{serverId}", "test"), "_blank");
  };

  const activeCount = validationGames.length;
  const inactiveCount = inactiveGames.length;
  const totalCount = activeCount + inactiveCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Validasi User ID</h1>
        <p className="text-slate-400">Daftar game yang memiliki pemeriksaan User ID/Username beserta API endpoint</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{activeCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Tidak Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-400">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Game dengan Validasi Aktif
          </CardTitle>
          <p className="text-sm text-slate-400 mt-2">
            Game-game ini memiliki pemeriksaan User ID yang aktif dan berjalan di platform
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validationGames.map((game, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{game.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-purple-600/20 text-purple-300 border-purple-600/50">
                            {game.category}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-600/50">
                            {game.api}
                          </Badge>
                          {game.needsServer && (
                            <Badge variant="outline" className="bg-orange-600/20 text-orange-300 border-orange-600/50">
                              <Server className="h-3 w-3 mr-1" />
                              Needs Server ID
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded p-3 border border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">Endpoint:</div>
                      <code className="text-sm text-green-400 break-all">{game.endpoint}</code>
                    </div>

                    <div className="bg-slate-900 rounded p-3 border border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">Full URL:</div>
                      <code className="text-xs text-cyan-400 break-all">{game.fullUrl}</code>
                    </div>

                    {game.exampleUserId && (
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold">Contoh User ID:</span>{" "}
                        <code className="text-yellow-400">{game.exampleUserId}</code>
                        {game.exampleServer && (
                          <>
                            {" | "}
                            <span className="font-semibold">Server ID:</span>{" "}
                            <code className="text-yellow-400">{game.exampleServer}</code>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(game.fullUrl, game.name)}
                      className="border-slate-600 text-white hover:bg-slate-700 w-full lg:w-auto"
                    >
                      {copiedUrl === game.fullUrl ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Salin URL
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInNewTab(game.fullUrl)}
                      className="border-slate-600 text-white hover:bg-slate-700 w-full lg:w-auto"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test API
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-slate-400" />
            Game dengan Validasi Tidak Aktif
          </CardTitle>
          <p className="text-sm text-slate-400 mt-2">
            Game-game ini memiliki API endpoint namun saat ini tidak digunakan untuk validasi
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inactiveGames.map((game, index) => (
              <div
                key={index}
                className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 opacity-60"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-slate-300 font-semibold">{game.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-slate-700/20 text-slate-400 border-slate-700/50">
                            {game.category}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-700/20 text-slate-400 border-slate-700/50">
                            {game.api}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">Endpoint:</div>
                      <code className="text-sm text-slate-400 break-all">{game.endpoint}</code>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">Full URL:</div>
                      <code className="text-xs text-slate-400 break-all">{game.fullUrl}</code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(game.fullUrl, game.name)}
                      className="border-slate-700 text-slate-400 hover:bg-slate-800 w-full lg:w-auto"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Salin URL
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/50">
        <CardHeader>
          <CardTitle className="text-white">📝 Catatan Penting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <p>
              <strong className="text-white">Server ID Required:</strong> Hanya Mobile Legends dan Magic Chess Go Go yang membutuhkan Server ID untuk validasi.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <p>
              <strong className="text-white">Genshin Impact:</strong> Server ID otomatis terdeteksi dari digit pertama UID (6=America, 7=Europe, 8=Asia, 9=TW/HK/MO).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <p>
              <strong className="text-white">Valorant:</strong> Format User ID harus menggunakan <code className="bg-slate-800 px-1 rounded text-yellow-400">username#tag</code> (karakter # akan otomatis di-encode menjadi %23).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <p>
              <strong className="text-white">Response Format:</strong> Semua API mengembalikan format JSON dengan field <code className="bg-slate-800 px-1 rounded text-green-400">success</code> dan <code className="bg-slate-800 px-1 rounded text-green-400">name</code> untuk username yang ditemukan.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <p>
              <strong className="text-white">Untuk Mengaktifkan Game Baru:</strong> Edit file <code className="bg-slate-800 px-1 rounded text-cyan-400">/frontend/pages/ProductPage.tsx</code> dan <code className="bg-slate-800 px-1 rounded text-cyan-400">/backend/validation/validate_username.ts</code> untuk menambahkan game ke whitelist.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
