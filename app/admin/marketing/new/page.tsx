import MarketingBannerForm from '../MarketingBannerForm'

export default function NewMarketingBannerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="admin-page-title">Agregar banner</h1>
        <p className="admin-page-kicker">Programa una campaña para home o tienda.</p>
      </div>
      <MarketingBannerForm />
    </div>
  )
}
