import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { stratify, tree as d3tree } from 'd3-hierarchy'
import OrgNode, { getDeptColor, DEPT_COLORS } from './OrgNode'

const NODE_W = 200
const NODE_H = 80
const H_GAP  = 28
const V_GAP  = 72

function buildChart(rows) {
  const root = stratify()
    .id(d => d.id)
    .parentId(d => d.manager_id || null)(rows)

  d3tree().nodeSize([NODE_W + H_GAP, NODE_H + V_GAP])(root)

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  root.each(n => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    minY = Math.min(minY, n.y)
    maxY = Math.max(maxY, n.y)
  })

  const pad = 60
  const offsetX = -minX + NODE_W / 2 + pad
  const w = maxX - minX + NODE_W + pad * 2
  const h = maxY - minY + NODE_H + pad * 2

  const nodes = []
  const links = []

  root.each(n => {
    nodes.push({ ...n, x: n.x + offsetX, y: n.y - minY + pad })
  })

  root.links().forEach(({ source: s, target: t }) => {
    const sx = s.x + offsetX
    const sy = s.y - minY + pad + NODE_H
    const tx = t.x + offsetX
    const ty = t.y - minY + pad
    const my = (sy + ty) / 2
    links.push({
      id: `${s.id}→${t.id}`,
      d: `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`,
      color: getDeptColor(t.data.department),
    })
  })

  return { nodes, links, width: w, height: h }
}

export default function OrgChart({ rows }) {
  const vpRef = useRef(null)
  const [tf, setTf] = useState({ x: 0, y: 0, scale: 1 })
  const pan = useRef({ active: false, lastX: 0, lastY: 0 })

  const { nodes, links, width, height, error } = useMemo(() => {
    try {
      return { ...buildChart(rows), error: null }
    } catch (e) {
      return { nodes: [], links: [], width: 0, height: 0, error: e.message }
    }
  }, [rows])

  const fitToScreen = useCallback(() => {
    const vp = vpRef.current
    if (!vp || !nodes.length) return
    const vw = vp.clientWidth
    const vh = vp.clientHeight
    const scaleToFit = Math.min(vw / width, vh / height) * 0.88
    if (scaleToFit >= 0.55) {
      // Chart fits comfortably — center it
      setTf({ x: (vw - width * scaleToFit) / 2, y: (vh - height * scaleToFit) / 2, scale: scaleToFit })
    } else {
      // Chart is too wide — center on root node at comfortable zoom
      const root = nodes.find(n => n.depth === 0)
      const scale = 0.72
      const x = vw / 2 - (root?.x ?? width / 2) * scale
      setTf({ x, y: 48, scale })
    }
  }, [nodes, width, height])

  useEffect(() => { fitToScreen() }, [fitToScreen])

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    pan.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    e.preventDefault()
  }
  const onMouseMove = (e) => {
    if (!pan.current.active) return
    const dx = e.clientX - pan.current.lastX
    const dy = e.clientY - pan.current.lastY
    pan.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    setTf(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }
  const stopPan = () => { pan.current.active = false }

  const onWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const vp = vpRef.current
    const rect = vp.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setTf(t => {
      const ns = Math.min(2.5, Math.max(0.2, t.scale * factor))
      return {
        scale: ns,
        x: mx - (mx - t.x) * (ns / t.scale),
        y: my - (my - t.y) * (ns / t.scale),
      }
    })
  }

  const zoom = (factor) => setTf(t => ({ ...t, scale: Math.min(2.5, Math.max(0.2, t.scale * factor)) }))

  const filled = rows.filter(r => r.is_open !== 'true').length
  const open   = rows.length - filled
  const depts  = [...new Set(rows.map(r => r.department).filter(Boolean))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && <div className="error-banner">⚠ {error}</div>}

      <div
        ref={vpRef}
        className="chart-viewport"
        style={{ flex: 1 }}
        style={{ cursor: pan.current.active ? 'grabbing' : 'grab' }}
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
            <defs>
              <marker id="dot" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5">
                <circle cx="1.5" cy="1.5" r="1.5" fill="#cbd5e1" />
              </marker>
            </defs>
            {links.map(l => (
              <path key={l.id} d={l.d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
            ))}
          </svg>

          {nodes.map(n => (
            <OrgNode key={n.id} node={n} width={NODE_W} height={NODE_H} />
          ))}
        </div>

        {/* Legend */}
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

        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => zoom(1.2)} title="Zoom in">+</button>
          <button className="zoom-btn" onClick={() => zoom(0.8)} title="Zoom out">−</button>
          <button className="zoom-btn" onClick={fitToScreen} title="Fit to screen" style={{ fontSize: 11, fontWeight: 700 }}>⊡</button>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-item">
          <div className="status-dot" style={{ background: '#4F46E5' }} />
          <strong>{rows.length}</strong> people total
        </div>
        <div className="status-item">
          <div className="status-dot" style={{ background: '#10b981' }} />
          <strong>{filled}</strong> filled
        </div>
        <div className="status-item">
          <div className="status-dot" style={{ background: '#f59e0b', border: '1px dashed #94a3b8' }} />
          <strong>{open}</strong> open positions
        </div>
        <div className="status-item" style={{ marginLeft: 'auto' }}>
          Scroll to zoom · Drag to pan
        </div>
      </div>
    </div>
  )
}
