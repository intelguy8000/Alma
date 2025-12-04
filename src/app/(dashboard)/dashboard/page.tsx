"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Repeat, AlertTriangle } from "lucide-react";
import {
  Scorecard,
  PatientsLineChart,
  AppointmentsBarChart,
  UpcomingAppointments,
  AtRiskPatientsModal,
} from "@/components/dashboard";

interface AtRiskPatient {
  id: string;
  fullName: string;
  phone: string | null;
  lastAppointmentDate: string;
  daysSinceLastVisit: number;
}

interface DashboardData {
  activePatients: number;
  newPatientsThisMonth: number;
  recurrentPatientsThisMonth: number;
  atRiskPatientsCount: number;
  atRiskPatientsList: AtRiskPatient[];
  atRiskDays: number;
  appointmentsData: {
    name: string;
    presenciales: number;
    virtuales: number;
    nuevos: number;
    antiguos: number;
    terapiaChoque: number;
  }[];
  patientsData: {
    day: string;
    atendidos: number;
    cancelados: number;
    proyeccion?: number;
  }[];
  tomorrowAppointments: {
    id: string;
    time: string;
    patient: string;
    type: "presencial" | "virtual" | "terapia_choque";
    status: "confirmada" | "no_responde" | "cancelada" | "reagendada" | "completada";
  }[];
  tomorrowStats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  tomorrowDateDisplay: string;
  tomorrowDateLink: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atRiskDays, setAtRiskDays] = useState(30);
  const [showAtRiskModal, setShowAtRiskModal] = useState(false);

  const loadData = useCallback(async (days: number = atRiskDays) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("atRiskDays", days.toString());

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [atRiskDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAtRiskDaysChange = (days: number) => {
    setAtRiskDays(days);
    loadData(days);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D3D35]">Dashboard</h1>
        <p className="text-[#5C7A6B] mt-1">
          Resumen de retención y frecuencia de pacientes
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Loading skeleton for scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Loading skeleton for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[350px] bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
            <div className="h-[350px] bg-[#CCE3DE]/30 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : data && (
        <>
          {/* Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Pacientes Activos */}
            <Scorecard
              title="Pacientes Activos"
              value={data.activePatients.toString()}
              subtitle="Último trimestre"
              icon={Users}
              iconColor="bg-[#6B9080]"
              bgColor="bg-[#CCE3DE]"
              textColor="text-[#3D5A4C]"
            />

            {/* 2. Nuevos Este Mes */}
            <Scorecard
              title="Nuevos Este Mes"
              value={data.newPatientsThisMonth.toString()}
              subtitle="Primera cita este mes"
              icon={UserPlus}
              iconColor="bg-[#2E7D32]"
              bgColor="bg-[#E8F5E9]"
              textColor="text-[#1B5E20]"
            />

            {/* 3. Recurrentes Este Mes */}
            <Scorecard
              title="Recurrentes"
              value={data.recurrentPatientsThisMonth.toString()}
              subtitle="2+ citas este mes"
              icon={Repeat}
              iconColor="bg-[#1565C0]"
              bgColor="bg-[#E3F2FD]"
              textColor="text-[#0D47A1]"
            />

            {/* 4. En Riesgo - Clickeable */}
            <Scorecard
              title="En Riesgo"
              value={data.atRiskPatientsCount.toString()}
              subtitle={`Sin cita en ${atRiskDays}+ días`}
              icon={AlertTriangle}
              iconColor="bg-[#C62828]"
              bgColor="bg-[#FFEBEE]"
              textColor="text-[#B71C1C]"
              clickable
              onClick={() => setShowAtRiskModal(true)}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientsLineChart data={data.patientsData} />
            <AppointmentsBarChart data={data.appointmentsData} />
          </div>

          {/* Tomorrow Appointments */}
          <UpcomingAppointments
            appointments={data.tomorrowAppointments}
            stats={data.tomorrowStats}
            dateDisplay={data.tomorrowDateDisplay}
            dateLink={data.tomorrowDateLink}
          />

          {/* At Risk Patients Modal */}
          <AtRiskPatientsModal
            isOpen={showAtRiskModal}
            onClose={() => setShowAtRiskModal(false)}
            patients={data.atRiskPatientsList}
            currentDays={atRiskDays}
            onDaysChange={handleAtRiskDaysChange}
          />
        </>
      )}
    </div>
  );
}
