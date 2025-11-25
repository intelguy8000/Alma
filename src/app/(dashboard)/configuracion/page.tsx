"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, CreditCard, MapPin, Bell } from "lucide-react";
import { GeneralSettings } from "@/components/configuracion/GeneralSettings";
import { BankAccountsSettings } from "@/components/configuracion/BankAccountsSettings";
import { LocationsSettings } from "@/components/configuracion/LocationsSettings";
import { NotificationsSettings } from "@/components/configuracion/NotificationsSettings";
import type { OrganizationSettings, BankAccount, Location, GeneralSettingsFormData } from "@/types/settings";
import { SETTINGS_KEYS } from "@/types/settings";
import { cn } from "@/lib/utils";

type TabType = "general" | "bank_accounts" | "locations" | "notifications";

const tabs = [
  { id: "general" as TabType, label: "General", icon: Settings },
  { id: "bank_accounts" as TabType, label: "Cuentas Bancarias", icon: CreditCard },
  { id: "locations" as TabType, label: "Ubicaciones", icon: MapPin },
  { id: "notifications" as TabType, label: "Notificaciones", icon: Bell },
];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/bank-accounts?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/locations?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchBankAccounts(), fetchLocations()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchBankAccounts, fetchLocations]);

  const handleSaveGeneralSettings = async (data: GeneralSettingsFormData) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
          settings: {
            [SETTINGS_KEYS.DEFAULT_APPOINTMENT_VALUE]: data.defaultAppointmentValue,
          },
        }),
      });

      if (response.ok) {
        setSaveMessage("Configuración guardada exitosamente");
        setTimeout(() => setSaveMessage(null), 3000);
        fetchSettings();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Error al guardar la configuración");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D3D35]">Configuración</h1>
        <p className="text-[#5C7A6B]">Administra las configuraciones de tu consultorio</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "p-4 rounded-lg",
          saveMessage.includes("Error")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        )}>
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#F6FFF8] rounded-lg border border-[#CCE3DE] overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#CCE3DE] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-[#6B9080] border-b-2 border-[#6B9080] bg-white"
                    : "text-[#5C7A6B] hover:text-[#3D5A4C] hover:bg-[#CCE3DE]/20"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-[#CCE3DE]/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "general" && (
                <GeneralSettings
                  organization={organization}
                  settings={settings}
                  onSave={handleSaveGeneralSettings}
                />
              )}
              {activeTab === "bank_accounts" && (
                <BankAccountsSettings
                  bankAccounts={bankAccounts}
                  onRefresh={fetchBankAccounts}
                />
              )}
              {activeTab === "locations" && (
                <LocationsSettings
                  locations={locations}
                  onRefresh={fetchLocations}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsSettings />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
