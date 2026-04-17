export const DEPT_COLORS = {
  Leadership:   '#7C3AED',
  Engineering:  '#2563EB',
  Design:       '#DB2777',
  Product:      '#059669',
  Operations:   '#D97706',
  Partnerships: '#EA580C',
  Finance:      '#0891B2',
  HR:           '#DC2626',
}

export function getDeptColor(dept) {
  return DEPT_COLORS[dept] ?? '#64748B'
}

export default function OrgNode({ node, width, height }) {
  const { data, depth } = node
  const color = getDeptColor(data.department)
  const isOpen = data.is_open === 'true'
  const isRoot = depth === 0

  return (
    <div
      className={`org-node${isOpen ? ' org-node--open' : ''}${isRoot ? ' org-node--root' : ''}`}
      style={{
        position: 'absolute',
        left: node.x - width / 2,
        top: node.y,
        width,
        height,
        '--dept-color': color,
      }}
    >
      <div className="org-node__bar" />
      <div className="org-node__body">
        <div className="org-node__name" title={data.name}>{data.name}</div>
        <div className="org-node__title" title={data.title}>{data.title}</div>
        <div className="org-node__dept" style={{ color }}>{data.department}</div>
      </div>
    </div>
  )
}
