"use client";

import { BarChart3, Eye, Inbox, Percent, Trophy } from "lucide-react";
import { usePanel } from "@/components/panel/store";
import { Card, DemoNote, EmptyState, KpiCard, SectionHeader } from "@/components/panel/ui/misc";
import { AreaChart, BarChart, HBarChart } from "@/components/panel/charts";

export function Stats() {
  const { ws } = usePanel();
  if (!ws.stats.length)
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Estadísticas" description="Cómo te encuentran los clientes y cuántos terminan escribiéndote." />
        <EmptyState
          icon={BarChart3}
          title="Todavía no hay métricas"
          description="Empezaremos a contar las visitas a tu perfil y las solicitudes que recibes. Vuelve en unos días para ver cómo te encuentran los clientes."
        />
      </div>
    );
  const visits = ws.stats.reduce((s, m) => s + m.visits, 0);
  const requests = ws.stats.reduce((s, m) => s + m.requests, 0);
  const conversion = visits ? (requests / visits) * 100 : 0;
  const last = ws.stats[ws.stats.length - 1];
  const prev = ws.stats[ws.stats.length - 2];
  const growth = prev?.visits ? ((last.visits - prev.visits) / prev.visits) * 100 : 0;

  // Demo weighting: requests in the panel plus a share of each service's historic interest.
  const byService = ws.services
    .map((s, i) => ({
      label: s.name,
      value: ws.requests.filter((r) => r.serviceId === s.id).length * 9 + Math.max(4, 38 - i * 11),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Estadísticas" description="Cómo te encuentran los clientes y cuántos terminan escribiéndote." />
      <DemoNote>
        <strong className="text-ink-light">Datos de demostración.</strong> Estos números son ficticios; las métricas reales llegarán cuando el panel se conecte al backend.
      </DemoNote>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard index={0} icon={Eye} label="Visitas en 12 meses" value={visits} hint={`${growth >= 0 ? "+" : ""}${growth.toFixed(0)} % el último mes`} />
        <KpiCard index={1} icon={Inbox} label="Solicitudes recibidas" value={requests} hint="En los últimos 12 meses" />
        <KpiCard index={2} icon={Percent} label="Conversión" value={conversion} format={(v) => `${v.toFixed(1)} %`} hint="Visitas que terminan en solicitud" accent />
        <KpiCard index={3} icon={Trophy} label="Servicio más consultado" value={byService[0]?.value ?? 0} hint={byService[0]?.label ?? "Sin servicios"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-general text-base font-semibold text-white">Visitas al perfil</h2>
          <p className="mb-6 mt-0.5 text-xs text-ink-mid">Evolución mensual · pasa el cursor para ver cada mes</p>
          <AreaChart
            label="Visitas al perfil por mes"
            data={ws.stats.map((m) => ({ label: m.month, value: m.visits, detail: `${((m.requests / m.visits) * 100).toFixed(1)} % de conversión` }))}
          />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-general text-base font-semibold text-white">Servicios más consultados</h2>
          <p className="mb-6 mt-0.5 text-xs text-ink-mid">Consultas por servicio en los últimos 12 meses</p>
          {byService.length ? <HBarChart label="Consultas por servicio" data={byService} /> : <p className="text-sm text-ink-mid">Crea servicios para ver esta métrica.</p>}
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-general text-base font-semibold text-white">Solicitudes recibidas</h2>
        <p className="mb-6 mt-0.5 text-xs text-ink-mid">Por mes</p>
        <BarChart label="Solicitudes por mes" data={ws.stats.map((m) => ({ label: m.month, value: m.requests, detail: `${m.visits.toLocaleString("es-BO")} visitas` }))} />
      </Card>
    </div>
  );
}
