import { useNavigate } from 'react-router-dom'
import { useOrderFlow } from '../context/OrderFlowContext'

export default function OrderBreadcrumb({ currentStep }) {
  const navigate = useNavigate()
  const { vehicleType, brand, model, variant, resetFlow } = useOrderFlow()

  const crumbs = [
    {
      label: vehicleType?.name,
      onClick: () => { resetFlow(); navigate('/order/vehicle-type') },
      show: !!vehicleType,
    },
    {
      label: brand?.name,
      onClick: () => navigate('/order/brand'),
      show: !!brand,
    },
    {
      label: model
        ? `${model.name}${variant ? ' ' + variant.emission_standard : ''}`
        : null,
      onClick: () => navigate('/order/model'),
      show: !!model && currentStep !== 'model',
    },
  ]

  const visibleCrumbs = crumbs.filter(c => c.show)
  if (visibleCrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm flex-wrap mb-4">
      {visibleCrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 mx-1">›</span>}
          <span
            onClick={crumb.onClick}
            className="text-blue-500 hover:text-blue-700 cursor-pointer hover:underline">
            {crumb.label}
          </span>
        </span>
      ))}
    </div>
  )
}
