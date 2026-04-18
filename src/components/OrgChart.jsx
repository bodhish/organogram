import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { stratify } from 'd3-hierarchy'
import OrgNode, { getDeptColor } from './OrgNode'

export const NODE_W = 170
export const NODE_H = 78
const H_GAP = 14
const V_GAP = 60
const MAX_ROWS = 2

function expandRows(rows) {
  const out = []
  rows.forEach(row => {
    const m = row.name.match(/^(\d+)[×x]\s*/i)
    if (m) {
      const count = parseInt(m[1])
      for (let i = 1; i <= count; i++)
        out.push({ ...row, id: `${row.id}_${i}`, name: 'Open Position', is_open: 'true' })
    } else {
      out.push(row)
    }
  })
  return out
}

function resolveChildCols(node, n) {
  if (node.id === VIRTUAL_ROOT_ID) return n
  const dataCols = parseInt(node.data?.cols)
  if (!isNaN(dataCols) && dataCols > 0) return Math.min(dataCols, n)
  return n <= 3 ? n : Math.max(Math.ceil(n / MAX_ROWS), 1)
}

// Bottom-up: compute bounding box of each subtree
function computeSize(node) {
  if (!node.children?.length) {
    node._size = { w: NODE_W, h: NODE_H }
    return
  }
  node.children.forEach(computeSize)

  const n = node.children.length
  const cols = resolveChildCols(node, n)
  const numRows = Math.ceil(n / cols)
  let maxW = NODE_W
  let totalH = NODE_H + V_GAP

  for (let r = 0; r < numRows; r++) {
    const slice = node.children.slice(r * cols, Math.min((r + 1) * cols, n))
    const rowW = slice.reduce((s, c) => s + c._size.w + H_GAP, -H_GAP)
    const rowH = Math.max(...slice.map(c => c._size.h))
    maxW = Math.max(maxW, rowW)
    totalH += rowH + (r < numRows - 1 ? V_GAP : 0)
  }

  node._size = { w: maxW, h: totalH }
}

// Top-down: assign center x and top y to every node
function assignPositions(node, cx, y) {
  node.x = cx
  node.y = y
  if (!node.children?.length) return

  const n = node.children.length
  const cols = resolveChildCols(node, n)
  const numRows = Math.ceil(n / cols)
  let rowY = y + NODE_H + V_GAP

  for (let r = 0; r < numRows; r++) {
    const slice = node.children.slice(r * cols, Math.min((r + 1) * cols, n))
    const rowW = slice.reduce((s, c) => s + c._size.w + H_GAP, -H_GAP)
    const rowH = Math.max(...slice.map(c => c._size.h))
    let childCX = cx - rowW / 2
    slice.forEach(child => {
      assignPositions(child, childCX + child._size.w / 2, rowY)
      childCX += child._size.w + H_GAP
    })
    rowY += rowH + V_GAP
  }
}

const VIRTUAL_ROOT_ID = '__vroot__'

function buildChart(rows, collapsedIds = new Set(), allByManager = {}) {
  const expanded = expandRows(rows)
  const rootRows = expanded.filter(r => !r.manager_id)
  const multiRoot = rootRows.length > 1

  const data = multiRoot
    ? [
        { id: VIRTUAL_ROOT_ID, name: '', title: '', department: '', manager_id: '', is_open: 'false' },
        ...expanded.map(r => r.manager_id ? r : { ...r, manager_id: VIRTUAL_ROOT_ID }),
      ]
    : expanded

  const root = stratify()
    .id(d => d.id)
    .parentId(d => d.manager_id || null)(data)

  computeSize(root)
  assignPositions(root, 0, 0)

  // When a virtual root exists, shift all real nodes up so they start at y=0
  if (multiRoot) {
    const shift = NODE_H + V_GAP
    root.each(n => { if (n.id !== VIRTUAL_ROOT_ID) n.y -= shift })
  }

  let minX = Infinity, maxX = -Infinity, maxY = -Infinity
  root.each(n => {
    if (n.id === VIRTUAL_ROOT_ID) return
    minX = Math.min(minX, n.x - NODE_W / 2)
    maxX = Math.max(maxX, n.x + NODE_W / 2)
    maxY = Math.max(maxY, n.y + NODE_H)
  })

  const pad = 48
  const offsetX = -minX + pad
  const w = maxX - minX + pad * 2
  const h = maxY + pad * 2

  const nodes = [], links = []

  root.each(n => {
    if (n.id === VIRTUAL_ROOT_ID) return
    nodes.push({
      ...n,
      x: n.x + offsetX,
      y: n.y + pad,
      isRoot: n.depth === 0 || (multiRoot && n.depth === 1),
      hasChildren: !!(allByManager[n.id] || n.children?.length),
      isCollapsed: collapsedIds.has(n.id),
    })
  })

  root.links().forEach(({ source: s, target: t }) => {
    if (s.id === VIRTUAL_ROOT_ID) return
    const sx = s.x + offsetX
    const sy = s.y + pad + NODE_H
    const tx = t.x + offsetX
    const ty = t.y + pad
    const my = (sy + ty) / 2
    links.push({
      id: `${s.id}→${t.id}`,
      d: `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`,
    })
  })

  return { nodes, links, width: w, height: h }
}

