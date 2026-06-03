import { getDetailedMetrics } from './actions'
import { SalesByCategoryChart, BestSellersChart } from './charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'

export default async function BusinessAdminPage() {
  const data = await getDetailedMetrics()

  return (
    <div className="space-y-6 text-black">
      <header>
        <h1 className="admin-page-title">
          Metricas
        </h1>
        <p className="admin-page-kicker">
          Panel de control — Multiaccesorios
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos totales', val: `$${data.totalRevenue.toLocaleString('es-CL')}`, icon: <DollarSign className="text-red-600" size={20}/> },
          { label: 'Ordenes', val: data.orderCount, icon: <ShoppingBag className="text-red-600" size={20}/> },
          { label: 'Ticket promedio', val: `$${Math.round(data.avgOrderValue).toLocaleString('es-CL')}`, icon: <TrendingUp className="text-red-600" size={20}/> },
          { label: 'Stock critico', val: data.lowStockAlerts.length, icon: <AlertTriangle className={data.lowStockAlerts.length > 0 ? 'text-red-600 animate-pulse' : 'text-zinc-300'} size={20}/> },
        ].map((kpi, i) => (
          <Card key={i} className="bg-white border border-zinc-200 rounded-[6px] shadow-none hover:border-red-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-black text-black break-words">{kpi.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VENTAS + MAS VENDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border border-zinc-200 rounded-[6px] shadow-none">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-black">Ventas por categoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SalesByCategoryChart data={data.salesByCategory} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-[6px] shadow-none">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-black">Productos mas vendidos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <BestSellersChart data={data.bestSellers} />
          </CardContent>
        </Card>
      </div>

      {/* STOCK CRITICO */}
      <Card className="bg-white border border-red-200 rounded-[6px] shadow-none overflow-hidden">
        <CardHeader className="bg-red-600">
          <CardTitle className="text-white flex items-center gap-2 uppercase font-black tracking-widest text-sm">
            <AlertTriangle size={16} fill="white" className="text-red-600"/> Stock critico — menos de 5 unidades
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.lowStockAlerts.length > 0 ? (
            <div className="divide-y divide-red-50">
              {data.lowStockAlerts.map((prod, i) => (
                <div key={i} className="flex justify-between items-center py-3 px-4 hover:bg-red-50 transition-colors">
                  <div>
                    <span className="font-bold text-black text-sm uppercase">{prod.name}</span>
                    {prod.category && (
                      <span className="ml-2 text-xs text-zinc-400 uppercase tracking-widest">{prod.category}</span>
                    )}
                  </div>
                  <span className="font-black text-red-600 text-xs bg-red-50 px-3 py-1 border border-red-200">
                    {prod.stock} uds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-400 text-sm italic">Todo el stock esta saludable</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
