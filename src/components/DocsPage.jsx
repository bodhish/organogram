export default function DocsPage({ onBack }) {
  return (
    <div className="docs">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Home
          </button>
          <div className="header-divider" />
          <span className="docs-header-title">Documentation</span>
        </div>
      </header>

      <div className="docs-body">
        <div className="docs-content">

          <div className="docs-hero">
            <h1 className="docs-h1">How to use Organogram</h1>
            <p className="docs-lead">
              Organogram turns a simple CSV file into an interactive org chart. No account needed — your data lives in the URL or in your browser.
            </p>
          </div>

          <nav className="docs-toc">
            <span className="docs-toc-label">On this page</span>
            <a href="#csv-format">CSV format</a>
            <a href="#open-positions">Open positions</a>
            <a href="#bulk-positions">Bulk open positions (N×)</a>
            <a href="#departments">Departments & colours</a>
            <a href="#editing">Editing data</a>
            <a href="#sharing">Sharing & persistence</a>
            <a href="#navigation">Navigation</a>
          </nav>

          <section id="csv-format" className="docs-section">
            <h2 className="docs-h2">CSV format</h2>
            <p>Upload any <code>.csv</code> file with these six columns. The order doesn't matter — just match the header names exactly.</p>

            <table className="docs-table">
              <thead>
                <tr><th>Column</th><th>Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>id</code></td>
                  <td><span className="docs-badge docs-badge--blue">required</span></td>
                  <td>Unique identifier for each row. Any string or number works — just keep them unique.</td>
                </tr>
                <tr>
                  <td><code>name</code></td>
                  <td><span className="docs-badge docs-badge--blue">required</span></td>
                  <td>Person's name displayed on their card. Use <code>N× Role</code> syntax to create multiple open-position cards at once (see below).</td>
                </tr>
                <tr>
                  <td><code>title</code></td>
                  <td><span className="docs-badge docs-badge--grey">optional</span></td>
                  <td>Job title shown below the name on the card.</td>
                </tr>
                <tr>
                  <td><code>department</code></td>
                  <td><span className="docs-badge docs-badge--grey">optional</span></td>
                  <td>Department name. Controls the colour of the card's left accent bar and the legend.</td>
                </tr>
                <tr>
                  <td><code>manager_id</code></td>
                  <td><span className="docs-badge docs-badge--grey">optional</span></td>
                  <td>The <code>id</code> of this person's manager. Leave blank for the root node (CEO / top of tree).</td>
                </tr>
                <tr>
                  <td><code>is_open</code></td>
                  <td><span className="docs-badge docs-badge--grey">optional</span></td>
                  <td>Set to <code>true</code> to mark this as an unfilled open position. The card renders with a dashed border and muted text.</td>
                </tr>
              </tbody>
            </table>

            <p className="docs-subhead">Minimal example</p>
            <pre className="docs-code"><code>{`id,name,title,department,manager_id,is_open
1,Alex Morgan,CEO,Leadership,,false
2,Sam Rivera,CTO,Engineering,1,false
3,Jordan Lee,Lead Designer,Design,1,false
4,Dana Park,Backend Engineer,Engineering,2,false
5,Backend Engineer,Backend Engineer,Engineering,2,true`}</code></pre>
          </section>

          <section id="open-positions" className="docs-section">
            <h2 className="docs-h2">Open positions</h2>
            <p>
              Set <code>is_open</code> to <code>true</code> on any row to mark it as an unfilled role.
              Open positions are rendered with a dashed border, muted grey name, and a faded department bar — making it easy to see gaps at a glance.
            </p>
            <pre className="docs-code"><code>{`id,name,title,department,manager_id,is_open
8,Open Role,Senior Designer,Design,3,true`}</code></pre>
            <p>You can give open positions a descriptive name like <code>Open Role</code> or <code>Sr. Backend Engineer</code> — whatever makes sense for your chart.</p>
          </section>

          <section id="bulk-positions" className="docs-section">
            <h2 className="docs-h2">Bulk open positions (N×)</h2>
            <p>
              When you have multiple identical open roles, use the <strong>N× syntax</strong> in the <code>name</code> field.
              Organogram expands a single row into <em>N</em> individual open-position cards automatically.
            </p>
            <pre className="docs-code"><code>{`id,name,title,department,manager_id,is_open
19,3× Frontend Engineers,Frontend Engineer,Engineering,9,true`}</code></pre>
            <p>The row above becomes <strong>three</strong> separate "Open Position" cards, each reporting to id <code>9</code>. This keeps your CSV compact while accurately representing headcount.</p>

            <div className="docs-callout">
              <strong>Tip:</strong> You can use either <code>×</code> (multiplication sign) or <code>x</code> (letter x) — both work. Case is ignored too, so <code>3x frontend engineers</code> and <code>3× Frontend Engineers</code> are equivalent.
            </div>
          </section>

          <section id="departments" className="docs-section">
            <h2 className="docs-h2">Departments &amp; colours</h2>
            <p>
              Departments are detected automatically from your data — no setup needed.
              Each unique department name is assigned a colour from a built-in palette.
              The colour appears as the left accent bar on each card and in the legend.
            </p>
            <p>
              Keep department names consistent across rows — <code>Engineering</code> and <code>engineering</code> will be treated as different departments.
            </p>
          </section>

          <section id="editing" className="docs-section">
            <h2 className="docs-h2">Editing data</h2>
            <p>
              Click <strong>Edit Data</strong> in the chart header to open a spreadsheet-style panel.
              You can edit names, titles, departments, reporting lines, and open-position status without touching a CSV file.
            </p>
            <ul className="docs-list">
              <li><strong>Reports To</strong> — dropdown of all people in the chart. Change a person's manager to restructure the tree.</li>
              <li><strong>Open</strong> — checkbox to toggle a position between filled and open.</li>
              <li><strong>+ Add person</strong> — appends a new row at the bottom.</li>
              <li><strong>× Delete</strong> — removes a row. Any direct reports will become orphaned; give them a new manager first.</li>
            </ul>
            <p>Changes are reflected in the chart immediately and saved to the URL so they aren't lost on refresh.</p>
          </section>

          <section id="sharing" className="docs-section">
            <h2 className="docs-h2">Sharing &amp; persistence</h2>
            <p>Organogram has two persistence mechanisms:</p>

            <p className="docs-subhead">Shareable links</p>
            <p>
              Click <strong>Copy link</strong> to get a URL that encodes your entire CSV as a URL-safe base64 hash.
              Anyone with the link can view the chart — no account, no server, no expiry.
              The data lives entirely in the URL.
            </p>

            <p className="docs-subhead">Local storage (saved organograms)</p>
            <p>
              Click <strong>Save</strong> (or <strong>Update</strong> for a previously saved chart) to persist it in your browser's local storage.
              Saved charts appear on the home page and are available across sessions on the same device and browser.
            </p>

            <div className="docs-callout docs-callout--warning">
              <strong>Note:</strong> Local storage is browser-specific. Clearing your browser data will remove saved organograms. Use <em>Copy link</em> for a durable, portable backup.
            </div>
          </section>

          <section id="navigation" className="docs-section">
            <h2 className="docs-h2">Navigation</h2>
            <ul className="docs-list">
              <li><strong>Zoom</strong> — scroll (or trackpad pinch) to zoom in and out. Zoom is centred on your cursor.</li>
              <li><strong>Pan</strong> — click and drag anywhere on the canvas to move around.</li>
              <li><strong>Fit to screen</strong> — click the <code>⊡</code> button (bottom-right) to fit the entire chart into the viewport.</li>
              <li><strong>+ / −</strong> — use the zoom buttons for precise zoom steps.</li>
            </ul>
          </section>

          <section className="docs-section docs-section--last">
            <h2 className="docs-h2">Contributing</h2>
            <p>
              Organogram is open source. Bug reports, feature requests, and pull requests are all welcome on{' '}
              <a href="https://github.com/bodhish/organogram" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