function getVisibleRows(rows, collapsedIds) {
  if (!collapsedIds.size) return rows
  const collapsedSet = new Set()
  // BFS: find all descendants of collapsed nodes
  const byManager = {}
  rows.forEach(r => {
    if (r.manager_id) (byManager[r.manager_id] ||= []).push(r.id)
  })
  const queue = [...collapsedIds]
  while (queue.length) {
    const id = queue.shift()
    ;(byManager[id] || []).forEach(cid => {
      collapsedSet.add(cid)
      queue.push(cid)
    })
  }
  return rows.filter(r => !collapsedSet.has(r.id))
}

export default function OrgChart({ rows }) {
  const vpRef = useRef(null)
  const [tf, setTf] = useState({ x: 0, y: 0, scale: 1 })
  const pan = useRef({ active: false, lastX: 0, lastY: 0 })
  const [collapsed, setCollapsed] = useState(new Set())

  const toggleCollapse = useCallback(id => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const allByManager = useMemo(() => {
    const m = {}
    rows.forEach(r => { if (r.manager_id) (m[r.manager_id] ||= []).push(r.id) })
    return m
  }, [rows])

  const { nodes, links, width, height, error } = useMemo(() => {
    const visible = getVisibleRows(rows, collapsed)
    try { return { ...buildChart(visible, collapsed, allByManager), error: null } }
    catch (e) { return { nodes: [], links: [], width: 0, height: 0, error: e.message } }
  }, [rows, collapsed, allByManager])

  const fitToScreen = useCallback(() => {
    const vp = vpRef.current
    if (!vp || !width || !height) return
    const vw = vp.clientWidth
    const vh = vp.clientHeight
    const scale = Math.min(vw / width, vh / height) * 0.92
    setTf({ x: (vw - width * scale) / 2, y: 24, scale })
  }, [width, height])

  // On load: if chart fits at a readable scale, fit all; otherwise focus on root
  useEffect(() => {
    const vp = vpRef.current
    if (!vp || !width || !height || !nodes.length) return
    const vw = vp.clientWidth
    const vh = vp.clientHeight
    const fitScale = Math.min(vw / width, vh / height) * 0.92
    if (fitScale >= 0.28) {
      setTf({ x: (vw - width * fitScale) / 2, y: 24, scale: fitScale })
    } else {
      // Too small to read — center on root(s) at comfortable zoom
      const rootNodes = nodes.filter(n => n.isRoot)
      const cx = rootNodes.length === 1 ? rootNodes[0].x : width / 2
      const s = Math.min(0.7, vh / height * 0.88)
      setTf({ x: vw / 2 - cx * s, y: 24, scale: s })
    }
  }, [nodes, width, height])

  const onMouseDown = e => {
    if (e.button !== 0) return
    pan.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    e.preventDefault()
  }
  const onMouseMove = e => {
    if (!pan.current.active) return
    const dx = e.clientX - pan.current.lastX
    const dy = e.clientY - pan.current.lastY
    pan.current = { ...pan.current, lastX: e.clientX, lastY: e.clientY }
    setTf(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }
  const stopPan = () => { pan.current.active = false }

  const onWheel = e => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const rect = vpRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setTf(t => {
      const ns = Math.min(2.5, Math.max(0.15, t.scale * factor))
      return { scale: ns, x: mx - (mx - t.x) * ns / t.scale, y: my - (my - t.y) * ns / t.scale }
    })
  }

  const zoom = f => setTf(t => ({ ...t, scale: Math.min(2.5, Math.max(0.15, t.scale * f)) }))

  const filled = rows.filter(r => r.is_open !== 'true').length
  const open   = rows.length - filled
  const depts  = [...new Set(rows.map(r => r.department).filter(Boolean))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && <div className="error-banner">⚠ {error}</div>}

      <div
        ref={vpRef}
        className="chart-viewport"
        style={{ flex: 1, cursor: pan.current.active ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onWheel={onWheel}
      >
        <div
          className="chart-canvas"
          style={{ width, height, transform: `translate(${tf.x}px,${tf.y}px) scale(${tf.scale})` }}
        >
          <svg className="chart-svg" width={width} height={height}>
            {links.map(l => (
              <path key={l.id} d={l.d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
            ))}
          </svg>
          {nodes.map(n => <OrgNode key={n.id} node={n} width={NODE_W} height={NODE_H} onToggle={n.hasChildren ? toggleCollapse : null} />)}
        </div>

        <div className="legend">
          <div className="legend-title">Departments</div>
          {depts.map(d => (
            <div key={d} className="legend-item">
              <div className="legend-dot" style={{ background: getDeptColor(d) }} />
              {d}
            </div>
          ))}
          <div className="legend-item" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
            <div className="legend-dot" style={{ background: '#cbd5e1', border: '1px dashed #94a3b8' }} />
            Open position
          </div>
        </div>

        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => zoom(1.2)}>+</button>
          <button className="zoom-btn" onClick={() => zoom(0.8)}>−</button>
          <button className="zoom-btn" onClick={fitToScreen} style={{ fontSize: 11, fontWeight: 700 }}>⊡</button>
        </div>
      </div>

      <div className="status-bar">
        <div className="status-item"><div className="status-dot" style={{ background: '#4F46E5' }} /><strong>{rows.length}</strong> people total</div>
        <div className="status-item"><div className="status-dot" style={{ background: '#10b981' }} /><strong>{filled}</strong> filled</div>
        <div className="status-item"><div className="status-dot" style={{ background: '#f59e0b' }} /><strong>{open}</strong> open positions</div>
        <div className="status-item" style={{ marginLeft: 'auto' }}>Scroll to zoom · Drag to pan</div>
      </div>
    </div>
  )
}
