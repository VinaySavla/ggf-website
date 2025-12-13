import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Mail, Globe, Bell, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // In a real app, these would come from a database or config
  const settings = {
    siteName: "Godhra Graduates Forum",
    siteEmail: "admin@godhragraduatesforum.in",
    smtpHost: process.env.SMTP_HOST || "Not configured",
    smtpPort: process.env.SMTP_PORT || "Not configured",
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Site Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                defaultValue={settings.siteName}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                defaultValue={settings.siteEmail}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500">
              Contact your developer to update these settings.
            </p>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">SMTP Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                settings.smtpConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {settings.smtpConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtpHost}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Port
              </label>
              <input
                type="text"
                value={settings.smtpPort}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                disabled
              />
            </div>
            
            <p className="text-xs text-gray-500">
              Email settings are configured via environment variables.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">User Registration</p>
                <p className="text-sm text-gray-500">Send email when new user registers</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-not-allowed">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Event Registration</p>
                <p className="text-sm text-gray-500">Send confirmation on event registration</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-not-allowed">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Password Reset</p>
                <p className="text-sm text-gray-500">Send password reset emails</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-not-allowed">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Database</span>
              <span className="text-sm font-medium text-gray-900">PostgreSQL</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Framework</span>
              <span className="text-sm font-medium text-gray-900">Next.js 16</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Authentication</span>
              <span className="text-sm font-medium text-gray-900">Auth.js v5</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Environment</span>
              <span className="text-sm font-medium text-gray-900">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
