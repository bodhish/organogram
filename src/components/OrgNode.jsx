const PALETTE = [
  '#7C3AED', '#2563EB', '#DB2777', '#059669',
  '#D97706', '#EA580C', '#0891B2', '#DC2626',
  '#0D9488', '#9333EA', '#65A30D', '#BE185D',
]

function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getDeptColor(dept) {
  if (!dept) return '#64748B'
  return PALETTE[hashStr(dept) % PALETTE.length]
}

export default function OrgNode({ node, width, height, onToggle }) {
  const { data } = node
  const color = getDeptColor(data.department)
  const isOpen = data.is_open === 'true'
  const isRoot = node.isRoot ?? node.depth === 0

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
      {onToggle && (
        <button
          className={`node-toggle${node.isCollapsed ? ' node-toggle--collapsed' : ''}`}
          onClick={e => { e.stopPropagation(); onToggle(node.id) }}
          title={node.isCollapsed ? 'Expand' : 'Collapse'}
        >
          {node.isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  )
}
